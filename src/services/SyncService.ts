import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { getDatabaseAdapter } from './DatabaseAdapter';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

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

export interface SyncSettings {
  autoSync: boolean;
  syncInterval: number;
  syncOnWifiOnly: boolean;
  syncEnabled: boolean;
}

export interface SyncUpdate {
  id: string;
  description: string | null;
  data_types: string[];
  created_at: string;
  metadata: Record<string, any>;
  created_by_user: string | null;
}

export interface ApiConfig {
  baseUrl: string;
  token: string;
  vendorId: string;
  endpoints: {
    download: string;
    upload: string;
  };
}

class SyncService {
  private static instance: SyncService;
  private dbService = getDatabaseAdapter();
  private apiUrl: string = 'https://preview--vendas-fortes.lovable.app/api';
  private apiConfig: ApiConfig | null = null;
  private syncInProgress: boolean = false;
  private syncSettings: SyncSettings = {
    autoSync: true,
    syncInterval: 30, // 30 minutes
    syncOnWifiOnly: true,
    syncEnabled: true
  };
  
  private lastSync: Date | null = null;
  private pendingUploads: number = 0;
  private pendingDownloads: number = 0;
  private connected: boolean = false;
  private autoSyncTimer: ReturnType<typeof setInterval> | null = null;

  private onProgressCallback: ((progress: SyncProgress) => void) | null = null;
  private onStatusChangeCallback: ((status: SyncStatus) => void) | null = null;
  
  private constructor() {
    this.checkConnection();
    this.loadSettings();
    this.loadApiConfig();
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  private async loadSettings(): Promise<void> {
    // Load last sync time from localStorage
    this.loadLastSyncTime();
    
    // In a real app, load sync settings from localStorage or preferences
    // For now we just use defaults
    this.setupAutoSync();
  }

  private loadLastSyncTime(): void {
    try {
      const lastSyncString = localStorage.getItem('lastSyncTime');
      if (lastSyncString) {
        this.lastSync = new Date(lastSyncString);
        console.log('📅 Loaded last sync time from localStorage:', this.lastSync);
      } else {
        console.log('📅 No previous sync time found in localStorage');
      }
    } catch (error) {
      console.error('❌ Error loading last sync time:', error);
    }
  }

  private saveLastSyncTime(): void {
    try {
      if (this.lastSync) {
        localStorage.setItem('lastSyncTime', this.lastSync.toISOString());
        console.log('💾 Saved last sync time to localStorage:', this.lastSync);
      }
    } catch (error) {
      console.error('❌ Error saving last sync time:', error);
    }
  }

  private setupAutoSync(): void {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }

    if (this.syncSettings.autoSync && this.syncSettings.syncEnabled) {
      const interval = this.syncSettings.syncInterval * 60 * 1000;
      this.autoSyncTimer = setInterval(() => {
        if (this.connected && !this.syncInProgress) {
          if (this.syncSettings.syncOnWifiOnly) {
            this.checkWifiAndSync();
          } else {
            this.sync();
          }
        }
      }, interval);
    }
  }

  private async checkWifiAndSync(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        const status = await Network.getStatus();
        if (status.connected && status.connectionType === 'wifi') {
          this.sync();
        } else {
          console.log('🚫 Not on WiFi, skipping auto-sync');
        }
      } catch (error) {
        console.error('❌ Error checking WiFi status:', error);
      }
    } else {
      // Para web, assumir que está conectado
      if (navigator.onLine) {
        this.sync();
      }
    }
  }

  private async loadApiConfig(): Promise<void> {
    try {
      const savedConfig = localStorage.getItem('api_config');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        if (config.type === 'api_mobile_config') {
          this.apiConfig = {
            baseUrl: config.servidor,
            token: config.token,
            vendorId: config.vendedor_id,
            endpoints: config.endpoints
          };
          this.apiUrl = this.apiConfig.baseUrl;
          console.log('API configuration loaded from QR code:', this.apiConfig);
        }
      }
    } catch (error) {
      console.error('Error loading API config:', error);
    }
  }

  async checkForActiveUpdates(): Promise<SyncUpdate | null> {
    try {
      console.log('🔍 Checking for active sync updates...');
      
      const { data, error } = await supabase
        .from('sync_updates')
        .select('id, description, data_types, created_at, metadata, created_by_user')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error checking for active updates:', error);
        return null;
      }

      if (data && data.length > 0) {
        console.log('✅ Found active sync update:', data[0]);
        return data[0] as SyncUpdate;
      }

      console.log('ℹ️ No active sync updates found');
      return null;
    } catch (error) {
      console.error('Error checking for active updates:', error);
      return null;
    }
  }

  async consumeUpdate(updateId: string): Promise<boolean> {
    try {
      console.log('🔄 Consuming sync update:', updateId);
      
      const { error } = await supabase
        .from('sync_updates')
        .update({ 
          is_active: false, 
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', updateId);

      if (error) {
        console.error('Error consuming update:', error);
        return false;
      }

      console.log('✅ Successfully consumed sync update');
      return true;
    } catch (error) {
      console.error('Error consuming update:', error);
      return false;
    }
  }

  private async checkConnection(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        // Usar Capacitor Network em apps nativos
        const status = await Network.getStatus();
        this.connected = status.connected;
        console.log('📶 Network status (native):', status);
      } else {
        // Fallback para método web
        try {
          const response = await fetch(`${this.apiUrl}/ping`);
          this.connected = response.ok;
        } catch {
          this.connected = navigator.onLine;
        }
        console.log('📶 Network status (web):', this.connected);
      }
    } catch (error) {
      console.error('❌ Error checking connection:', error);
      this.connected = false;
    }
    this.notifyStatusChange();
  }

  private async countPendingItems(): Promise<void> {
    const tables = ['clients', 'orders', 'visit_routes'];
    let uploadCount = 0;
    
    for (const table of tables) {
      const pendingItems = await this.dbService.getPendingSyncItems(table);
      uploadCount += pendingItems.length;
    }
    
    this.pendingUploads = uploadCount;
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
    // Immediately notify with current status
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

  async getSyncSettings(): Promise<SyncSettings> {
    return this.syncSettings;
  }

  async updateSyncSettings(settings: Partial<SyncSettings>): Promise<void> {
    this.syncSettings = { ...this.syncSettings, ...settings };
    this.setupAutoSync();
    // In a real app, save to localStorage or preferences
  }

  async updateApiConfig(config: ApiConfig): Promise<void> {
    this.apiConfig = config;
    this.apiUrl = config.baseUrl;
    console.log('API configuration updated:', config);
  }

  async sync(): Promise<boolean> {
    if (this.syncInProgress) return false;
    
    try {
      this.syncInProgress = true;
      this.notifyStatusChange();

      // Check connection first
      await this.checkConnection();
      if (!this.connected) {
        toast.error("Não foi possível conectar ao servidor");
        return false;
      }

      // Check for active updates before proceeding
      const activeUpdate = await this.checkForActiveUpdates();
      if (!activeUpdate) {
        toast.info("Nenhuma atualização disponível");
        return false;
      }

      console.log('🔄 Starting sync with active update:', activeUpdate.id);
      console.log('📋 Update metadata:', activeUpdate.metadata);
      console.log('📦 Data types to sync:', activeUpdate.data_types);
      
      toast.info("Iniciando sincronização...");

      // Count pending items for upload
      await this.countPendingItems();

      // Upload pending data to server
      await this.uploadData();

      // Download new data from server based on active update
      await this.downloadData(activeUpdate);

      // Mark update as consumed
      const consumed = await this.consumeUpdate(activeUpdate.id);
      if (!consumed) {
        console.warn('Failed to mark update as consumed');
      }

      // Update last sync time and save to localStorage
      this.lastSync = new Date();
      this.saveLastSyncTime();
      this.notifyStatusChange();
      
      toast.success("Sincronização concluída com sucesso");
      await this.dbService.logSync('full', 'success');
      return true;
    } catch (error) {
      console.error('Sync error:', error);
      toast.error("Erro na sincronização");
      await this.dbService.logSync('full', 'error', String(error));
      return false;
    } finally {
      this.syncInProgress = false;
      this.notifyStatusChange();
    }
  }

  private async uploadData(): Promise<void> {
    // Use configured endpoints if available
    const baseUrl = this.apiConfig ? this.apiConfig.baseUrl : this.apiUrl;
    const uploadEndpoint = this.apiConfig?.endpoints?.upload || '';
    
    const tables = ['clients', 'orders', 'visit_routes'];
    let totalUploaded = 0;
    let totalToUpload = this.pendingUploads;

    for (const table of tables) {
      const pendingItems = await this.dbService.getPendingSyncItems(table);
      
      for (const item of pendingItems) {
        try {
          const url = this.apiConfig ? 
            `${baseUrl}${uploadEndpoint}/${table}` : 
            `${baseUrl}/${table}`;
            
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          
          if (this.apiConfig?.token) {
            headers['Authorization'] = `Bearer ${this.apiConfig.token}`;
          }

          const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(item)
          });

          if (response.ok) {
            await this.dbService.updateSyncStatus(table, item.id, 'synced');
          } else {
            throw new Error(`Server returned ${response.status}`);
          }
        } catch (error) {
          console.error(`Error uploading ${table} item:`, error);
          await this.dbService.updateSyncStatus(table, item.id, 'error');
        }
        
        totalUploaded++;
        this.notifyProgress({
          total: totalToUpload,
          processed: totalUploaded,
          type: 'upload'
        });
      }
    }
  }

  private async downloadData(activeUpdate: SyncUpdate): Promise<void> {
    console.log('📥 Starting data download for update:', activeUpdate.id);
    console.log('📋 Update metadata:', activeUpdate.metadata);
    console.log('📦 Data types to download:', activeUpdate.data_types);
    
    const dataTypesToDownload = activeUpdate.data_types;
    const metadata = activeUpdate.metadata || {};
    
    // Extract specific IDs from metadata to filter downloads
    const salesRepIds = metadata.sales_rep_ids || [];
    const customerIds = metadata.customer_ids || [];
    const productIds = metadata.product_ids || [];
    
    console.log('🎯 Filtering by:', {
      salesRepIds: salesRepIds.length > 0 ? salesRepIds : 'all',
      customerIds: customerIds.length > 0 ? customerIds : 'all',
      productIds: productIds.length > 0 ? productIds : 'all'
    });
    
    let totalDownloaded = 0;
    const totalToDownload = dataTypesToDownload.length;
    
    for (const dataType of dataTypesToDownload) {
      try {
        console.log(`📥 Downloading ${dataType}...`);
        
        switch (dataType) {
          case 'customers':
            await this.downloadCustomers(salesRepIds, customerIds);
            break;
          case 'products':
            await this.downloadProducts(productIds);
            break;
          case 'payment_tables':
            await this.downloadPaymentTables();
            break;
          case 'sales_reps':
            await this.downloadSalesReps(salesRepIds);
            break;
          default:
            console.warn(`⚠️ Unknown data type: ${dataType}`);
        }
        
        totalDownloaded++;
        this.notifyProgress({
          total: totalToDownload,
          processed: totalDownloaded,
          type: 'download'
        });
        
        console.log(`✅ Successfully downloaded ${dataType}`);
      } catch (error) {
        console.error(`❌ Error downloading ${dataType}:`, error);
      }
    }
    
    console.log(`📊 Download complete: ${totalDownloaded}/${totalToDownload} data types processed`);
  }

  private async downloadCustomers(salesRepIds: string[], customerIds: string[]): Promise<void> {
    try {
      let query = supabase.from('customers').select('*');
      
      // Filter by specific sales rep IDs if provided
      if (salesRepIds.length > 0) {
        console.log('🎯 Filtering customers by sales_rep_ids:', salesRepIds);
        query = query.in('sales_rep_id', salesRepIds);
      }
      
      // Additional filter by customer IDs if provided
      if (customerIds.length > 0) {
        console.log('🎯 Additional filtering by customer_ids:', customerIds);
        query = query.in('id', customerIds);
      }
      
      const { data: customers, error } = await query;
      
      if (error) {
        throw new Error(`Failed to fetch customers: ${error.message}`);
      }
      
      console.log(`📥 Downloaded ${customers?.length || 0} customers`);
      
      // Save to local database
      if (customers && customers.length > 0) {
        for (const customer of customers) {
          await this.dbService.saveClient(customer);
        }
      }
    } catch (error) {
      console.error('Error downloading customers:', error);
      throw error;
    }
  }

  private async downloadProducts(productIds: string[]): Promise<void> {
    try {
      let query = supabase.from('products').select('*');
      
      // Filter by specific product IDs if provided
      if (productIds.length > 0) {
        console.log('🎯 Filtering products by product_ids:', productIds);
        query = query.in('id', productIds);
      }
      
      const { data: products, error } = await query;
      
      if (error) {
        throw new Error(`Failed to fetch products: ${error.message}`);
      }
      
      console.log(`📥 Downloaded ${products?.length || 0} products`);
      
      // Save to local database
      if (products && products.length > 0) {
        for (const product of products) {
          await this.dbService.saveProduct(product);
        }
      }
    } catch (error) {
      console.error('Error downloading products:', error);
      throw error;
    }
  }

  private async downloadPaymentTables(): Promise<void> {
    try {
      const { data: paymentTables, error } = await supabase
        .from('payment_tables')
        .select('*')
        .eq('active', true);
      
      if (error) {
        throw new Error(`Failed to fetch payment tables: ${error.message}`);
      }
      
      console.log(`📥 Downloaded ${paymentTables?.length || 0} payment tables`);
      
      // Save to local database
      if (paymentTables && paymentTables.length > 0) {
        for (const paymentTable of paymentTables) {
          await this.dbService.savePaymentTable(paymentTable);
        }
      }
    } catch (error) {
      console.error('Error downloading payment tables:', error);
      throw error;
    }
  }

  private async downloadSalesReps(salesRepIds: string[]): Promise<void> {
    try {
      let query = supabase.from('sales_reps').select('*').eq('active', true);
      
      // Filter by specific sales rep IDs if provided
      if (salesRepIds.length > 0) {
        console.log('🎯 Filtering sales reps by sales_rep_ids:', salesRepIds);
        query = query.in('id', salesRepIds);
      }
      
      const { data: salesReps, error } = await query;
      
      if (error) {
        throw new Error(`Failed to fetch sales reps: ${error.message}`);
      }
      
      console.log(`📥 Downloaded ${salesReps?.length || 0} sales reps`);
      
      // Save to local database (if the database adapter supports it)
      if (salesReps && salesReps.length > 0) {
        for (const salesRep of salesReps) {
          // Only save if the database adapter has this method
          if (typeof this.dbService.saveSalesRep === 'function') {
            await this.dbService.saveSalesRep(salesRep);
          }
        }
      }
    } catch (error) {
      console.error('Error downloading sales reps:', error);
      throw error;
    }
  }

  async refreshConnection(): Promise<boolean> {
    await this.checkConnection();
    return this.connected;
  }
}

export default SyncService;
