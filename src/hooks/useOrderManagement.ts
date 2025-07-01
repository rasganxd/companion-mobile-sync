
import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { useAuth } from '@/contexts/AuthContext';
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
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

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
    setEditingOrderId(null);
    toast.success('Carrinho limpo');
  };

  const calculateTotal = () => {
    const total = orderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    return total.toFixed(2);
  };

  // ✅ CORREÇÃO: Memoizar função e remover toast automático
  const loadExistingOrder = useCallback(async (clientId: string, showToast: boolean = false) => {
    try {
      console.log('📋 useOrderManagement.loadExistingOrder() - Loading existing order for client:', clientId);
      
      const db = getDatabaseAdapter();
      const allOrders = await db.getAllOrders();
      
      // Buscar pedido do cliente que não esteja cancelado ou com erro
      const existingOrder = allOrders.find(order => 
        order.customer_id === clientId && 
        order.sales_rep_id === salesRep?.id &&
        order.sync_status !== 'error' &&
        (order.status === 'pending' || order.status === 'processed')
      );

      if (existingOrder && existingOrder.items) {
        console.log('✅ Existing order found:', existingOrder.id, 'with', existingOrder.items.length, 'items');
        
        // Converter items do banco para o formato esperado
        const formattedItems = existingOrder.items.map((item: any, index: number) => ({
          id: index + 1,
          productId: item.productId || item.product_id || '',
          productName: item.productName || item.product_name || 'Produto',
          quantity: item.quantity || 0,
          price: item.price || 0,
          code: item.code || item.product_code || '',
          unit: item.unit || 'UN'
        }));

        setOrderItems(formattedItems);
        setEditingOrderId(existingOrder.id);
        
        // ✅ CORREÇÃO: Toast opcional e controlado externamente
        if (showToast) {
          toast.success(`Pedido existente carregado com ${formattedItems.length} item(s)`);
        }
        return { success: true, itemsCount: formattedItems.length };
      } else {
        console.log('❌ No existing order found for client:', clientId);
        return { success: false, itemsCount: 0 };
      }
    } catch (error) {
      console.error('❌ Error loading existing order:', error);
      if (showToast) {
        toast.error('Erro ao carregar pedido existente');
      }
      return { success: false, itemsCount: 0, error: error };
    }
  }, [salesRep?.id]);

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
        savedAt: new Date().toISOString(),
        editingOrderId // Incluir se estamos editando
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

      if (editingOrderId) {
        // ✅ ATUALIZAR PEDIDO EXISTENTE
        console.log('📝 Updating existing order:', editingOrderId);
        
        const orderData = {
          id: editingOrderId,
          customer_id: selectedClient.id,
          customer_name: selectedClient.name,
          total: parseFloat(calculateTotal()),
          date: new Date().toISOString(),
          status: 'pending' as const,
          sync_status: 'pending_sync' as const,
          items: orderItems,
          sales_rep_id: salesRep?.id,
          payment_table_id: paymentTableId,
          payment_method: selectedPaymentTable.name
        };

        await db.updateOrder(editingOrderId, orderData);
        toast.success('Pedido atualizado com sucesso!');
      } else {
        // ✅ CRIAR NOVO PEDIDO
        console.log('✨ Creating new order');
        
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
          payment_table_id: paymentTableId,
          payment_method: selectedPaymentTable.name
        };

        await db.saveOrder(orderData);
        toast.success('Pedido criado com sucesso!');
      }
      
      // Limpar rascunho se existir
      const draftKey = `draft_order_${selectedClient.id}`;
      localStorage.removeItem(draftKey);
      
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
      toast.error('Erro ao criar/atualizar pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    orderItems,
    isSubmitting,
    editingOrderId,
    addOrderItem,
    removeOrderItem,
    clearCart,
    calculateTotal,
    saveAsDraft,
    finishOrder,
    loadExistingOrder,
    setOrderItems
  };
};
