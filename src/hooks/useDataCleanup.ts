
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { supabaseService } from '@/services/SupabaseService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface CleanupResult {
  success: boolean;
  clientsRemoved: number;
  productsRemoved: number;
  clientsFromSupabase: number;
  clientsSavedLocally: number;
  duplicatesFound: number;
  error?: string;
}

export const useDataCleanup = () => {
  const [isCleaningData, setIsCleaningData] = useState(false);
  const { connected } = useNetworkStatus();

  const performDataCleanup = useCallback(async (salesRepId: string, sessionToken: string): Promise<CleanupResult> => {
    if (!connected) {
      toast.error('Sem conexão com a internet para limpeza de dados.');
      return { success: false, clientsRemoved: 0, productsRemoved: 0, clientsFromSupabase: 0, clientsSavedLocally: 0, duplicatesFound: 0, error: 'Sem conexão' };
    }

    if (!salesRepId || !sessionToken) {
      toast.error('Dados de autenticação necessários para limpeza.');
      return { success: false, clientsRemoved: 0, productsRemoved: 0, clientsFromSupabase: 0, clientsSavedLocally: 0, duplicatesFound: 0, error: 'Dados de auth inválidos' };
    }

    setIsCleaningData(true);
    console.log('🧹 INICIANDO LIMPEZA COMPLETA DE DADOS...');

    try {
      const db = getDatabaseAdapter();
      await db.initDatabase();

      // 1. Verificar dados locais antes da limpeza
      const clientsBeforeCleanup = await db.getCustomers();
      const productsBeforeCleanup = await db.getProducts();
      
      console.log('📊 DADOS ANTES DA LIMPEZA:', {
        clientsLocais: clientsBeforeCleanup.length,
        productsLocais: productsBeforeCleanup.length,
        clientsDoVendedor: clientsBeforeCleanup.filter(c => c.sales_rep_id === salesRepId).length
      });

      // 2. Buscar dados frescos do Supabase ANTES de limpar
      console.log('🔄 Buscando dados atualizados do Supabase...');
      const [supabaseClients, supabaseProducts] = await Promise.all([
        supabaseService.getClientsForSalesRep(salesRepId, sessionToken),
        supabaseService.getProducts(sessionToken)
      ]);

      console.log('📡 DADOS DO SUPABASE:', {
        clientes: supabaseClients.length,
        produtos: supabaseProducts.length
      });

      // 3. Limpar COMPLETAMENTE todos os dados locais
      console.log('🗑️ Limpando dados locais...');
      if (db.clearMockData) {
        await db.clearMockData();
      }

      // Limpar tabelas manualmente para garantir
      if (typeof (db as any).db?.run === 'function') {
        const sqliteDb = (db as any).db;
        await sqliteDb.run('DELETE FROM clients');
        await sqliteDb.run('DELETE FROM products');
        await sqliteDb.run('DELETE FROM payment_tables');
        console.log('✅ Tabelas SQLite limpas manualmente');
      }

      // Para WebDatabase, limpar via IndexedDB
      if (typeof (db as any).db?.transaction === 'function') {
        try {
          const tx = (db as any).db.transaction(['clients', 'products', 'payment_tables'], 'readwrite');
          await tx.objectStore('clients').clear();
          await tx.objectStore('products').clear();
          await tx.objectStore('payment_tables').clear();
          await tx.done;
          console.log('✅ IndexedDB limpo manualmente');
        } catch (error) {
          console.warn('⚠️ Erro ao limpar IndexedDB:', error);
        }
      }

      // 4. Verificar se limpeza foi efetiva
      const clientsAfterCleanup = await db.getCustomers();
      const productsAfterCleanup = await db.getProducts();

      console.log('🧹 DADOS APÓS LIMPEZA:', {
        clientsRestantes: clientsAfterCleanup.length,
        productsRestantes: productsAfterCleanup.length
      });

      if (clientsAfterCleanup.length > 0 || productsAfterCleanup.length > 0) {
        console.warn('⚠️ ATENÇÃO: Dados ainda presentes após limpeza!');
      }

      // 5. Salvar dados frescos do Supabase
      console.log('💾 Salvando dados frescos do Supabase...');
      
      // Detectar e remover duplicatas antes de salvar
      const uniqueClients = supabaseClients.reduce((acc: any[], current: any) => {
        const existingClient = acc.find(client => client.id === current.id);
        if (!existingClient) {
          acc.push(current);
        }
        return acc;
      }, []);

      const duplicatesFound = supabaseClients.length - uniqueClients.length;
      if (duplicatesFound > 0) {
        console.warn('🔍 DUPLICATAS ENCONTRADAS:', duplicatesFound);
      }

      await db.saveClients(uniqueClients);
      await db.saveProducts(supabaseProducts);

      // 6. Verificar dados salvos
      const clientsAfterSave = await db.getCustomers();
      const productsAfterSave = await db.getProducts();
      const salesRepClients = clientsAfterSave.filter(c => c.sales_rep_id === salesRepId);

      console.log('✅ DADOS APÓS SALVAR:', {
        clientesTotais: clientsAfterSave.length,
        clientsDoVendedor: salesRepClients.length,
        produtos: productsAfterSave.length,
        esperadoDoSupabase: supabaseClients.length
      });

      // 7. Verificar integridade
      const unexpectedClients = clientsAfterSave.filter(localClient => 
        !supabaseClients.some(supabaseClient => supabaseClient.id === localClient.id)
      );

      if (unexpectedClients.length > 0) {
        console.error('❌ CLIENTES INESPERADOS ENCONTRADOS:', unexpectedClients.map(c => ({
          id: c.id,
          name: c.name,
          sales_rep_id: c.sales_rep_id
        })));
      }

      const result: CleanupResult = {
        success: true,
        clientsRemoved: clientsBeforeCleanup.length,
        productsRemoved: productsBeforeCleanup.length,
        clientsFromSupabase: supabaseClients.length,
        clientsSavedLocally: salesRepClients.length,
        duplicatesFound
      };

      // 8. Atualizar localStorage
      localStorage.setItem('last_sync_date', new Date().toISOString());
      localStorage.setItem('data_cleanup_date', new Date().toISOString());

      toast.success(`Limpeza concluída! ${result.clientsFromSupabase} clientes sincronizados do Supabase`);
      console.log('🎉 LIMPEZA COMPLETA FINALIZADA COM SUCESSO!');

      return result;

    } catch (error) {
      console.error('❌ ERRO DURANTE LIMPEZA:', error);
      toast.error('Erro durante limpeza de dados: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
      
      return {
        success: false,
        clientsRemoved: 0,
        productsRemoved: 0,
        clientsFromSupabase: 0,
        clientsSavedLocally: 0,
        duplicatesFound: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    } finally {
      setIsCleaningData(false);
    }
  }, [connected]);

  return {
    isCleaningData,
    performDataCleanup
  };
};
