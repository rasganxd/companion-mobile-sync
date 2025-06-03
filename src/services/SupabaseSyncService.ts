
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getDatabaseAdapter } from './DatabaseAdapter';

export interface SyncProgress {
  total: number;
  processed: number;
  type: 'upload' | 'download';
}

export interface SyncStatus {
  lastSync: Date | null;
  inProgress: boolean;
  pendingUploads: number;
  pendingDownloads: number;
  connected: boolean;
}

class SupabaseSyncService {
  private static instance: SupabaseSyncService;
  private dbService = getDatabaseAdapter();
  private syncInProgress: boolean = false;
  private lastSync: Date | null = null;
  private pendingUploads: number = 0;
  private pendingDownloads: number = 0;
  private connected: boolean = false;

  private onProgressCallback: ((progress: SyncProgress) => void) | null = null;
  private onStatusChangeCallback: ((status: SyncStatus) => void) | null = null;

  private constructor() {
    this.checkConnection();
    this.loadLastSyncTime();
  }

  static getInstance(): SupabaseSyncService {
    if (!SupabaseSyncService.instance) {
      SupabaseSyncService.instance = new SupabaseSyncService();
    }
    return SupabaseSyncService.instance;
  }

  private loadLastSyncTime(): void {
    try {
      const lastSyncString = localStorage.getItem('lastSupabaseSync');
      if (lastSyncString) {
        this.lastSync = new Date(lastSyncString);
        console.log('📅 Loaded last Supabase sync time:', this.lastSync);
      }
    } catch (error) {
      console.error('❌ Error loading last sync time:', error);
    }
  }

  private saveLastSyncTime(): void {
    try {
      if (this.lastSync) {
        localStorage.setItem('lastSupabaseSync', this.lastSync.toISOString());
        console.log('💾 Saved last Supabase sync time:', this.lastSync);
      }
    } catch (error) {
      console.error('❌ Error saving last sync time:', error);
    }
  }

  private async checkConnection(): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      this.connected = !!session;
      console.log('📶 Supabase connection status:', this.connected ? 'Connected' : 'Disconnected');
    } catch (error) {
      console.error('❌ Error checking Supabase connection:', error);
      this.connected = false;
    }
    this.notifyStatusChange();
  }

  private notifyProgress(progress: SyncProgress): void {
    if (this.onProgressCallback) {
      this.onProgressCallback(progress);
    }
  }

  private notifyStatusChange(): void {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(this.getStatus());
    }
  }

  onProgress(callback: (progress: SyncProgress) => void): void {
    this.onProgressCallback = callback;
  }

  onStatusChange(callback: (status: SyncStatus) => void): void {
    this.onStatusChangeCallback = callback;
    callback(this.getStatus());
  }

  getStatus(): SyncStatus {
    return {
      lastSync: this.lastSync,
      inProgress: this.syncInProgress,
      pendingUploads: this.pendingUploads,
      pendingDownloads: this.pendingDownloads,
      connected: this.connected
    };
  }

  async getSyncDataForCurrentUser(): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('🔄 Fetching sync data for user:', user.id);

      const { data, error } = await supabase.rpc('get_sync_data_for_sales_rep', {
        p_sales_rep_id: user.id,
        p_last_sync: this.lastSync?.toISOString()
      });

      if (error) {
        console.error('❌ Error fetching sync data:', error);
        throw error;
      }

      console.log('✅ Sync data retrieved:', data);
      return data[0]; // Function returns array with single row
    } catch (error) {
      console.error('❌ Error in getSyncDataForCurrentUser:', error);
      throw error;
    }
  }

  async uploadPendingOrders(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const pendingOrders = await this.dbService.getPendingOrders();
      console.log('📤 Uploading pending orders:', pendingOrders.length);

      let uploaded = 0;
      for (const order of pendingOrders) {
        try {
          // Transform local order to orders_mobile format
          const mobileOrder = {
            customer_id: order.customer_id,
            customer_name: order.customer_name,
            sales_rep_id: user.id,
            date: order.date,
            status: order.status || 'pending',
            total: order.total,
            notes: order.notes || '',
            payment_method: order.payment_method || '',
            sync_status: 'pending_import'
          };

          const { data, error } = await supabase
            .from('orders_mobile')
            .insert(mobileOrder)
            .select()
            .single();

          if (error) {
            console.error('❌ Error uploading order:', error);
            await this.dbService.updateSyncStatus('orders', order.id, 'error');
            continue;
          }

          // Upload order items if they exist
          if (order.items && order.items.length > 0) {
            const orderItems = order.items.map(item => ({
              order_id: data.id,
              product_name: item.product_name,
              product_code: item.product_code,
              quantity: item.quantity,
              unit_price: item.unit_price,
              price: item.price,
              total: item.total
            }));

            const { error: itemsError } = await supabase
              .from('order_items_mobile')
              .insert(orderItems);

            if (itemsError) {
              console.error('❌ Error uploading order items:', itemsError);
              // Delete the order if items failed
              await supabase.from('orders_mobile').delete().eq('id', data.id);
              await this.dbService.updateSyncStatus('orders', order.id, 'error');
              continue;
            }
          }

          await this.dbService.updateSyncStatus('orders', order.id, 'transmitted');
          uploaded++;

          this.notifyProgress({
            total: pendingOrders.length,
            processed: uploaded,
            type: 'upload'
          });

        } catch (error) {
          console.error('❌ Error processing order:', order.id, error);
          await this.dbService.updateSyncStatus('orders', order.id, 'error');
        }
      }

      console.log(`✅ Successfully uploaded ${uploaded}/${pendingOrders.length} orders`);
      return uploaded > 0;

    } catch (error) {
      console.error('❌ Error in uploadPendingOrders:', error);
      return false;
    }
  }

  async downloadUpdatedData(): Promise<boolean> {
    try {
      const syncData = await this.getSyncDataForCurrentUser();
      
      if (!syncData) {
        console.log('ℹ️ No sync data available');
        return false;
      }

      const { products_updated, customers_updated } = syncData;
      let totalUpdated = 0;

      // Update products
      if (products_updated && products_updated.length > 0) {
        console.log('📥 Updating products:', products_updated.length);
        for (const product of products_updated) {
          await this.dbService.saveProduct(product);
          totalUpdated++;
        }
      }

      // Update customers
      if (customers_updated && customers_updated.length > 0) {
        console.log('📥 Updating customers:', customers_updated.length);
        for (const customer of customers_updated) {
          await this.dbService.saveClient(customer);
          totalUpdated++;
        }
      }

      this.notifyProgress({
        total: totalUpdated,
        processed: totalUpdated,
        type: 'download'
      });

      console.log(`✅ Successfully downloaded ${totalUpdated} records`);
      return totalUpdated > 0;

    } catch (error) {
      console.error('❌ Error in downloadUpdatedData:', error);
      return false;
    }
  }

  async sync(): Promise<boolean> {
    if (this.syncInProgress) {
      console.log('⚠️ Sync already in progress');
      return false;
    }

    try {
      this.syncInProgress = true;
      this.notifyStatusChange();

      console.log('🔄 Starting Supabase sync...');
      toast.info("Iniciando sincronização...");

      await this.checkConnection();
      if (!this.connected) {
        toast.error("Não foi possível conectar ao Supabase");
        return false;
      }

      // Upload pending orders first
      const uploadSuccess = await this.uploadPendingOrders();
      
      // Then download updated data
      const downloadSuccess = await this.downloadUpdatedData();

      if (uploadSuccess || downloadSuccess) {
        this.lastSync = new Date();
        this.saveLastSyncTime();
        this.notifyStatusChange();
        
        toast.success("Sincronização concluída com sucesso");
        await this.dbService.logSync('supabase_full', 'success');
        return true;
      } else {
        toast.info("Nenhuma atualização disponível");
        return false;
      }

    } catch (error) {
      console.error('❌ Supabase sync error:', error);
      toast.error("Erro na sincronização");
      await this.dbService.logSync('supabase_full', 'error', String(error));
      return false;
    } finally {
      this.syncInProgress = false;
      this.notifyStatusChange();
    }
  }

  async refreshConnection(): Promise<boolean> {
    await this.checkConnection();
    return this.connected;
  }
}

export default SupabaseSyncService;
