
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export const useOrderManagement = () => {
  const navigate = useNavigate();
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
      
      // Verificar preços mínimos de todos os produtos no pedido
      for (const item of orderItems) {
        const products = await db.getProducts();
        const product = products.find(p => p.id === item.productId);
        
        if (product && product.min_price && product.min_price > 0) {
          if (item.price < product.min_price) {
            toast.error(`❌ Produto "${item.productName}" está abaixo do preço mínimo (R$ ${product.min_price.toFixed(2)})`);
            return false;
          }
        }
      }
      
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

  const finishOrder = async (selectedClient: Client | null) => {
    if (!selectedClient) {
      toast.error('Selecione um cliente');
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
      
      const orderData = {
        id: uuidv4(),
        customer_id: selectedClient.id,
        customer_name: selectedClient.name,
        total: parseFloat(calculateTotal()),
        date: new Date().toISOString(),
        status: 'pending' as const,
        sync_status: 'pending_sync' as const,
        items: orderItems,
        sales_rep_id: salesRep?.id
      };

      await db.saveOrder(orderData);
      
      // Limpar rascunho se existir
      const draftKey = `draft_order_${selectedClient.id}`;
      localStorage.removeItem(draftKey);
      
      toast.success('Pedido criado com sucesso!');
      
      navigate('/my-orders', {
        state: { 
          clientId: selectedClient.id,
          clientName: selectedClient.name,
          newOrderCreated: true
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
