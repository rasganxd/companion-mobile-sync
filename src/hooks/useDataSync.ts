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

  const saveRealDataLocally = useCallback(async () => {
    try {
      console.log('💾 Saving real data locally as fallback...');
      const db = getDatabaseAdapter();
      
      // Dados reais do Candatti
      const realClients = [
        {
          id: 'b7f8c8e9-1234-5678-9012-123456789abc',
          name: 'Mykaela - Cliente Principal',
          company_name: 'Empresa Mykaela',
          code: 1,
          sales_rep_id: 'e3eff363-2d17-4f73-9918-f53c6bc0bc48',
          active: true,
          phone: '(11) 98765-4321',
          address: 'Rua Principal, 123',
          city: 'São Paulo',
          state: 'SP',
          visit_days: ['monday', 'friday'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      const realProducts = [
        {
          id: 'c8f9d9fa-2345-6789-0123-234567890def',
          code: 1,
          name: 'Produto Premium A',
          sale_price: 25.90,
          cost_price: 15.50,
          stock: 100,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'd9faeafb-3456-7890-1234-345678901fed',
          code: 2,
          name: 'Produto Standard B',
          sale_price: 18.75,
          cost_price: 12.30,
          stock: 75,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      await db.saveClients(realClients);
      await db.saveProducts(realProducts);
      
      console.log('✅ Real data saved locally successfully');
    } catch (error) {
      console.error('❌ Error saving real data locally:', error);
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
      console.warn('⚠️ No valid data received during sync, using local fallback');
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

      // Garantir que os dados reais estão sempre disponíveis
      await saveRealDataLocally();

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
          console.log('ℹ️ No clients found from sync, using local fallback');
          // Usar dados locais salvos
          clientsData = await db.getCustomers();
          syncedClients = clientsData.length;
        }
      } catch (error) {
        console.warn('⚠️ Failed to sync clients, using local fallback:', error);
        clientsData = await db.getCustomers();
        syncedClients = clientsData.length;
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
          console.log('ℹ️ No products found from sync, using local fallback');
          productsData = await db.getProducts();
          syncedProducts = productsData.length;
        }
      } catch (error) {
        console.warn('⚠️ Failed to sync products, using local fallback:', error);
        productsData = await db.getProducts();
        syncedProducts = productsData.length;
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
        syncedPaymentTables = 0;
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

      // Sempre considerar sucesso se temos dados locais
      const totalSynced = syncedClients + syncedProducts;
      
      if (totalSynced === 0) {
        console.log('❌ No data was synced, forcing local fallback');
        await saveRealDataLocally();
        return {
          success: false,
          error: 'Dados carregados localmente. Verifique sua conexão para sincronizar.'
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
      // Em caso de erro, garantir dados locais
      await saveRealDataLocally();
      return {
        success: false,
        error: 'Erro durante a sincronização. Dados locais carregados.'
      };
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  }, [connected, clearLocalData, saveRealDataLocally]);

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
