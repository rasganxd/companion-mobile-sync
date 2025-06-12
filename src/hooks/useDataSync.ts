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
      console.log('🗑️ Limpando dados locais para forçar sincronização completa');
      const db = getDatabaseAdapter();
      
      // Limpar metadata de sincronização
      localStorage.removeItem('last_sync_date');
      localStorage.removeItem('sales_rep_id');
      
      console.log('✅ Dados locais limpos com sucesso');
    } catch (error) {
      console.error('❌ Erro ao limpar dados locais:', error);
    }
  }, []);

  const clearMockData = useCallback(async () => {
    try {
      console.log('🗑️ Iniciando limpeza FORÇADA de dados mock...');
      const db = getDatabaseAdapter();
      
      // Forçar limpeza de dados mock
      if ('forceClearMockData' in db && typeof db.forceClearMockData === 'function') {
        await db.forceClearMockData();
        console.log('✅ Dados mock limpos via forceClearMockData');
      } else if ('clearMockData' in db && typeof db.clearMockData === 'function') {
        await db.clearMockData();
        console.log('✅ Dados mock limpos via clearMockData');
      }
      
      console.log('✅ Limpeza forçada de dados mock concluída');
    } catch (error) {
      console.error('❌ Erro ao limpar dados mock:', error);
    }
  }, []);

  const forceCleanAllProducts = useCallback(async () => {
    try {
      console.log('🗑️ Iniciando limpeza COMPLETA de todos os produtos...');
      const db = getDatabaseAdapter();
      
      if ('forceCleanAllProducts' in db && typeof db.forceCleanAllProducts === 'function') {
        await db.forceCleanAllProducts();
        console.log('✅ Limpeza COMPLETA de produtos concluída');
      }
    } catch (error) {
      console.error('❌ Erro na limpeza completa de produtos:', error);
    }
  }, []);

  const validateSyncParams = (salesRepId: string, sessionToken: string) => {
    console.log('🔍 [SYNC_VALIDATION] Validating sync parameters:', {
      salesRepId: salesRepId ? `${salesRepId.substring(0, 8)}...` : 'UNDEFINED/NULL',
      salesRepIdType: typeof salesRepId,
      salesRepIdIsEmpty: !salesRepId,
      salesRepIdTrimEmpty: salesRepId?.trim() === '',
      sessionToken: sessionToken ? (sessionToken.startsWith('local_') ? 'LOCAL_TOKEN' : 'SUPABASE_TOKEN') : 'UNDEFINED/NULL',
      sessionTokenType: typeof sessionToken,
      sessionTokenIsEmpty: !sessionToken,
      sessionTokenTrimEmpty: sessionToken?.trim() === ''
    });

    if (!salesRepId || salesRepId.trim() === '') {
      const error = 'ID do vendedor é obrigatório para sincronização';
      console.error('❌ [SYNC_VALIDATION] Sales rep ID validation failed:', error);
      throw new Error(error);
    }
    
    if (!sessionToken || sessionToken.trim() === '') {
      const error = 'Token de sessão é obrigatório para sincronização';
      console.error('❌ [SYNC_VALIDATION] Session token validation failed:', error);
      throw new Error(error);
    }
    
    console.log('✅ [SYNC_VALIDATION] Sync parameters validated successfully');
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

    // Verificar se há dados mock ainda presentes
    const hasMockClients = clients.some(c => 
      c.name?.toLowerCase().includes('mykaela') || 
      c.company_name?.toLowerCase().includes('mykaela')
    );
    const hasMockProducts = products.some(p => 
      p.name?.toLowerCase().includes('produto premium') || 
      p.name?.toLowerCase().includes('produto standard')
    );

    if (hasMockClients) {
      console.warn('⚠️ ATENÇÃO: Dados mock de clientes ainda presentes!');
    }
    if (hasMockProducts) {
      console.warn('⚠️ ATENÇÃO: Dados mock de produtos ainda presentes!');
    }

    return !hasMockClients && !hasMockProducts;
  };

  const performFullSync = useCallback(async (salesRepId: string, sessionToken: string, forceClear = false): Promise<SyncResult> => {
    try {
      setIsSyncing(true);
      console.log('🔄 [SYNC] Starting COMPLETE sync - REAL DATA ONLY');
      console.log('🔄 [SYNC] Input parameters received:', {
        salesRepId: salesRepId ? `${salesRepId.substring(0, 8)}...` : 'UNDEFINED/NULL',
        salesRepIdType: typeof salesRepId,
        sessionToken: sessionToken ? (sessionToken.startsWith('local_') ? 'LOCAL_TOKEN' : 'SUPABASE_TOKEN') : 'UNDEFINED/NULL',
        sessionTokenType: typeof sessionToken,
        forceClear
      });
      
      // ✅ CORREÇÃO: Validar parâmetros antes de prosseguir
      try {
        validateSyncParams(salesRepId, sessionToken);
      } catch (validationError) {
        console.error('❌ [SYNC] Parameter validation failed:', validationError);
        return {
          success: false,
          error: validationError instanceof Error ? validationError.message : 'Parâmetros inválidos'
        };
      }

      const db = getDatabaseAdapter();
      await db.initDatabase();

      // SEMPRE executar limpeza de dados mock primeiro
      await clearMockData();

      if (forceClear) {
        await clearLocalData();
        // NOVA: Limpeza completa de produtos
        await forceCleanAllProducts();
      }

      let syncedClients = 0;
      let syncedProducts = 0;
      let syncedPaymentTables = 0;
      let clientsData: any[] = [];
      let productsData: any[] = [];
      let paymentTablesData: any[] = [];

      // Etapa 1: Buscar clientes REAIS
      updateProgress('Carregando clientes...', 0, 4);
      try {
        console.log('📥 [SYNC] Fetching REAL clients from Supabase with params:', {
          salesRepId: salesRepId.substring(0, 8) + '...',
          sessionTokenType: sessionToken.startsWith('local_') ? 'LOCAL' : 'SUPABASE'
        });
        
        clientsData = await supabaseService.getClientsForSalesRep(salesRepId, sessionToken);
        console.log(`📥 [SYNC] Received ${clientsData.length} clients from service`);
        
        if (clientsData.length > 0) {
          await db.saveClients(clientsData);
          syncedClients = clientsData.length;
          console.log(`✅ [SYNC] Saved ${syncedClients} REAL clients`);
        } else {
          console.log('ℹ️ [SYNC] No clients found in database for this sales rep');
          syncedClients = 0;
        }
      } catch (error) {
        console.error('❌ [SYNC] Failed to sync clients:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        throw new Error(`Erro ao carregar clientes: ${errorMessage}`);
      }

      // Etapa 2: Buscar produtos REAIS com limpeza completa
      updateProgress('Carregando produtos...', 1, 4);
      try {
        console.log('📥 [SYNC] Fetching REAL products from Supabase');
        productsData = await supabaseService.getProducts(sessionToken);
        console.log(`📥 [SYNC] Received ${productsData.length} products from service`);
        
        // Log detalhado dos produtos recebidos
        productsData.forEach((product, index) => {
          console.log(`📦 [SYNC] Product ${index + 1} from Supabase:`, {
            id: product.id,
            name: product.name,
            code: product.code,
            sale_price: product.sale_price
          });
        });
        
        if (productsData.length > 0) {
          // O saveProducts já faz a limpeza completa antes de salvar
          await db.saveProducts(productsData);
          syncedProducts = productsData.length;
          console.log(`✅ [SYNC] Saved ${syncedProducts} REAL products after complete cleanup`);
        } else {
          console.log('ℹ️ [SYNC] No products found in database');
          syncedProducts = 0;
        }
      } catch (error) {
        console.error('❌ [SYNC] Failed to sync products:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        throw new Error(`Erro ao carregar produtos: ${errorMessage}`);
      }

      // Etapa 3: Buscar tabelas de pagamento REAIS
      updateProgress('Carregando tabelas de pagamento...', 2, 4);
      try {
        console.log('📥 [SYNC] Fetching REAL payment tables from Supabase');
        paymentTablesData = await supabaseService.getPaymentTables(sessionToken);
        console.log(`📥 [SYNC] Received ${paymentTablesData.length} payment tables`);
        
        // Log detalhado das tabelas de pagamento recebidas
        paymentTablesData.forEach((paymentTable, index) => {
          console.log(`💳 [SYNC] Payment table ${index + 1} from Supabase:`, {
            id: paymentTable.id,
            name: paymentTable.name,
            type: paymentTable.type,
            active: paymentTable.active
          });
        });
        
        if (paymentTablesData.length > 0) {
          await db.savePaymentTables(paymentTablesData);
          syncedPaymentTables = paymentTablesData.length;
          console.log(`✅ [SYNC] Saved ${syncedPaymentTables} REAL payment tables`);
        } else {
          console.log('ℹ️ [SYNC] No payment tables found in database');
          syncedPaymentTables = 0;
        }
      } catch (error) {
        console.warn('⚠️ [SYNC] Failed to sync payment tables:', error);
        syncedPaymentTables = 0;
      }

      // Validar dados sincronizados
      updateProgress('Validando dados...', 3, 4);
      const isDataValid = validateSyncedData(clientsData, productsData, paymentTablesData);

      if (!isDataValid) {
        console.warn('⚠️ Dados mock detectados após sincronização!');
        // Executar segunda limpeza
        await clearMockData();
      }

      // Salvar metadata de sincronização
      const syncDate = new Date();
      localStorage.setItem('last_sync_date', syncDate.toISOString());
      localStorage.setItem('sales_rep_id', salesRepId);
      setLastSyncDate(syncDate);

      console.log('📊 Resumo da sincronização:', {
        clients: syncedClients,
        products: syncedProducts,
        paymentTables: syncedPaymentTables,
        total: syncedClients + syncedProducts + syncedPaymentTables,
        dataValid: isDataValid
      });

      const totalSynced = syncedClients + syncedProducts;
      
      if (totalSynced === 0) {
        return {
          success: false,
          error: 'Nenhum dado encontrado no banco de dados. Verifique se há clientes e produtos cadastrados para este vendedor.'
        };
      }

      console.log('✅ Sincronização concluída - APENAS dados REAIS carregados');
      
      return {
        success: true,
        syncedData: {
          clients: syncedClients,
          products: syncedProducts,
          paymentTables: syncedPaymentTables
        }
      };

    } catch (error) {
      console.error('❌ [SYNC] Sync failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro durante a sincronização. Tente novamente.'
      };
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  }, [connected, clearLocalData, clearMockData, forceCleanAllProducts]);

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
    clearMockData,
    forceCleanAllProducts,
    canSync: connected
  };
};
