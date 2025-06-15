
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';

interface OrderItem {
  id: number;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  code: string;
  unit: string;
}

interface Client {
  id: string;
  name: string;
  company_name?: string;
  sales_rep_id?: string;
}

interface PaymentTable {
  id: string;
  name: string;
  description?: string;
  type?: string;
  payable_to?: string;
  payment_location?: string;
  active: boolean;
}

export const useOrderManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { salesRep } = useAuth();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addOrderItem = (item: OrderItem) => {
    setOrderItems(prev => [...prev, item]);
    toast.success('Produto adicionado ao pedido');
  };

  const removeOrderItem = (itemId: number) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
    toast.success('Item removido do pedido');
  };

  const clearCart = () => {
    setOrderItems([]);
    toast.success('Carrinho limpo');
  };

  const calculateTotal = () => {
    const total = orderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    return total.toFixed(2);
  };

  const validateOrderItems = async (): Promise<boolean> => {
    if (orderItems.length === 0) {
      toast.error('Adicione produtos ao pedido');
      return false;
    }

    try {
      const db = getDatabaseAdapter();
      
      // Verificar APENAS max_discount_percent de todos os produtos no pedido
      for (const item of orderItems) {
        const products = await db.getProducts();
        const product = products.find(p => p.id === item.productId);
        
        if (product && product.max_discount_percent && product.max_discount_percent > 0) {
          const salePrice = product.sale_price || product.price || 0;
          const minPriceByDiscount = salePrice * (1 - product.max_discount_percent / 100);
          
          if (item.price < minPriceByDiscount) {
            const currentDiscount = ((salePrice - item.price) / salePrice) * 100;
            console.log('❌ Produto com desconto acima do permitido:', {
              productName: item.productName,
              itemPrice: item.price,
              salePrice,
              maxDiscountPercent: product.max_discount_percent,
              currentDiscount,
              minPriceByDiscount
            });
            
            toast.error(`❌ Produto "${item.productName}" tem desconto de ${currentDiscount.toFixed(1)}%, máximo permitido: ${product.max_discount_percent.toFixed(1)}%`);
            return false;
          }
        }
      }
      
      console.log('✅ Todos os itens do pedido passaram na validação de desconto');
      return true;
    } catch (error) {
      console.error('❌ Erro ao validar itens do pedido:', error);
      toast.error('Erro ao validar preços dos produtos');
      return false;
    }
  };

  const saveAsDraft = async (selectedClient: Client | null) => {
    if (orderItems.length === 0) {
      toast.warning('Adicione produtos ao pedido para salvar como rascunho');
      return;
    }

    if (!selectedClient) {
      toast.warning('Selecione um cliente para salvar o rascunho');
      return;
    }

    try {
      const draftKey = `draft_order_${selectedClient.id}`;
      const draftData = {
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        items: orderItems,
        total: calculateTotal(),
        savedAt: new Date().toISOString()
      };

      localStorage.setItem(draftKey, JSON.stringify(draftData));
      toast.success('Pedido salvo como rascunho! Continue editando quando quiser.');
    } catch (error) {
      console.error('❌ Erro ao salvar rascunho:', error);
      toast.error('Erro ao salvar rascunho');
    }
  };

  const finishOrder = async (selectedClient: Client | null, paymentTableId?: string) => {
    if (!selectedClient) {
      toast.error('Selecione um cliente');
      return;
    }

    // ✅ NOVO: Validação obrigatória de método de pagamento
    if (!paymentTableId) {
      toast.error('Selecione uma forma de pagamento antes de finalizar o pedido');
      return;
    }

    // Validar todos os itens antes de finalizar
    const isValid = await validateOrderItems();
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const db = getDatabaseAdapter();
      
      // ✅ NOVO: Buscar dados completos da tabela de pagamento
      console.log('💳 Buscando dados da tabela de pagamento:', paymentTableId);
      const paymentTables = await db.getPaymentTables();
      const selectedPaymentTable = paymentTables.find(table => table.id === paymentTableId);
      
      if (!selectedPaymentTable) {
        console.error('❌ Tabela de pagamento não encontrada:', paymentTableId);
        toast.error('Erro: Forma de pagamento não encontrada. Tente selecionar novamente.');
        return;
      }

      console.log('✅ Tabela de pagamento encontrada:', selectedPaymentTable);

      const orderData = {
        id: uuidv4(),
        customer_id: selectedClient.id,
        customer_name: selectedClient.name,
        total: parseFloat(calculateTotal()),
        date: new Date().toISOString(),
        status: 'pending' as const,
        sync_status: 'pending_sync' as const,
        items: orderItems,
        sales_rep_id: salesRep?.id,
        // ✅ NOVO: Enviar tanto o UUID quanto o nome da tabela de pagamento
        payment_table_id: paymentTableId,
        payment_method: selectedPaymentTable.name
      };

      console.log('💾 Salvando pedido com dados completos de pagamento:', {
        orderId: orderData.id,
        paymentTableId: orderData.payment_table_id,
        paymentMethod: orderData.payment_method,
        customerName: orderData.customer_name,
        total: orderData.total,
        itemsCount: orderData.items.length
      });

      await db.saveOrder(orderData);
      
      // Limpar rascunho se existir
      const draftKey = `draft_order_${selectedClient.id}`;
      localStorage.removeItem(draftKey);
      
      toast.success('Pedido criado com sucesso!');
      
      // Extrair dados do estado atual para preservar na navegação
      const { day } = location.state || {};
      
      // Redirecionar para a lista de clientes ao invés de my-orders
      navigate('/clients-list', {
        state: { 
          day: day || 'hoje',
          orderCreated: true,
          clientId: selectedClient.id,
          clientName: selectedClient.name
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao salvar pedido:', error);
      toast.error('Erro ao criar pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    orderItems,
    isSubmitting,
    addOrderItem,
    removeOrderItem,
    clearCart,
    calculateTotal,
    saveAsDraft,
    finishOrder
  };
};
