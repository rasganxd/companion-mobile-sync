
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
    if (!connected) {
      return { success: false, error: 'Sem conexão com a internet' };
    }

    try {
      setIsSyncing(true);
      console.log('🔄 Starting full data sync for sales rep:', salesRepId);

      const db = getDatabaseAdapter();
      await db.initDatabase();

      // Stage 1: Fetch clients
      updateProgress('Carregando clientes...', 0, 3);
      const clients = await supabaseService.getClientsForSalesRep(salesRepId, sessionToken);
      console.log(`📥 Received ${clients.length} clients from Supabase`);

      // Stage 2: Fetch products
      updateProgress('Carregando produtos...', 1, 3);
      const products = await supabaseService.getProducts(sessionToken);
      console.log(`📥 Received ${products.length} products from Supabase`);

      // Stage 3: Fetch payment tables
      updateProgress('Carregando tabelas de pagamento...', 2, 3);
      const paymentTables = await supabaseService.getPaymentTables(sessionToken);
      console.log(`📥 Received ${paymentTables.length} payment tables from Supabase`);

      // Save all data locally
      updateProgress('Salvando dados localmente...', 3, 3);
      
      if (clients.length > 0) {
        await db.saveClients(clients);
      }
      
      if (products.length > 0) {
        await db.saveProducts(products);
      }

      // Save sync metadata
      const syncDate = new Date();
      localStorage.setItem('last_sync_date', syncDate.toISOString());
      localStorage.setItem('sales_rep_id', salesRepId);
      setLastSyncDate(syncDate);

      console.log('✅ Full sync completed successfully');
      
      return {
        success: true,
        syncedData: {
          clients: clients.length,
          products: products.length,
          paymentTables: paymentTables.length
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
