
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
      console.log('🔄 Handling database version conflict...');
      await DatabaseInitializer.clearDatabase();
      console.log('✅ Database cleared, will reinitialize on next sync attempt');
    } catch (error) {
      console.error('❌ Error clearing database:', error);
      throw new Error('Falha ao limpar banco de dados corrompido');
    }
  }, []);

  // ✅ CORRIGIR: Implementar limpeza REAL das tabelas locais
  const clearLocalData = useCallback(async () => {
    try {
      console.log('🗑️ Iniciando limpeza COMPLETA dos dados locais...');
      const db = getDatabaseAdapter();
      
      // Garantir que o banco está inicializado
      await db.initDatabase();
      
      // ✅ NOVO: Contar registros antes da limpeza
      const clientsBefore = await db.getCustomers();
      const productsBefore = await db.getProducts();
      const paymentTablesBefore = await db.getPaymentTables();
      const ordersBefore = await db.getAllOrders();
      
      console.log('📊 Dados antes da limpeza:', {
        clients: clientsBefore.length,
        products: productsBefore.length,
        paymentTables: paymentTablesBefore.length,
        orders: ordersBefore.length
      });
      
      // ✅ NOVO: Limpar TODAS as tabelas principais
      if (db.clearMockData) {
        console.log('🧹 Limpando dados mock...');
        await db.clearMockData();
      }
      
      // ✅ NOVO: Limpar tabelas específicas se existirem métodos
      if (db.deleteAllOrders) {
        console.log('🗑️ Limpando todos os pedidos locais...');
        await db.deleteAllOrders();
      }
      
      // ✅ NOVO: Para SQLite, limpar tabelas diretamente
      if (typeof (db as any).db?.run === 'function') {
        console.log('🗑️ Limpando tabelas SQLite diretamente...');
        const sqliteDb = (db as any).db;
        
        // Limpar tabelas principais preservando estrutura
        await sqliteDb.run('DELETE FROM customers');
        await sqliteDb.run('DELETE FROM products');
        await sqliteDb.run('DELETE FROM payment_tables');
        await sqliteDb.run('DELETE FROM orders');
        
        console.log('✅ Tabelas SQLite limpas com sucesso');
      }
      
      // Limpar metadata de sincronização
      localStorage.removeItem('last_sync_date');
      localStorage.removeItem('sales_rep_id');
      
      // ✅ NOVO: Validar limpeza
      const clientsAfter = await db.getCustomers();
      const productsAfter = await db.getProducts();
      const paymentTablesAfter = await db.getPaymentTables();
      const ordersAfter = await db.getAllOrders();
      
      console.log('📊 Dados após limpeza:', {
        clients: clientsAfter.length,
        products: productsAfter.length,
        paymentTables: paymentTablesAfter.length,
        orders: ordersAfter.length
      });
      
      // ✅ NOVO: Verificar se limpeza foi bem-sucedida
      const totalRemaining = clientsAfter.length + productsAfter.length + paymentTablesAfter.length + ordersAfter.length;
      if (totalRemaining > 0) {
        console.warn('⚠️ Alguns dados ainda permanecem após limpeza:', {
          clients: clientsAfter.length,
          products: productsAfter.length,
          paymentTables: paymentTablesAfter.length,
          orders: ordersAfter.length
        });
      } else {
        console.log('✅ Limpeza completa: todos os dados foram removidos');
      }
      
      console.log('✅ Dados locais completamente limpos');
    } catch (error) {
      console.error('❌ Erro ao limpar dados locais:', error);
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
    
    console.log('✅ Parâmetros de sincronização validados:', {
      salesRepId: salesRepId.substring(0, 8) + '...',
      tokenType: sessionToken.startsWith('local_') ? 'LOCAL' : 'SUPABASE',
      hasConnection: connected
    });
  };

  const validateSyncedData = (clients: any[], products: any[], paymentTables: any[]) => {
    console.log('🔍 Validando dados sincronizados:', {
      clients: clients.length,
      products: products.length,
      paymentTables: paymentTables.length,
      clientsSample: clients.slice(0, 2).map(c => ({ id: c.id, name: c.name })),
      productsSample: products.slice(0, 2).map(p => ({ id: p.id, name: p.name })),
      paymentTablesSample: paymentTables.slice(0, 2).map(pt => ({ id: pt.id, name: pt.name }))
    });

    return clients.length > 0 || products.length > 0;
  };

  // ✅ NOVA LÓGICA: Detectar se está online e ajustar comportamento
  const detectConnectivity = async (): Promise<boolean> => {
    console.log('🔍 Detecting connectivity status...');
    
    // Verificar conexão básica
    if (!connected) {
      console.log('❌ No network connection detected');
      return false;
    }
    
    // Tentar ping simples ao Supabase
    try {
      const response = await fetch('https://ufvnubabpcyimahbubkd.supabase.co/rest/v1/', {
        method: 'HEAD',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmdm51YmFicGN5aW1haGJ1YmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MzQ1NzIsImV4cCI6MjA2MzQxMDU3Mn0.rL_UAaLky3SaSAigQPrWAZjhkM8FBmeO0w-pEiB5aro'
        }
      });
      
      const canReachSupabase = response.status < 500;
      console.log(`🌐 Supabase connectivity: ${canReachSupabase ? 'ONLINE' : 'OFFLINE'} (status: ${response.status})`);
      return canReachSupabase;
      
    } catch (error) {
      console.error('❌ Cannot reach Supabase:', error);
      return false;
    }
  };

  const performFullSync = useCallback(async (salesRepId: string, sessionToken: string, forceClear = false): Promise<SyncResult> => {
    try {
      setIsSyncing(true);
      console.log('🔄 Iniciando sincronização COMPLETA - Supabase → Local Storage');
      
      // Validar parâmetros de entrada
      try {
        validateSyncParams(salesRepId, sessionToken);
      } catch (validationError) {
        console.error('❌ Falha na validação dos parâmetros:', validationError);
        return {
          success: false,
          error: validationError instanceof Error ? validationError.message : 'Parâmetros inválidos'
        };
      }

      // 🔄 NOVA LÓGICA: Verificar conectividade antes de começar
      const isOnline = await detectConnectivity();
      console.log(`🌐 Connectivity status: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);

      const db = getDatabaseAdapter();
      
      try {
        await db.initDatabase();
      } catch (dbError) {
        console.error('❌ Erro ao inicializar banco de dados:', dbError);
        
        // Se for erro de versão, tentar limpar e reinicializar
        if (dbError instanceof Error && dbError.message.includes('version')) {
          console.log('🔄 Conflito de versão detectado, executando limpeza...');
          await handleDatabaseVersionError();
          // Tentar inicializar novamente após limpeza
          await db.initDatabase();
        } else {
          throw dbError;
        }
      }

      // ✅ MODIFICADO: Sempre limpar dados antes de sincronizar para evitar duplicações
      if (forceClear || isOnline) {
        console.log('🧹 Limpando dados locais antes da sincronização...');
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

      // 🔄 NOVA LÓGICA: Se online, buscar dados do Supabase; se offline, usar dados locais
      if (isOnline) {
        console.log('🌐 ONLINE MODE: Fetching fresh data from Supabase...');
        
        // Etapa 1: Buscar clientes REAIS do Supabase
        updateProgress('Carregando clientes do Supabase...', 0, 5);
        try {
          console.log('📥 Buscando clientes REAIS do Supabase');
          clientsData = await supabaseService.getClientsForSalesRep(salesRepId, sessionToken);
          console.log(`📥 Recebidos ${clientsData.length} clientes do Supabase`);
          
          if (clientsData.length > 0) {
            console.log('💾 Salvando clientes no banco local...');
            await db.saveClients(clientsData);
            syncedClients = clientsData.length;
            console.log(`✅ Salvos ${syncedClients} clientes REAIS no SQLite`);
            
            // ✅ NOVO: Validar se dados foram salvos corretamente
            const savedClients = await db.getCustomers();
            const salesRepClients = savedClients.filter(c => c.sales_rep_id === salesRepId);
            console.log(`🔍 Validação pós-salvamento: ${savedClients.length} total, ${salesRepClients.length} do vendedor`);
            
            if (salesRepClients.length !== clientsData.length) {
              console.warn('⚠️ Discrepância detectada:', {
                recebidos: clientsData.length,
                salvos: salesRepClients.length,
                diferenca: clientsData.length - salesRepClients.length
              });
            }
          } else {
            console.log('ℹ️ Nenhum cliente encontrado no Supabase');
          }
        } catch (error) {
          console.error('❌ Falha ao sincronizar clientes:', error);
          // Não usar fallback para evitar dados antigos
          clientsData = [];
          syncedClients = 0;
        }

        // Etapa 2: Buscar produtos REAIS do Supabase
        updateProgress('Carregando produtos do Supabase...', 1, 5);
        try {
          console.log('📥 Buscando produtos REAIS do Supabase');
          productsData = await supabaseService.getProducts(sessionToken);
          console.log(`📥 Recebidos ${productsData.length} produtos do Supabase`);
          
          if (productsData.length > 0) {
            await db.saveProducts(productsData);
            syncedProducts = productsData.length;
            console.log(`✅ Salvos ${syncedProducts} produtos REAIS no SQLite`);
          } else {
            console.log('ℹ️ Nenhum produto encontrado no Supabase');
          }
        } catch (error) {
          console.error('❌ Falha ao sincronizar produtos:', error);
          productsData = [];
          syncedProducts = 0;
        }

        // Etapa 3: Buscar tabelas de pagamento REAIS do Supabase
        updateProgress('Carregando tabelas de pagamento do Supabase...', 2, 5);
        try {
          console.log('📥 Buscando tabelas de pagamento REAIS do Supabase');
          paymentTablesData = await supabaseService.getPaymentTables(sessionToken);
          console.log(`📥 Recebidas ${paymentTablesData.length} tabelas de pagamento do Supabase`);
          
          if (paymentTablesData.length > 0) {
            await db.savePaymentTables(paymentTablesData);
            syncedPaymentTables = paymentTablesData.length;
            console.log(`✅ Salvas ${syncedPaymentTables} tabelas de pagamento REAIS no SQLite`);
          } else {
            console.log('ℹ️ Nenhuma tabela de pagamento encontrada no Supabase');
          }
        } catch (error) {
          console.warn('⚠️ Falha ao sincronizar tabelas de pagamento:', error);
          paymentTablesData = [];
          syncedPaymentTables = 0;
        }

        // ✅ NOVA ETAPA 4: Buscar histórico de pedidos REAIS do Supabase
        updateProgress('Carregando histórico de pedidos do Supabase...', 3, 5);
        try {
          console.log('📥 Buscando histórico de pedidos REAIS do Supabase');
          ordersData = await supabaseService.getClientOrdersHistory(salesRepId, sessionToken);
          console.log(`📥 Recebidos ${ordersData.length} pedidos do Supabase`);
          
          if (ordersData.length > 0) {
            await db.saveOrders(ordersData);
            syncedOrders = ordersData.length;
            console.log(`✅ Salvos ${syncedOrders} pedidos REAIS no SQLite`);
          } else {
            console.log('ℹ️ Nenhum pedido encontrado no Supabase');
          }
        } catch (error) {
          console.warn('⚠️ Falha ao sincronizar histórico de pedidos:', error);
          ordersData = [];
          syncedOrders = 0;
        }
        
      } else {
        console.log('📱 OFFLINE MODE: Cannot sync without connection');
        return {
          success: false,
          error: 'Sem conexão com a internet. Não é possível sincronizar dados.'
        };
      }

      // Validar dados sincronizados
      updateProgress('Validando dados...', 4, 5);
      const isDataValid = validateSyncedData(clientsData, productsData, paymentTablesData);

      // Salvar metadata de sincronização
      const syncDate = new Date();
      localStorage.setItem('last_sync_date', syncDate.toISOString());
      localStorage.setItem('sales_rep_id', salesRepId);
      setLastSyncDate(syncDate);

      console.log('📊 Resumo da sincronização:', {
        mode: isOnline ? 'ONLINE' : 'OFFLINE',
        clients: syncedClients,
        products: syncedProducts,
        paymentTables: syncedPaymentTables,
        orders: syncedOrders,
        total: syncedClients + syncedProducts + syncedOrders,
        dataValid: isDataValid
      });

      const totalSynced = syncedClients + syncedProducts;
      
      if (totalSynced === 0) {
        return {
          success: false,
          error: 'Nenhum dado encontrado no Supabase. Verifique se há clientes e produtos cadastrados para este vendedor.'
        };
      }

      console.log('✅ Sincronização concluída - Dados REAIS carregados sem duplicações');
      
      return {
        success: true,
        syncedData: {
          clients: syncedClients,
          products: syncedProducts,
          paymentTables: syncedPaymentTables
        }
      };

    } catch (error) {
      console.error('❌ Falha na sincronização:', error);
      
      // Se for erro de versão, sugerir limpeza
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
    console.log('🔄 Forçando ressincronização COMPLETA com limpeza total');
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
