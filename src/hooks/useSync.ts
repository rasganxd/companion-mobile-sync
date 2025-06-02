import { useState, useEffect, useCallback } from 'react';
import SyncService, { SyncProgress } from '../services/SyncService';

interface SyncStatus {
  lastSync: Date | null;
  inProgress: boolean;
  pendingUploads: number;
  pendingDownloads: number;
  connected: boolean;
}

interface SyncSettings {
  autoSync: boolean;
  syncInterval: number;
  syncOnWifiOnly: boolean;
  syncEnabled: boolean;
}

// Define a simple update interface for the hook
interface UpdateInfo {
  id: string;
  description: string;
  data_types: string[];
  created_at: string;
  created_by_user?: string;
  metadata?: any;
}

export const useSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    inProgress: false,
    pendingUploads: 0,
    pendingDownloads: 0,
    connected: false
  });
  const [syncSettings, setSyncSettings] = useState<SyncSettings>({
    autoSync: true,
    syncInterval: 30,
    syncOnWifiOnly: true,
    syncEnabled: true
  });
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [activeUpdate, setActiveUpdate] = useState<UpdateInfo | null>(null);
  const [checkingUpdates, setCheckingUpdates] = useState<boolean>(false);

  const syncService = SyncService.getInstance();

  useEffect(() => {
    console.log('🔄 Initializing sync hook...');
    
    try {
      // Load initial status and settings
      syncService.onStatusChange(setSyncStatus);
      syncService.onProgress(setSyncProgress);
      
      syncService.getSyncSettings().then(settings => {
        setSyncSettings(settings);
      });

      // Clear any previous init errors
      setInitError(null);
      console.log('✅ Sync hook initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing sync hook:', error);
      setInitError(error instanceof Error ? error.message : 'Unknown initialization error');
    }

    return () => {
      // Clean up by setting callbacks to null
      syncService.onStatusChange(() => {});
      syncService.onProgress(() => {});
    };
  }, []);

  const checkForUpdates = useCallback(async () => {
    try {
      console.log('🔍 Checking for available updates...');
      setCheckingUpdates(true);
      setInitError(null);
      
      const update = await syncService.checkForActiveUpdates();
      setActiveUpdate(update);
      
      return update;
    } catch (error) {
      console.error('❌ Error checking for updates:', error);
      setInitError(error instanceof Error ? error.message : 'Error checking updates');
      return null;
    } finally {
      setCheckingUpdates(false);
    }
  }, []);

  const startSync = useCallback(async () => {
    try {
      console.log('🔄 Starting sync...');
      setInitError(null);
      const result = await syncService.sync();
      
      // If sync was successful, clear the active update
      if (result) {
        setActiveUpdate(null);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error during sync:', error);
      setInitError(error instanceof Error ? error.message : 'Sync error');
      return false;
    }
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      console.log('🔄 Checking connection...');
      return await syncService.refreshConnection();
    } catch (error) {
      console.error('❌ Error checking connection:', error);
      return false;
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<SyncSettings>) => {
    try {
      await syncService.updateSyncSettings(newSettings);
      setSyncSettings(await syncService.getSyncSettings());
    } catch (error) {
      console.error('❌ Error updating settings:', error);
    }
  }, []);

  return {
    syncStatus,
    syncSettings,
    syncProgress,
    initError,
    activeUpdate,
    checkingUpdates,
    startSync,
    checkConnection,
    updateSettings,
    checkForUpdates
  };
};
