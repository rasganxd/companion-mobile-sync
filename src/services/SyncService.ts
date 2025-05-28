
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
    console.log('📥 Downloading data for update:', activeUpdate.id);
    
    // Use configured download endpoint if available
    if (this.apiConfig?.endpoints?.download) {
      try {
        const url = `${this.apiConfig.baseUrl}${this.apiConfig.endpoints.download}`;
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${this.apiConfig.token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Downloaded data:', data);
          // Process downloaded data here based on activeUpdate.data_types
        }
      } catch (error) {
        console.error('Error downloading data:', error);
      }
    }
    
    this.notifyProgress({
      total: 1,
      processed: 1,
      type: 'download'
    });
  }

  async refreshConnection(): Promise<boolean> {
    await this.checkConnection();
    return this.connected;
  }
}

export default SyncService;
