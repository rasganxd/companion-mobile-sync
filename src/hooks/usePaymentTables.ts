
import { useState, useEffect } from 'react';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { toast } from 'sonner';

interface PaymentTable {
  id: string;
  name: string;
  description?: string;
  type?: string;
  payable_to?: string;
  payment_location?: string;
  active: boolean;
}

export const usePaymentTables = () => {
  const [paymentTables, setPaymentTables] = useState<PaymentTable[]>([]);
  const [selectedPaymentTable, setSelectedPaymentTable] = useState<PaymentTable | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentTables();
  }, []);

  const loadPaymentTables = async () => {
    try {
      setLoading(true);
      console.log('🔍 Iniciando carregamento de tabelas de pagamento...');
      
      const db = getDatabaseAdapter();
      console.log('🔍 Adapter obtido:', db);
      
      const tables = await db.getPaymentTables();
      console.log('🔍 Tabelas brutas do banco:', tables);
      
      // Filtrar apenas tabelas ativas
      const activeTables = tables.filter(table => table.active);
      
      console.log('💳 Tabelas de pagamento carregadas:', activeTables);
      console.log('💳 Quantidade de tabelas ativas:', activeTables.length);
      
      setPaymentTables(activeTables);
      
      // Auto-selecionar primeira tabela como padrão
      if (activeTables.length > 0 && !selectedPaymentTable) {
        console.log('💳 Auto-selecionando primeira tabela de pagamento:', activeTables[0]);
        setSelectedPaymentTable(activeTables[0]);
      } else if (activeTables.length === 0) {
        console.log('⚠️ Nenhuma tabela de pagamento ativa encontrada');
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar tabelas de pagamento:', error);
      toast.error('Erro ao carregar formas de pagamento');
    } finally {
      setLoading(false);
    }
  };

  const selectPaymentTable = (tableId: string) => {
    console.log('💳 Tentando selecionar tabela:', tableId);
    
    if (tableId === 'none') {
      console.log('💳 Removendo seleção de tabela');
      setSelectedPaymentTable(null);
      return;
    }
    
    const table = paymentTables.find(t => t.id === tableId);
    if (table) {
      console.log('💳 Tabela de pagamento selecionada:', table);
      setSelectedPaymentTable(table);
    } else {
      console.log('⚠️ Tabela não encontrada para ID:', tableId);
    }
  };

  return {
    paymentTables,
    selectedPaymentTable,
    loading,
    selectPaymentTable
  };
};
