
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
      const db = getDatabaseAdapter();
      const tables = await db.getPaymentTables();
      
      // Filtrar apenas tabelas ativas
      const activeTables = tables.filter(table => table.active);
      
      console.log('💳 Tabelas de pagamento carregadas:', activeTables);
      setPaymentTables(activeTables);
      
      // Auto-selecionar primeira tabela como padrão
      if (activeTables.length > 0 && !selectedPaymentTable) {
        console.log('💳 Auto-selecionando primeira tabela de pagamento:', activeTables[0]);
        setSelectedPaymentTable(activeTables[0]);
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar tabelas de pagamento:', error);
      toast.error('Erro ao carregar formas de pagamento');
    } finally {
      setLoading(false);
    }
  };

  const selectPaymentTable = (tableId: string) => {
    if (tableId === 'none') {
      setSelectedPaymentTable(null);
      return;
    }
    
    const table = paymentTables.find(t => t.id === tableId);
    if (table) {
      console.log('💳 Tabela de pagamento selecionada:', table);
      setSelectedPaymentTable(table);
    }
  };

  return {
    paymentTables,
    selectedPaymentTable,
    loading,
    selectPaymentTable
  };
};
