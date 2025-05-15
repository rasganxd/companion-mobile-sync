import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { getDatabaseAdapter } from './DatabaseAdapter';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';

export interface SyncProgress {
  total: number;
  processed: number;
  type: 'upload' | 'download';
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
    this.initializeServices();
  }

  private async initializeServices() {
    await this.loadSettings();
    this.setupNetworkListeners();
    this.checkConnection();
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  private async loadSettings(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        // Load settings from Preferences on native platforms
        const settings = await Preferences.get({ key: 'sync_settings' });
        if (settings.value) {
          this.syncSettings = JSON.parse(settings.value);
        }
      } else {
        // Load settings from localStorage on web
        const savedSettings = localStorage.getItem('sync_settings');
        if (savedSettings) {
          this.syncSettings = JSON.parse(savedSettings);
        }
      }
      this.setupAutoSync();
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  private setupNetworkListeners(): void {
    if (Capacitor.isNativePlatform()) {
      // Listen for network status changes on native platforms
      Network.addListener('networkStatusChange', status => {
        this.connected = status.connected;
        this.notifyStatusChange();
      });
    }
  }

  private setupAutoSync(): void {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }

    if (this.syncSettings.autoSync && this.syncSettings.syncEnabled) {
      const interval = this.syncSettings.syncInterval * 60 * 1000;
      this.autoSyncTimer = setInterval(async () => {
        if (this.connected && !this.syncInProgress) {
          if (this.syncSettings.syncOnWifiOnly) {
            // Check if we're on WiFi when on native platforms
            if (Capacitor.isNativePlatform()) {
              const networkStatus = await Network.getStatus();
              const isWifi = networkStatus.connectionType === 'wifi';
              if (isWifi) {
                this.sync();
              }
            } else {
              // For web, we can't reliably check connection type
              this.sync();
            }
          } else {
            this.sync();
          }
        }
      }, interval);
    }
  }

  private async checkConnection(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        // Use Network API on native platforms
        const status = await Network.getStatus();
        this.connected = status.connected;
      } else {
        // Use fetch for web
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
    
    try {
      // Save settings based on platform
      if (Capacitor.isNativePlatform()) {
        await Preferences.set({
          key: 'sync_settings',
          value: JSON.stringify(this.syncSettings)
        });
      } else {
        localStorage.setItem('sync_settings', JSON.stringify(this.syncSettings));
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
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
