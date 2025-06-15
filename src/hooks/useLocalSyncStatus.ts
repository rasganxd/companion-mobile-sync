
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

    // Adiciona um listener para atualizar o status quando o localStorage mudar
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'last_sync_date') {
        console.log('Capturada alteração em last_sync_date, atualizando status...');
        loadSyncStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Limpa o listener quando o componente for desmontado
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadSyncStatus = async () => {
    try {
      // ✅ CORRIGIDO: Carrega a data da última sincronização usando a chave correta
      const lastSyncString = localStorage.getItem('last_sync_date');
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

