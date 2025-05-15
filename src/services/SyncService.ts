
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { getDatabaseAdapter } from './DatabaseAdapter';
import { Network } from '@capacitor/network';

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

class SyncService {
  private static instance: SyncService;
  private dbService = getDatabaseAdapter();
  private apiUrl: string = 'https://preview--vendas-fortes.lovable.app/api';
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
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  private async loadSettings(): Promise<void> {
    // In a real app, load from localStorage or preferences
    // For now we just use defaults
    this.setupAutoSync();
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
            // Here we would check if we're on WiFi
            // For demo purposes, we assume we are
            this.sync();
          } else {
            this.sync();
          }
        }
      }, interval);
    }
  }

  private async checkConnection(): Promise<void> {
    try {
      // Use a API Capacitor Network quando disponível, caso contrário use fetch
      try {
        const status = await Network.getStatus();
        this.connected = status.connected;
      } catch (e) {
        // Fallback para método web se o Capacitor Network não estiver disponível
        const response = await fetch(`${this.apiUrl}/ping`);
        this.connected = response.ok;
      }
    } catch (error) {
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

      // Count pending items for upload
      await this.countPendingItems();

      // Upload pending data to server
      await this.uploadData();

      // Download new data from server
      await this.downloadData();

      // Update last sync time
      this.lastSync = new Date();
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
    // For each table, get pending items and send to server
    const tables = ['clients', 'orders', 'visit_routes'];
    let totalUploaded = 0;
    let totalToUpload = this.pendingUploads;

    for (const table of tables) {
      const pendingItems = await this.dbService.getPendingSyncItems(table);
      
      for (const item of pendingItems) {
        try {
          // In a real implementation, send to actual API endpoint
          const response = await fetch(`${this.apiUrl}/${table}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
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
          // Continue with other items
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

  private async downloadData(): Promise<void> {
    // For demo purposes, we're not implementing full download sync
    // In a real app, you'd query the server for changes since last sync
    // and update local database accordingly
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
