
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
      
      // ✅ MELHORADO: Auto-seleção mais inteligente
      if (activeTables.length > 0 && !selectedPaymentTable) {
        // Buscar especificamente a tabela "À Vista" como padrão
        const aVistaTable = activeTables.find(table => 
          table.name.toLowerCase().includes('vista') || 
          table.name.toLowerCase().includes('à vista') ||
          table.name.toLowerCase() === 'a vista'
        );
        
        if (aVistaTable) {
          console.log('💳 Auto-selecionando tabela "À Vista":', aVistaTable);
          setSelectedPaymentTable(aVistaTable);
        } else {
          // ✅ ALTERADO: Não auto-selecionar mais para forçar escolha consciente
          console.log('💳 "À Vista" não encontrada. Usuário deve selecionar manualmente.');
          console.log('💳 Tabelas disponíveis:', activeTables.map(t => t.name));
        }
      } else if (activeTables.length === 0) {
        console.log('⚠️ Nenhuma tabela de pagamento ativa encontrada');
        toast.warning('Nenhuma forma de pagamento disponível. Verifique a sincronização.');
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
    
    const table = paymentTables.find(t => t.id === tableId);
    if (table) {
      console.log('💳 Tabela de pagamento selecionada:', table);
      setSelectedPaymentTable(table);
      toast.success(`Forma de pagamento selecionada: ${table.name}`);
    } else {
      console.log('⚠️ Tabela não encontrada para ID:', tableId);
      toast.error('Forma de pagamento não encontrada');
    }
  };

  return {
    paymentTables,
    selectedPaymentTable,
    loading,
    selectPaymentTable
  };
};
