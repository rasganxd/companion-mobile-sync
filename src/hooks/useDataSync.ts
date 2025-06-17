
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

  const handleDatabaseVersionError = useCallback(async () => {
    try {
      console.log('🔄 Handling database version conflict...');
      const db = getDatabaseAdapter();
      await db.closeDatabase();
      await db.initDatabase();
      console.log('✅ Database reinitialized after version conflict');
    } catch (error) {
      console.error('❌ Error handling database version conflict:', error);
      throw new Error('Falha ao corrigir conflito de versão do banco de dados');
    }
  }, []);

  const clearLocalData = useCallback(async () => {
    try {
      console.log('🗑️ Limpando dados locais para forçar sincronização completa');
      
      // Limpar metadata de sincronização
      localStorage.removeItem('last_sync_date');
      localStorage.removeItem('sales_rep_id');
      
      console.log('✅ Dados locais limpos com sucesso');
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

  const performFullSync = useCallback(async (salesRepId: string, sessionToken: string, forceClear = false): Promise<SyncResult> => {
    try {
      setIsSyncing(true);
      console.log('🔄 Iniciando sincronização COMPLETA');
      
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

      if (forceClear) {
        await clearLocalData();
      }

      let syncedClients = 0;
      let syncedProducts = 0;
      let syncedPaymentTables = 0;
      let clientsData: any[] = [];
      let productsData: any[] = [];
      let paymentTablesData: any[] = [];

      // Etapa 1: Buscar clientes
      updateProgress('Carregando clientes...', 0, 4);
      try {
        console.log('📥 Buscando clientes do Supabase');
        clientsData = await supabaseService.getClientsForSalesRep(salesRepId, sessionToken);
        console.log(`📥 Recebidos ${clientsData.length} clientes do serviço`);
        
        if (clientsData.length > 0) {
          await db.saveClients(clientsData);
          syncedClients = clientsData.length;
          console.log(`✅ Salvos ${syncedClients} clientes`);
        } else {
          console.log('ℹ️ Nenhum cliente encontrado no banco de dados');
          syncedClients = 0;
        }
      } catch (error) {
        console.error('❌ Falha ao sincronizar clientes:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        throw new Error(`Erro ao carregar clientes: ${errorMessage}`);
      }

      // Etapa 2: Buscar produtos
      updateProgress('Carregando produtos...', 1, 4);
      try {
        console.log('📥 Buscando produtos do Supabase');
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
          await db.saveProducts(productsData);
          syncedProducts = productsData.length;
          console.log(`✅ Salvos ${syncedProducts} produtos`);
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
      updateProgress('Carregando tabelas de pagamento...', 2, 4);
      try {
        console.log('📥 Buscando tabelas de pagamento do Supabase');
        paymentTablesData = await supabaseService.getPaymentTables(sessionToken);
        console.log(`📥 Recebidas ${paymentTablesData.length} tabelas de pagamento`);
        
        // Log detalhado das tabelas de pagamento recebidas
        paymentTablesData.forEach((paymentTable, index) => {
          console.log(`💳 Tabela de pagamento ${index + 1} do Supabase:`, {
            id: paymentTable.id,
            name: paymentTable.name,
            type: paymentTable.type,
            active: paymentTable.active
          });
        });
        
        if (paymentTablesData.length > 0) {
          await db.savePaymentTables(paymentTablesData);
          syncedPaymentTables = paymentTablesData.length;
          console.log(`✅ Salvas ${syncedPaymentTables} tabelas de pagamento`);
        } else {
          console.log('ℹ️ Nenhuma tabela de pagamento encontrada no banco de dados');
          syncedPaymentTables = 0;
        }
      } catch (error) {
        console.warn('⚠️ Falha ao sincronizar tabelas de pagamento:', error);
        syncedPaymentTables = 0;
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
        total: syncedClients + syncedProducts + syncedPaymentTables
      });

      const totalSynced = syncedClients + syncedProducts;
      
      if (totalSynced === 0) {
        return {
          success: false,
          error: 'Nenhum dado encontrado no banco de dados. Verifique se há clientes e produtos cadastrados para este vendedor.'
        };
      }

      console.log('✅ Sincronização concluída com sucesso');
      
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
    canSync: connected
  };
};
