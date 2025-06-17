
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
    console.log(`📊 Sync Progress: ${stage} - ${current}/${total} (${percentage}%)`);
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

  const clearLocalData = useCallback(async () => {
    try {
      console.log('🗑️ Limpando TODOS os dados locais para forçar sincronização completa');
      const db = getDatabaseAdapter();
      
      // Forçar limpeza completa do cache
      await db.forceClearCache();
      
      // Limpar metadata de sincronização
      localStorage.removeItem('last_sync_date');
      localStorage.removeItem('sales_rep_id');
      
      console.log('✅ Dados locais limpos com sucesso - cache zerado');
    } catch (error) {
      console.error('❌ Erro ao limpar dados locais:', error);
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

  const validateAndProcessClients = (clients: any[]): any[] => {
    console.log('🔍 Processando clientes recebidos:', clients.length);
    
    const processedClients = clients.map(client => {
      // Processar visit_days se for string JSON
      let visitDays = client.visit_days;
      if (typeof visitDays === 'string') {
        try {
          visitDays = JSON.parse(visitDays);
        } catch (error) {
          console.warn('⚠️ Erro ao fazer parse de visit_days para cliente:', client.id, error);
          visitDays = [];
        }
      }
      
      return {
        ...client,
        visit_days: Array.isArray(visitDays) ? visitDays : []
      };
    });
    
    console.log('✅ Clientes processados com visit_days corretos');
    return processedClients;
  };

  const performFullSync = useCallback(async (salesRepId: string, sessionToken: string, forceClear = false): Promise<SyncResult> => {
    try {
      setIsSyncing(true);
      console.log('🔄 Iniciando sincronização COMPLETA com dados REAIS do Supabase');
      
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
      
      try {
        await db.initDatabase();
      } catch (dbError) {
        console.error('❌ Erro ao inicializar banco de dados:', dbError);
        
        if (dbError instanceof Error && dbError.message.includes('version')) {
          console.log('🔄 Conflito de versão detectado, executando limpeza...');
          await handleDatabaseVersionError();
          await db.initDatabase();
        } else {
          throw dbError;
        }
      }

      // Forçar limpeza se solicitado
      if (forceClear) {
        console.log('🗑️ Limpeza forçada solicitada');
        await clearLocalData();
      }

      let syncedClients = 0;
      let syncedProducts = 0;
      let syncedPaymentTables = 0;
      let clientsData: any[] = [];
      let productsData: any[] = [];
      let paymentTablesData: any[] = [];

      // Etapa 1: Buscar clientes REAIS
      updateProgress('Carregando clientes REAIS...', 0, 4);
      try {
        console.log('📥 Buscando clientes REAIS do Supabase para vendedor:', salesRepId);
        clientsData = await supabaseService.getClientsForSalesRep(salesRepId, sessionToken);
        console.log(`📥 Recebidos ${clientsData.length} clientes REAIS do Supabase`);
        
        if (clientsData.length > 0) {
          // Processar e validar dados dos clientes
          const processedClients = validateAndProcessClients(clientsData);
          
          console.log('💾 Salvando clientes REAIS no banco local...');
          await db.saveClients(processedClients);
          syncedClients = processedClients.length;
          console.log(`✅ Salvos ${syncedClients} clientes REAIS no banco local`);
          
          // Verificar se os dados foram salvos corretamente
          const savedClients = await db.getCustomers();
          console.log(`🔍 Verificação: ${savedClients.length} clientes encontrados no banco local após salvar`);
        } else {
          console.log('ℹ️ Nenhum cliente encontrado no Supabase para este vendedor');
          syncedClients = 0;
        }
      } catch (error) {
        console.error('❌ Falha ao sincronizar clientes:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        throw new Error(`Erro ao carregar clientes: ${errorMessage}`);
      }

      // Etapa 2: Buscar produtos REAIS
      updateProgress('Carregando produtos REAIS...', 1, 4);
      try {
        console.log('📥 Buscando produtos REAIS do Supabase');
        productsData = await supabaseService.getProducts(sessionToken);
        console.log(`📥 Recebidos ${productsData.length} produtos REAIS do Supabase`);
        
        if (productsData.length > 0) {
          console.log('💾 Salvando produtos REAIS no banco local...');
          await db.saveProducts(productsData);
          syncedProducts = productsData.length;
          console.log(`✅ Salvos ${syncedProducts} produtos REAIS no banco local`);
        } else {
          console.log('ℹ️ Nenhum produto encontrado no Supabase');
          syncedProducts = 0;
        }
      } catch (error) {
        console.error('❌ Falha ao sincronizar produtos:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        throw new Error(`Erro ao carregar produtos: ${errorMessage}`);
      }

      // Etapa 3: Buscar tabelas de pagamento REAIS
      updateProgress('Carregando tabelas de pagamento REAIS...', 2, 4);
      try {
        console.log('📥 Buscando tabelas de pagamento REAIS do Supabase');
        paymentTablesData = await supabaseService.getPaymentTables(sessionToken);
        console.log(`📥 Recebidas ${paymentTablesData.length} tabelas de pagamento REAIS`);
        
        if (paymentTablesData.length > 0) {
          console.log('💾 Salvando tabelas de pagamento REAIS no banco local...');
          await db.savePaymentTables(paymentTablesData);
          syncedPaymentTables = paymentTablesData.length;
          console.log(`✅ Salvas ${syncedPaymentTables} tabelas de pagamento REAIS no banco local`);
        } else {
          console.log('ℹ️ Nenhuma tabela de pagamento encontrada no Supabase');
          syncedPaymentTables = 0;
        }
      } catch (error) {
        console.warn('⚠️ Falha ao sincronizar tabelas de pagamento:', error);
        syncedPaymentTables = 0;
      }

      // Etapa 4: Validação final
      updateProgress('Validando dados sincronizados...', 3, 4);
      
      // Verificar integridade dos dados salvos
      const finalClients = await db.getCustomers();
      const finalProducts = await db.getProducts();
      const finalPaymentTables = await db.getPaymentTables();
      
      console.log('🔍 Verificação final dos dados salvos:', {
        clientsExpected: syncedClients,
        clientsSaved: finalClients.length,
        productsExpected: syncedProducts,
        productsSaved: finalProducts.length,
        paymentTablesExpected: syncedPaymentTables,
        paymentTablesSaved: finalPaymentTables.length
      });

      // Salvar metadata de sincronização
      const syncDate = new Date();
      localStorage.setItem('last_sync_date', syncDate.toISOString());
      localStorage.setItem('sales_rep_id', salesRepId);
      setLastSyncDate(syncDate);

      console.log('📊 RESUMO DA SINCRONIZAÇÃO REAL:', {
        clients: syncedClients,
        products: syncedProducts,
        paymentTables: syncedPaymentTables,
        total: syncedClients + syncedProducts + syncedPaymentTables
      });

      const totalSynced = syncedClients + syncedProducts;
      
      if (totalSynced === 0) {
        return {
          success: false,
          error: 'Nenhum dado REAL encontrado no Supabase. Verifique se há clientes e produtos cadastrados para este vendedor.'
        };
      }

      console.log('✅ Sincronização REAL concluída com sucesso');
      
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
    console.log('🔄 Forçando ressincronização COMPLETA com limpeza total de cache');
    return await performFullSync(salesRepId, sessionToken, true);
  }, [performFullSync]);

  const getStorageStats = useCallback(async () => {
    try {
      const db = getDatabaseAdapter();
      return await db.getStorageStats();
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return { clients: 0, products: 0, orders: 0, paymentTables: 0 };
    }
  }, []);

  return {
    isSyncing,
    syncProgress,
    lastSyncDate,
    performFullSync,
    forceResync,
    loadLastSyncDate,
    clearLocalData,
    getStorageStats,
    canSync: connected
  };
};
