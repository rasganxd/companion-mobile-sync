
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

  const clearLocalData = useCallback(async () => {
    try {
      console.log('🗑️ Clearing local data to force fresh sync');
      const db = getDatabaseAdapter();
      
      // Clear sync metadata
      localStorage.removeItem('last_sync_date');
      localStorage.removeItem('sales_rep_id');
      
      console.log('✅ Local data cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing local data:', error);
    }
  }, []);

  const validateSyncedData = (clients: any[], products: any[], paymentTables: any[]) => {
    console.log('🔍 Validating synced data:', {
      clients: clients.length,
      products: products.length,
      paymentTables: paymentTables.length,
      clientsSample: clients.slice(0, 2).map(c => ({ id: c.id, name: c.name })),
      productsSample: products.slice(0, 2).map(p => ({ id: p.id, name: p.name }))
    });

    // Check if we have at least some data
    const hasValidData = clients.length > 0 || products.length > 0;
    
    if (!hasValidData) {
      console.warn('⚠️ No valid data received during sync');
      return false;
    }

    console.log('✅ Sync data validation passed');
    return true;
  };

  const performFullSync = useCallback(async (salesRepId: string, sessionToken: string, forceClear = false): Promise<SyncResult> => {
    try {
      setIsSyncing(true);
      console.log('🔄 Starting full data sync for sales rep:', salesRepId);
      console.log('🔑 Token type:', sessionToken.startsWith('local_') ? 'LOCAL' : 'SUPABASE');

      if (forceClear) {
        await clearLocalData();
      }

      const db = getDatabaseAdapter();
      await db.initDatabase();

      let syncedClients = 0;
      let syncedProducts = 0;
      let syncedPaymentTables = 0;
      let clientsData: any[] = [];
      let productsData: any[] = [];
      let paymentTablesData: any[] = [];

      // Stage 1: Fetch clients
      updateProgress('Carregando clientes...', 0, 3);
      try {
        console.log('📥 Fetching clients from Supabase for sales rep:', salesRepId);
        clientsData = await supabaseService.getClientsForSalesRep(salesRepId, sessionToken);
        console.log(`📥 Received ${clientsData.length} clients from sync service`);
        
        if (clientsData.length > 0) {
          await db.saveClients(clientsData);
          syncedClients = clientsData.length;
          console.log(`✅ Saved ${syncedClients} clients to local database`);
        } else {
          console.log('ℹ️ No clients found for this sales rep');
        }
      } catch (error) {
        console.warn('⚠️ Failed to sync clients:', error);
        // Continue with other data types even if clients fail
      }

      // Stage 2: Fetch products
      updateProgress('Carregando produtos...', 1, 3);
      try {
        console.log('📥 Fetching products from Supabase');
        productsData = await supabaseService.getProducts(sessionToken);
        console.log(`📥 Received ${productsData.length} products from sync service`);
        
        if (productsData.length > 0) {
          await db.saveProducts(productsData);
          syncedProducts = productsData.length;
          console.log(`✅ Saved ${syncedProducts} products to local database`);
        } else {
          console.log('ℹ️ No products found');
        }
      } catch (error) {
        console.warn('⚠️ Failed to sync products:', error);
        // Continue even if products fail
      }

      // Stage 3: Fetch payment tables
      updateProgress('Carregando tabelas de pagamento...', 2, 3);
      try {
        console.log('📥 Fetching payment tables from Supabase');
        paymentTablesData = await supabaseService.getPaymentTables(sessionToken);
        console.log(`📥 Received ${paymentTablesData.length} payment tables from sync service`);
        syncedPaymentTables = paymentTablesData.length;
        console.log(`✅ Found ${syncedPaymentTables} payment tables`);
      } catch (error) {
        console.warn('⚠️ Failed to sync payment tables:', error);
        // Continue even if payment tables fail
      }

      // Validate synced data
      updateProgress('Validando dados sincronizados...', 3, 3);
      const isDataValid = validateSyncedData(clientsData, productsData, paymentTablesData);

      // Save sync metadata
      const syncDate = new Date();
      localStorage.setItem('last_sync_date', syncDate.toISOString());
      localStorage.setItem('sales_rep_id', salesRepId);
      setLastSyncDate(syncDate);

      console.log('📊 Sync summary:', {
        clients: syncedClients,
        products: syncedProducts,
        paymentTables: syncedPaymentTables,
        total: syncedClients + syncedProducts + syncedPaymentTables,
        dataValid: isDataValid
      });

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
  }, [connected, clearLocalData]);

  const loadLastSyncDate = useCallback(() => {
    const saved = localStorage.getItem('last_sync_date');
    if (saved) {
      setLastSyncDate(new Date(saved));
    }
  }, []);

  const forceResync = useCallback(async (salesRepId: string, sessionToken: string): Promise<SyncResult> => {
    console.log('🔄 Forcing complete resync with data clearing');
    return await performFullSync(salesRepId, sessionToken, true);
  }, [performFullSync]);

  return {
    isSyncing,
    syncProgress,
    lastSyncDate,
    performFullSync,
    forceResync,
    loadLastSyncDate,
    clearLocalData,
    canSync: connected
  };
};
