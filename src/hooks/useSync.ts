
import { useState, useEffect, useCallback } from 'react';
import SyncService, { SyncProgress } from '../services/SyncService';

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

  const syncService = SyncService.getInstance();

  useEffect(() => {
    // Load initial status and settings
    syncService.onStatusChange(setSyncStatus);
    syncService.onProgress(setSyncProgress);
    
    syncService.getSyncSettings().then(settings => {
      setSyncSettings(settings);
    });

    return () => {
      // Clean up by setting callbacks to null
      syncService.onStatusChange(() => {});
      syncService.onProgress(() => {});
    };
  }, []);

  const startSync = useCallback(async () => {
    return await syncService.sync();
  }, []);

  const checkConnection = useCallback(async () => {
    return await syncService.refreshConnection();
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<SyncSettings>) => {
    await syncService.updateSyncSettings(newSettings);
    setSyncSettings(await syncService.getSyncSettings());
  }, []);

  return {
    syncStatus,
    syncSettings,
    syncProgress,
    startSync,
    checkConnection,
    updateSettings
  };
};
