
import { useState, useEffect } from 'react';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';

interface LocalSyncStatus {
  lastSync: Date | null;
  pendingOrdersCount: number;
  connected: boolean;
}

export const useLocalSyncStatus = () => {
  const [syncStatus, setSyncStatus] = useState<LocalSyncStatus>({
    lastSync: null,
    pendingOrdersCount: 0,
    connected: true // Always connected in local mode
  });

  useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    try {
      // Load last sync time from localStorage
      const lastSyncString = localStorage.getItem('last_sync');
      const lastSync = lastSyncString ? new Date(lastSyncString) : null;

      // Count pending orders
      const db = getDatabaseAdapter();
      const pendingOrders = await db.getPendingSyncItems('orders');
      
      setSyncStatus({
        lastSync,
        pendingOrdersCount: pendingOrders.length,
        connected: true
      });
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  };

  const refreshStatus = () => {
    loadSyncStatus();
  };

  return {
    syncStatus,
    refreshStatus
  };
};
