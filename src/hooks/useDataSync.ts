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
    if (!salesRepId || salesRepId.trim() === '') {
      throw new Error('ID do vendedor é obrigatório para sincronização');
    }
    
    if (!sessionToken || sessionToken.trim() === '') {
      throw new Error('Token de sessão é obrigatório para sincronização');
    }
    
    console.log('✅ Parâmetros de sincronização validados:', {
      salesRepId: salesRepId.substring(0, 8) + '...',
      tokenType: sessionToken.startsWith('local_') ? 'LOCAL' : 'SUPABASE'
    });
  };

  const validateSyncedData = (clients: any[], products: any[], paymentTables: any[]) => {
    console.log('🔍 Validando dados sincronizados:', {
      clients: clients.length,
      products: products.length,
      paymentTables: paymentTables.length,
      clientsSample: clients.slice(0, 2).map(c => ({ id: c.id, name: c.name })),
      productsSample: products.slice(0, 2).map(p => ({ id: p.id, name: p.name }))
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
      console.log('🔄 Iniciando sincronização COMPLETA - APENAS DADOS REAIS');
      
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
      updateProgress('Carregando clientes...', 0, 3);
      try {
        console.log('📥 Buscando clientes REAIS do Supabase');
        clientsData = await supabaseService.getClientsForSalesRep(salesRepId, sessionToken);
        console.log(`📥 Recebidos ${clientsData.length} clientes do serviço`);
        
        if (clientsData.length > 0) {
          await db.saveClients(clientsData);
          syncedClients = clientsData.length;
          console.log(`✅ Salvos ${syncedClients} clientes REAIS`);
        } else {
          console.log('ℹ️ Nenhum cliente encontrado no banco de dados');
          syncedClients = 0;
        }
      } catch (error) {
        console.error('❌ Falha ao sincronizar clientes:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        throw new Error(`Erro ao carregar clientes: ${errorMessage}`);
      }

      // Etapa 2: Buscar produtos REAIS com limpeza completa
      updateProgress('Carregando produtos...', 1, 3);
      try {
        console.log('📥 Buscando produtos REAIS do Supabase');
        productsData = await supabaseService.getProducts(sessionToken);
        console.log(`📥 Recebidos ${productsData.length} produtos do serviço`);
        
        // Log detalhado dos produtos recebidos
        productsData.forEach((product, index) => {
          console.log(`📦 Produto ${index + 1} do Supabase:`, {
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
          console.log(`✅ Salvos ${syncedProducts} produtos REAIS após limpeza completa`);
        } else {
          console.log('ℹ️ Nenhum produto encontrado no banco de dados');
          syncedProducts = 0;
        }
      } catch (error) {
        console.error('❌ Falha ao sincronizar produtos:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        throw new Error(`Erro ao carregar produtos: ${errorMessage}`);
      }

      // Etapa 3: Buscar tabelas de pagamento
      updateProgress('Carregando tabelas de pagamento...', 2, 3);
      try {
        console.log('📥 Buscando tabelas de pagamento REAIS');
        paymentTablesData = await supabaseService.getPaymentTables(sessionToken);
        console.log(`📥 Recebidas ${paymentTablesData.length} tabelas de pagamento`);
        syncedPaymentTables = paymentTablesData.length;
      } catch (error) {
        console.warn('⚠️ Falha ao sincronizar tabelas de pagamento:', error);
        syncedPaymentTables = 0;
      }

      // Validar dados sincronizados
      updateProgress('Validando dados...', 3, 3);
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
        total: syncedClients + syncedProducts,
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
      console.error('❌ Falha na sincronização:', error);
      
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
