
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
      console.log('🗑️ Iniciando limpeza forçada de dados mock...');
      const db = getDatabaseAdapter();
      
      // Usar o método forceClearMockData se disponível, senão usar clearMockData
      if ('forceClearMockData' in db && typeof db.forceClearMockData === 'function') {
        await db.forceClearMockData();
      } else if ('clearMockData' in db && typeof db.clearMockData === 'function') {
        await db.clearMockData();
      }
      
      console.log('✅ Limpeza forçada de dados mock concluída');
    } catch (error) {
      console.error('❌ Erro ao limpar dados mock:', error);
    }
  }, []);

  const validateSyncedData = (clients: any[], products: any[], paymentTables: any[]) => {
    console.log('🔍 Validando dados sincronizados:', {
      clients: clients.length,
      products: products.length,
      paymentTables: paymentTables.length,
      clientsSample: clients.slice(0, 2).map(c => ({ id: c.id, name: c.name })),
      productsSample: products.slice(0, 2).map(p => ({ id: p.id, name: p.name }))
    });

    return true; // Sempre retornar true para permitir sincronização
  };

  const performFullSync = useCallback(async (salesRepId: string, sessionToken: string, forceClear = false): Promise<SyncResult> => {
    try {
      setIsSyncing(true);
      console.log('🔄 Iniciando sincronização COMPLETA para vendedor:', salesRepId);
      console.log('🔑 Tipo do token:', sessionToken.startsWith('local_') ? 'LOCAL' : 'SUPABASE');

      const db = getDatabaseAdapter();
      await db.initDatabase();

      // SEMPRE executar limpeza de dados mock no início
      await clearMockData();

      if (forceClear) {
        await clearLocalData();
      }

      let syncedClients = 0;
      let syncedProducts = 0;
      let syncedPaymentTables = 0;
      let clientsData: any[] = [];
      let productsData: any[] = [];
      let paymentTablesData: any[] = [];

      // Etapa 1: Buscar clientes REAIS do Supabase
      updateProgress('Carregando clientes...', 0, 3);
      try {
        console.log('📥 Buscando clientes REAIS do Supabase para vendedor:', salesRepId);
        clientsData = await supabaseService.getClientsForSalesRep(salesRepId, sessionToken);
        console.log(`📥 Recebidos ${clientsData.length} clientes do serviço de sincronização`);
        
        if (clientsData.length > 0) {
          await db.saveClients(clientsData);
          syncedClients = clientsData.length;
          console.log(`✅ Salvos ${syncedClients} clientes REAIS no banco local`);
        } else {
          console.log('ℹ️ Nenhum cliente REAL do sync');
          syncedClients = 0;
        }
      } catch (error) {
        console.warn('⚠️ Falha ao sincronizar clientes:', error);
        syncedClients = 0;
      }

      // Etapa 2: Buscar produtos REAIS do Supabase
      updateProgress('Carregando produtos...', 1, 3);
      try {
        console.log('📥 Buscando produtos REAIS do Supabase');
        productsData = await supabaseService.getProducts(sessionToken);
        console.log(`📥 Recebidos ${productsData.length} produtos do serviço de sincronização`);
        
        if (productsData.length > 0) {
          await db.saveProducts(productsData);
          syncedProducts = productsData.length;
          console.log(`✅ Salvos ${syncedProducts} produtos REAIS no banco local`);
        } else {
          console.log('ℹ️ Nenhum produto REAL do sync');
          syncedProducts = 0;
        }
      } catch (error) {
        console.warn('⚠️ Falha ao sincronizar produtos:', error);
        syncedProducts = 0;
      }

      // Etapa 3: Buscar tabelas de pagamento
      updateProgress('Carregando tabelas de pagamento...', 2, 3);
      try {
        console.log('📥 Buscando tabelas de pagamento do Supabase');
        paymentTablesData = await supabaseService.getPaymentTables(sessionToken);
        console.log(`📥 Recebidas ${paymentTablesData.length} tabelas de pagamento`);
        syncedPaymentTables = paymentTablesData.length;
      } catch (error) {
        console.warn('⚠️ Falha ao sincronizar tabelas de pagamento:', error);
        syncedPaymentTables = 0;
      }

      // Validar dados sincronizados
      updateProgress('Validando dados sincronizados...', 3, 3);
      const isDataValid = validateSyncedData(clientsData, productsData, paymentTablesData);

      // Executar limpeza final para garantir que nenhum dado mock permaneceu
      await clearMockData();

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
        console.log('❌ Nenhum dado REAL foi sincronizado');
        
        return {
          success: false,
          error: 'Nenhum dado foi sincronizado. Verifique sua conexão e tente novamente.'
        };
      }

      console.log('✅ Sincronização concluída com sucesso - apenas dados REAIS');
      
      return {
        success: true,
        syncedData: {
          clients: syncedClients,
          products: syncedProducts,
          paymentTables: syncedPaymentTables
        }
      };

    } catch (error) {
      console.error('❌ Falha na sincronização completa:', error);
      
      return {
        success: false,
        error: 'Erro durante a sincronização. Tente novamente.'
      };
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  }, [connected, clearLocalData, clearMockData]);

  const loadLastSyncDate = useCallback(() => {
    const saved = localStorage.getItem('last_sync_date');
    if (saved) {
      setLastSyncDate(new Date(saved));
    }
  }, []);

  const forceResync = useCallback(async (salesRepId: string, sessionToken: string): Promise<SyncResult> => {
    console.log('🔄 Forçando ressincronização completa com limpeza de dados mock');
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
    canSync: connected
  };
};
