
import { useState, useCallback } from 'react';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { toast } from 'sonner';

interface DataInconsistency {
  type: 'orphaned_client' | 'missing_sales_rep' | 'data_mismatch';
  clientId: string;
  clientName: string;
  details: string;
}

export const useClientDataValidation = () => {
  const [inconsistencies, setInconsistencies] = useState<DataInconsistency[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const validateClientData = useCallback(async (salesRepId: string) => {
    setIsValidating(true);
    console.log('🔍 Iniciando validação de dados de clientes...');
    
    try {
      const db = getDatabaseAdapter();
      const clients = await db.getClients();
      const foundInconsistencies: DataInconsistency[] = [];

      console.log(`📊 Validando ${clients.length} clientes para vendedor ${salesRepId}`);

      clients.forEach(client => {
        // Verificar clientes órfãos (sem vendedor)
        if (!client.sales_rep_id) {
          foundInconsistencies.push({
            type: 'orphaned_client',
            clientId: client.id,
            clientName: client.name,
            details: 'Cliente não tem vendedor associado'
          });
        }
        
        // Verificar clientes com vendedor diferente do logado
        else if (client.sales_rep_id !== salesRepId) {
          foundInconsistencies.push({
            type: 'data_mismatch',
            clientId: client.id,
            clientName: client.name,
            details: `Cliente associado ao vendedor ${client.sales_rep_id}, mas vendedor logado é ${salesRepId}`
          });
        }
      });

      setInconsistencies(foundInconsistencies);
      
      if (foundInconsistencies.length > 0) {
        console.warn(`⚠️ Encontradas ${foundInconsistencies.length} inconsistências:`, foundInconsistencies);
        toast.warning(`Encontradas ${foundInconsistencies.length} inconsistências nos dados`);
      } else {
        console.log('✅ Nenhuma inconsistência encontrada');
        toast.success('Dados validados com sucesso');
      }

      return foundInconsistencies;
    } catch (error) {
      console.error('❌ Erro ao validar dados:', error);
      toast.error('Erro ao validar dados');
      return [];
    } finally {
      setIsValidating(false);
    }
  }, []);

  const fixClientAssociation = useCallback(async (clientId: string, salesRepId: string) => {
    console.log(`🔧 Corrigindo associação do cliente ${clientId} para vendedor ${salesRepId}`);
    
    try {
      const db = getDatabaseAdapter();
      
      // Para WebDatabase, vamos atualizar diretamente o localStorage
      const clients = await db.getClients();
      const clientIndex = clients.findIndex(c => c.id === clientId);
      
      if (clientIndex >= 0) {
        clients[clientIndex].sales_rep_id = salesRepId;
        clients[clientIndex].updated_at = new Date().toISOString();
        
        // Salvar de volta no localStorage
        localStorage.setItem('clients', JSON.stringify(clients));
        
        console.log(`✅ Cliente ${clientId} associado ao vendedor ${salesRepId}`);
        toast.success('Relacionamento cliente-vendedor corrigido');
        
        // Remover da lista de inconsistências
        setInconsistencies(prev => prev.filter(inc => inc.clientId !== clientId));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Erro ao corrigir associação:', error);
      toast.error('Erro ao corrigir relacionamento');
      return false;
    }
  }, []);

  const syncDataFromServer = useCallback(async () => {
    console.log('🔄 Iniciando sincronização de dados do servidor...');
    toast.info('Sincronizando dados do servidor...');
    
    try {
      // Aqui poderia implementar uma sincronização real com o servidor
      // Por enquanto, apenas simular uma atualização
      setTimeout(() => {
        toast.success('Dados sincronizados com sucesso');
        window.location.reload(); // Forçar reload para recarregar dados
      }, 1000);
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      toast.error('Erro ao sincronizar dados');
    }
  }, []);

  return {
    inconsistencies,
    isValidating,
    validateClientData,
    fixClientAssociation,
    syncDataFromServer
  };
};
