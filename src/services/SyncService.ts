
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
  token: string;
  apiUrl: string;
}

class SyncService {
  private static instance: SyncService;
  private dbService = getDatabaseAdapter();
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
      // Para web, assumir que está conectado
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

  async checkForActiveUpdates(): Promise<SyncUpdate | null> {
    if (!this.apiConfig) {
      console.log('❌ No API config available for checking updates');
      return null;
    }

    try {
      console.log('🔍 Checking for active sync updates via external API...');
      
      const response = await fetch(`${this.apiConfig.apiUrl}/sync-updates`, {
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

      const data = await response.json();
      
      if (data && data.id) {
        console.log('✅ Found active sync update:', data);
        return data as SyncUpdate;
      }

      console.log('ℹ️ No active sync updates found');
      return null;
    } catch (error) {
      console.error('❌ Error checking for active updates:', error);
      return null;
    }
  }

  async consumeUpdate(updateId: string): Promise<boolean> {
    if (!this.apiConfig) {
      console.log('❌ No API config available for consuming update');
      return false;
    }

    try {
      console.log('🔄 Consuming sync update:', updateId);
      
      const response = await fetch(`${this.apiConfig.apiUrl}/sync-updates/${updateId}/consume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiConfig.token}`
        }
      });

      if (!response.ok) {
        console.error('❌ Error consuming update:', response.status, response.statusText);
        return false;
      }

      console.log('✅ Successfully consumed sync update');
      return true;
    } catch (error) {
      console.error('❌ Error consuming update:', error);
      return false;
    }
  }

  private async checkConnection(): Promise<void> {
    if (!this.apiConfig) {
      this.connected = false;
      this.notifyStatusChange();
      return;
    }

    try {
      if (Capacitor.isNativePlatform()) {
        // Usar Capacitor Network em apps nativos
        const status = await Network.getStatus();
        if (!status.connected) {
          this.connected = false;
          this.notifyStatusChange();
          return;
        }
      }

      // Test connection to external API
      console.log('📶 Testing connection to external API:', this.apiConfig.apiUrl);
      const response = await fetch(`${this.apiConfig.apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiConfig.token}`
        }
      });
      
      this.connected = response.ok;
      console.log('📶 External API connection status:', this.connected ? 'Connected' : 'Disconnected');
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
    console.log('✅ API configuration updated:', {
      apiUrl: config.apiUrl,
      tokenLength: config.token.length
    });
    
    // Re-check connection with new config
    await this.checkConnection();
  }

  async sync(): Promise<boolean> {
    if (this.syncInProgress) return false;
    
    if (!this.apiConfig) {
      toast.error("Configuração da API não encontrada");
      return false;
    }
    
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
    
    const tables = ['clients', 'orders', 'visit_routes'];
    let totalUploaded = 0;
    let totalToUpload = this.pendingUploads;

    for (const table of tables) {
      const pendingItems = await this.dbService.getPendingSyncItems(table);
      
      for (const item of pendingItems) {
        try {
          console.log(`🚀 Uploading ${table} item:`, item.id);

          const response = await fetch(`${this.apiConfig.apiUrl}/${table}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiConfig.token}`
            },
            body: JSON.stringify(item)
          });

          if (response.ok) {
            await this.dbService.updateSyncStatus(table, item.id, 'synced');
            console.log(`✅ ${table} item uploaded successfully:`, item.id);
          } else {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
          }
        } catch (error) {
          console.error(`❌ Error uploading ${table} item:`, item.id, error);
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
    if (!this.apiConfig) return;
    
    console.log('📥 Downloading data for update:', activeUpdate.id);
    
    try {
      const response = await fetch(`${this.apiConfig.apiUrl}/download/${activeUpdate.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiConfig.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📥 Downloaded data:', data);
        // Process downloaded data here based on activeUpdate.data_types
        // This would typically involve updating local database tables
      } else {
        console.error('❌ Error downloading data:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error downloading data:', error);
    }
    
    this.notifyProgress({
      total: 1,
      processed: 1,
      type: 'download'
    });
  }

  async refreshConnection(): Promise<boolean> {
    // Reload API config first
    await this.loadApiConfig();
    // Then check connection
    await this.checkConnection();
    return this.connected;
  }
}

export default SyncService;
