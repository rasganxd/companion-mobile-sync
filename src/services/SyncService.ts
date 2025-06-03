import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { getDatabaseAdapter } from './DatabaseAdapter';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';
import SupabaseSyncService from './SupabaseSyncService';

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
  useSupabaseSync: boolean; // NEW: Option to use Supabase sync
}

export interface ApiConfig {
  token: string;
  apiUrl: string;
}

class SyncService {
  private static instance: SyncService;
  private dbService = getDatabaseAdapter();
  private supabaseSyncService = SupabaseSyncService.getInstance();
  private apiConfig: ApiConfig | null = null;
  private syncInProgress: boolean = false;
  private syncSettings: SyncSettings = {
    autoSync: true,
    syncInterval: 30, // 30 minutes
    syncOnWifiOnly: true,
    syncEnabled: true,
    useSupabaseSync: true // Default to Supabase sync
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
    this.loadLastSyncTime();
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
        if (this.connected && !this.syncInProgress && this.apiConfig) {
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
      if (navigator.onLine) {
        this.sync();
      }
    }
  }

  private async loadApiConfig(): Promise<void> {
    try {
      const savedSession = localStorage.getItem('mobile_session');
      if (savedSession) {
        const session = JSON.parse(savedSession);
        if (session.apiConfig) {
          this.apiConfig = {
            token: session.apiConfig.token,
            apiUrl: session.apiConfig.apiUrl
          };
          console.log('✅ API configuration loaded from session:', {
            apiUrl: this.apiConfig.apiUrl,
            tokenLength: this.apiConfig.token.length
          });
        }
      }
    } catch (error) {
      console.error('❌ Error loading API config:', error);
    }
  }

  // Simular endpoint de verificação de atualizações usando GET /
  async checkForActiveUpdates(): Promise<any> {
    // Check if using Supabase sync first
    if (this.syncSettings.useSupabaseSync) {
      try {
        console.log('🔍 Checking for Supabase sync updates...');
        
        // Use Supabase sync service to check for updates
        const syncData = await this.supabaseSyncService.getSyncDataForCurrentUser();
        
        if (syncData && (
          (syncData.products_updated && syncData.products_updated.length > 0) ||
          (syncData.customers_updated && syncData.customers_updated.length > 0)
        )) {
          console.log('✅ Found Supabase updates available');
          return {
            id: 'supabase-sync',
            description: 'Atualizações disponíveis via Supabase',
            data_types: ['products', 'customers'],
            created_at: new Date().toISOString(),
            metadata: { 
              type: 'supabase',
              products_count: syncData.products_updated?.length || 0,
              customers_count: syncData.customers_updated?.length || 0
            }
          };
        }

        console.log('ℹ️ No Supabase updates found');
        return null;
      } catch (error) {
        console.error('❌ Error checking Supabase updates:', error);
        // Fall back to API sync if Supabase fails
      }
    }

    // Fallback to original API sync logic
    if (!this.apiConfig) {
      console.log('❌ No API config available for checking updates');
      return null;
    }

    try {
      console.log('🔍 Checking for active sync updates via orders API...');
      
      const response = await fetch(`${this.apiConfig.apiUrl}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiConfig.token}`
        }
      });

      if (!response.ok) {
        console.error('❌ Failed to check for updates:', response.status, response.statusText);
        return null;
      }

      const orders = await response.json();
      
      // Se há pedidos na API, consideramos como uma "atualização disponível"
      if (orders && orders.length > 0) {
        console.log('✅ Found orders that can be synced:', orders.length);
        return {
          id: 'orders-sync',
          description: `${orders.length} pedidos disponíveis para sincronização`,
          data_types: ['orders'],
          created_at: new Date().toISOString(),
          metadata: { ordersCount: orders.length }
        };
      }

      console.log('ℹ️ No new orders found for sync');
      return null;
    } catch (error) {
      console.error('❌ Error checking for active updates:', error);
      return null;
    }
  }

  async consumeUpdate(updateId: string): Promise<boolean> {
    console.log('✅ Update consumed (simulated):', updateId);
    return true;
  }

  private async checkConnection(): Promise<void> {
    if (!this.apiConfig) {
      this.connected = false;
      this.notifyStatusChange();
      return;
    }

    try {
      if (Capacitor.isNativePlatform()) {
        const status = await Network.getStatus();
        if (!status.connected) {
          this.connected = false;
          this.notifyStatusChange();
          return;
        }
      }

      // Test connection using the orders API
      console.log('📶 Testing connection to orders API:', this.apiConfig.apiUrl);
      const response = await fetch(`${this.apiConfig.apiUrl}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiConfig.token}`
        }
      });
      
      this.connected = response.ok;
      console.log('📶 Orders API connection status:', this.connected ? 'Connected' : 'Disconnected');
    } catch (error) {
      console.error('❌ Error checking connection:', error);
      this.connected = false;
    }
    this.notifyStatusChange();
  }

  private async countPendingItems(): Promise<void> {
    const tables = ['orders'];
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
    
    // Save settings to localStorage
    localStorage.setItem('syncSettings', JSON.stringify(this.syncSettings));
  }

  async updateApiConfig(config: ApiConfig): Promise<void> {
    this.apiConfig = config;
    console.log('✅ API configuration updated:', {
      apiUrl: config.apiUrl,
      tokenLength: config.token.length
    });
    
    await this.checkConnection();
  }

  async sync(): Promise<boolean> {
    if (this.syncInProgress) return false;
    
    try {
      this.syncInProgress = true;
      this.notifyStatusChange();

      // Use Supabase sync if enabled
      if (this.syncSettings.useSupabaseSync) {
        console.log('🔄 Using Supabase sync...');
        const success = await this.supabaseSyncService.sync();
        
        if (success) {
          this.lastSync = new Date();
          this.saveLastSyncTime();
          this.notifyStatusChange();
          return true;
        }
        
        return false;
      }

      // Fallback to API sync
      if (!this.apiConfig) {
        toast.error("Configuração da API não encontrada");
        return false;
      }

      await this.checkConnection();
      if (!this.connected) {
        toast.error("Não foi possível conectar ao servidor");
        return false;
      }

      const activeUpdate = await this.checkForActiveUpdates();
      if (!activeUpdate) {
        toast.info("Nenhuma atualização disponível");
        return false;
      }

      console.log('🔄 Starting sync with active update:', activeUpdate.id);
      toast.info("Iniciando sincronização...");

      await this.countPendingItems();
      await this.uploadData();
      await this.downloadData();

      const consumed = await this.consumeUpdate(activeUpdate.id);
      if (!consumed) {
        console.warn('Failed to mark update as consumed');
      }

      this.lastSync = new Date();
      this.saveLastSyncTime();
      this.notifyStatusChange();
      
      toast.success("Sincronização concluída com sucesso");
      await this.dbService.logSync('full', 'success');
      return true;
    } catch (error) {
      console.error('❌ Sync error:', error);
      toast.error("Erro na sincronização");
      await this.dbService.logSync('full', 'error', String(error));
      return false;
    } finally {
      this.syncInProgress = false;
      this.notifyStatusChange();
    }
  }

  private async uploadData(): Promise<void> {
    if (!this.apiConfig) return;
    
    const pendingOrders = await this.dbService.getPendingSyncItems('orders');
    let totalUploaded = 0;
    let totalToUpload = pendingOrders.length;

    for (const order of pendingOrders) {
      try {
        console.log(`🚀 Uploading order:`, order.id);

        const response = await fetch(`${this.apiConfig.apiUrl}/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiConfig.token}`
          },
          body: JSON.stringify(order)
        });

        if (response.ok) {
          await this.dbService.updateSyncStatus('orders', order.id, 'synced');
          console.log(`✅ Order uploaded successfully:`, order.id);
        } else {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error(`❌ Error uploading order:`, order.id, error);
        await this.dbService.updateSyncStatus('orders', order.id, 'error');
      }
      
      totalUploaded++;
      this.notifyProgress({
        total: totalToUpload,
        processed: totalUploaded,
        type: 'upload'
      });
    }
  }

  private async downloadData(): Promise<void> {
    if (!this.apiConfig) return;
    
    console.log('📥 Downloading orders from API...');
    
    try {
      const response = await fetch(`${this.apiConfig.apiUrl}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiConfig.token}`
        }
      });
      
      if (response.ok) {
        const orders = await response.json();
        console.log('📥 Downloaded orders:', orders.length);
        // Processar pedidos baixados aqui se necessário
      } else {
        console.error('❌ Error downloading orders:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error downloading orders:', error);
    }
    
    this.notifyProgress({
      total: 1,
      processed: 1,
      type: 'download'
    });
  }

  async refreshConnection(): Promise<boolean> {
    await this.loadApiConfig();
    await this.checkConnection();
    return this.connected;
  }
}

export default SyncService;
