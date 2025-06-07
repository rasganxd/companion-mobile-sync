
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { supabaseService } from '@/services/SupabaseService';

interface SyncProgress {
  stage: string;
  current: number;
  total: number;
  percentage: number;
}

interface SyncResult {
  success: boolean;
  error?: string;
  syncedData?: {
    clients: number;
    products: number;
    paymentTables: number;
  };
}

export const useDataSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
  const { connected } = useNetworkStatus();

  const updateProgress = (stage: string, current: number, total: number) => {
    const percentage = Math.round((current / total) * 100);
    setSyncProgress({ stage, current, total, percentage });
  };

  const performFullSync = useCallback(async (salesRepId: string, sessionToken: string): Promise<SyncResult> => {
    try {
      setIsSyncing(true);
      console.log('🔄 Starting full data sync for sales rep:', salesRepId);
      console.log('🔑 Token type:', sessionToken.startsWith('local_') ? 'LOCAL' : 'SUPABASE');

      const db = getDatabaseAdapter();
      await db.initDatabase();

      let syncedClients = 0;
      let syncedProducts = 0;
      let syncedPaymentTables = 0;

      // Stage 1: Fetch clients
      updateProgress('Carregando clientes...', 0, 3);
      try {
        const clients = await supabaseService.getClientsForSalesRep(salesRepId, sessionToken);
        console.log(`📥 Received ${clients.length} clients from sync service`);
        
        if (clients.length > 0) {
          await db.saveClients(clients);
          syncedClients = clients.length;
        }
      } catch (error) {
        console.warn('⚠️ Failed to sync clients:', error);
        // Continue with other data types even if clients fail
      }

      // Stage 2: Fetch products
      updateProgress('Carregando produtos...', 1, 3);
      try {
        const products = await supabaseService.getProducts(sessionToken);
        console.log(`📥 Received ${products.length} products from sync service`);
        
        if (products.length > 0) {
          await db.saveProducts(products);
          syncedProducts = products.length;
        }
      } catch (error) {
        console.warn('⚠️ Failed to sync products:', error);
        // Continue even if products fail
      }

      // Stage 3: Fetch payment tables
      updateProgress('Carregando tabelas de pagamento...', 2, 3);
      try {
        const paymentTables = await supabaseService.getPaymentTables(sessionToken);
        console.log(`📥 Received ${paymentTables.length} payment tables from sync service`);
        syncedPaymentTables = paymentTables.length;
      } catch (error) {
        console.warn('⚠️ Failed to sync payment tables:', error);
        // Continue even if payment tables fail
      }

      // Save sync metadata
      updateProgress('Salvando dados localmente...', 3, 3);
      
      const syncDate = new Date();
      localStorage.setItem('last_sync_date', syncDate.toISOString());
      localStorage.setItem('sales_rep_id', salesRepId);
      setLastSyncDate(syncDate);

      // Check if at least some data was synced
      const totalSynced = syncedClients + syncedProducts + syncedPaymentTables;
      
      if (totalSynced === 0 && !sessionToken.startsWith('local_') && connected) {
        console.log('❌ No data was synced and we have network connection');
        return {
          success: false,
          error: 'Nenhum dado foi sincronizado. Verifique sua conexão.'
        };
      }

      console.log('✅ Sync completed successfully');
      
      return {
        success: true,
        syncedData: {
          clients: syncedClients,
          products: syncedProducts,
          paymentTables: syncedPaymentTables
        }
      };

    } catch (error) {
      console.error('❌ Full sync failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro durante a sincronização'
      };
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  }, [connected]);

  const loadLastSyncDate = useCallback(() => {
    const saved = localStorage.getItem('last_sync_date');
    if (saved) {
      setLastSyncDate(new Date(saved));
    }
  }, []);

  return {
    isSyncing,
    syncProgress,
    lastSyncDate,
    performFullSync,
    loadLastSyncDate,
    canSync: connected
  };
};
