
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { supabaseService } from '@/services/SupabaseService';
import { DatabaseInitializer } from '@/services/database/DatabaseInitializer';

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

  const handleDatabaseVersionError = useCallback(async () => {
    try {
      await DatabaseInitializer.clearDatabase();
    } catch (error) {
      console.error('Error clearing database:', error);
      throw new Error('Falha ao limpar banco de dados corrompido');
    }
  }, []);

  const clearLocalData = useCallback(async () => {
    try {
      const db = getDatabaseAdapter();
      
      await db.initDatabase();
      
      const clientsBefore = await db.getCustomers();
      const productsBefore = await db.getProducts();
      const paymentTablesBefore = await db.getPaymentTables();
      const ordersBefore = await db.getAllOrders();
      
      if (db.clearMockData) {
        await db.clearMockData();
      }
      
      if (db.deleteAllOrders) {
        await db.deleteAllOrders();
      }
      
      if (typeof (db as any).db?.run === 'function') {
        const sqliteDb = (db as any).db;
        
        await sqliteDb.run('DELETE FROM clients');
        await sqliteDb.run('DELETE FROM products');
        await sqliteDb.run('DELETE FROM payment_tables');
        await sqliteDb.run('DELETE FROM orders');
      }
      
      localStorage.removeItem('last_sync_date');
      localStorage.removeItem('sales_rep_id');
      
      const clientsAfter = await db.getCustomers();
      const productsAfter = await db.getProducts();
      const paymentTablesAfter = await db.getPaymentTables();
      const ordersAfter = await db.getAllOrders();
      
      const totalRemaining = clientsAfter.length + productsAfter.length + paymentTablesAfter.length + ordersAfter.length;
      if (totalRemaining > 0) {
        console.warn('Some data still remains after cleanup:', {
          clients: clientsAfter.length,
          products: productsAfter.length,
          paymentTables: paymentTablesAfter.length,
          orders: ordersAfter.length
        });
      }
      
    } catch (error) {
      console.error('Error clearing local data:', error);
      throw new Error('Falha ao limpar dados locais: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  }, []);

  const validateSyncParams = (salesRepId: string, sessionToken: string) => {
    if (!salesRepId || salesRepId.trim() === '') {
      throw new Error('ID do vendedor é obrigatório para sincronização');
    }
    
    if (!sessionToken || sessionToken.trim() === '') {
      throw new Error('Token de sessão é obrigatório para sincronização');
    }
  };

  const validateSyncedData = (clients: any[], products: any[], paymentTables: any[]) => {
    return clients.length > 0 || products.length > 0;
  };

  const detectConnectivity = async (): Promise<boolean> => {
    if (!connected) {
      return false;
    }
    
    try {
      const response = await fetch('https://ufvnubabpcyimahbubkd.supabase.co/rest/v1/', {
        method: 'HEAD',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmdm51YmFicGN5aW1haGJ1YmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MzQ1NzIsImV4cCI6MjA2MzQxMDU3Mn0.rL_UAaLky3SaSAigQPrWAZjhkM8FBmeO0w-pEiB5aro'
        }
      });
      
      return response.status < 500;
      
    } catch (error) {
      console.error('Cannot reach Supabase:', error);
      return false;
    }
  };

  const performFullSync = useCallback(async (salesRepId: string, sessionToken: string, forceClear = false): Promise<SyncResult> => {
    // Evitar múltiplas sincronizações simultâneas
    if (isSyncing) {
      console.warn('🔄 useDataSync: Sincronização já em andamento, abortando nova tentativa');
      return {
        success: false,
        error: 'Sincronização já em andamento'
      };
    }

    try {
      console.log('🔄 useDataSync: Iniciando performFullSync', {
        salesRepId,
        hasSessionToken: !!sessionToken,
        forceClear,
        timestamp: new Date().toISOString()
      });
      
      setIsSyncing(true);
      setSyncProgress({ stage: 'Iniciando...', current: 0, total: 5, percentage: 0 });
      
      try {
        validateSyncParams(salesRepId, sessionToken);
      } catch (validationError) {
        console.error('❌ useDataSync: Validação de parâmetros falhou', validationError);
        return {
          success: false,
          error: validationError instanceof Error ? validationError.message : 'Parâmetros inválidos'
        };
      }

      const isOnline = await detectConnectivity();

      const db = getDatabaseAdapter();
      
      try {
        await db.initDatabase();
      } catch (dbError) {
        console.error('Database initialization error:', dbError);
        
        if (dbError instanceof Error && dbError.message.includes('version')) {
          await handleDatabaseVersionError();
          await db.initDatabase();
        } else {
          throw dbError;
        }
      }

      if (forceClear || isOnline) {
        await clearLocalData();
      }

      let syncedClients = 0;
      let syncedProducts = 0;
      let syncedPaymentTables = 0;
      let syncedOrders = 0;
      let clientsData: any[] = [];
      let productsData: any[] = [];
      let paymentTablesData: any[] = [];
      let ordersData: any[] = [];

      if (isOnline) {
        updateProgress('Carregando clientes do Supabase...', 0, 5);
        try {
          clientsData = await supabaseService.getClientsForSalesRep(salesRepId, sessionToken);
          
          if (clientsData.length > 0) {
            await db.saveClients(clientsData);
            syncedClients = clientsData.length;
            
            const savedClients = await db.getCustomers();
            const salesRepClients = savedClients.filter(c => c.sales_rep_id === salesRepId);
            
            if (salesRepClients.length !== clientsData.length) {
              console.warn('Discrepancy detected:', {
                recebidos: clientsData.length,
                salvos: salesRepClients.length,
                diferenca: clientsData.length - salesRepClients.length
              });
            }
          }
        } catch (error) {
          console.error('Failed to sync clients:', error);
          clientsData = [];
          syncedClients = 0;
        }

        updateProgress('Carregando produtos do Supabase...', 1, 5);
        try {
          productsData = await supabaseService.getProducts(sessionToken);
          
          if (productsData.length > 0) {
            await db.saveProducts(productsData);
            syncedProducts = productsData.length;
            
            const savedProducts = await db.getProducts();
            
            if (savedProducts.length !== productsData.length) {
              console.warn('Products discrepancy detected:', {
                recebidos: productsData.length,
                salvos: savedProducts.length,
                diferenca: productsData.length - savedProducts.length
              });
            }
          }
        } catch (error) {
          console.error('Failed to sync products:', error);
          productsData = [];
          syncedProducts = 0;
        }

        updateProgress('Carregando tabelas de pagamento do Supabase...', 2, 5);
        try {
          paymentTablesData = await supabaseService.getPaymentTables(sessionToken);
          
          if (paymentTablesData.length > 0) {
            await db.savePaymentTables(paymentTablesData);
            syncedPaymentTables = paymentTablesData.length;
          }
        } catch (error) {
          console.warn('Failed to sync payment tables:', error);
          paymentTablesData = [];
          syncedPaymentTables = 0;
        }

        updateProgress('Carregando histórico de pedidos do Supabase...', 3, 5);
        try {
          ordersData = await supabaseService.getClientOrdersHistory(salesRepId, sessionToken);
          
          if (ordersData.length > 0) {
            await db.saveOrders(ordersData);
            syncedOrders = ordersData.length;
          }
        } catch (error) {
          console.warn('Failed to sync orders history:', error);
          ordersData = [];
          syncedOrders = 0;
        }
        
      } else {
        return {
          success: false,
          error: 'Sem conexão com a internet. Não é possível sincronizar dados.'
        };
      }

      updateProgress('Validando dados...', 4, 5);
      const isDataValid = validateSyncedData(clientsData, productsData, paymentTablesData);

      const syncDate = new Date();
      localStorage.setItem('last_sync_date', syncDate.toISOString());
      localStorage.setItem('sales_rep_id', salesRepId);
      setLastSyncDate(syncDate);

      const totalSynced = syncedClients + syncedProducts;
      
      if (totalSynced === 0) {
        return {
          success: false,
          error: 'Nenhum dado encontrado no Supabase. Verifique se há clientes e produtos cadastrados para este vendedor.'
        };
      }
      
      return {
        success: true,
        syncedData: {
          clients: syncedClients,
          products: syncedProducts,
          paymentTables: syncedPaymentTables
        }
      };

    } catch (error) {
      console.error('Sync failed:', error);
      
      if (error instanceof Error && error.message.includes('version')) {
        return {
          success: false,
          error: 'Conflito de versão do banco de dados detectado. Tentando corrigir automaticamente...'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro durante a sincronização. Tente novamente.'
      };
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  }, [connected, clearLocalData, handleDatabaseVersionError]);

  const loadLastSyncDate = useCallback(() => {
    const saved = localStorage.getItem('last_sync_date');
    if (saved) {
      setLastSyncDate(new Date(saved));
    }
  }, []);

  const forceResync = useCallback(async (salesRepId: string, sessionToken: string): Promise<SyncResult> => {
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
    canSync: true
  };
};
