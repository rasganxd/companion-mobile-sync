
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

  const finishOrder = async (selectedClient: Client | null) => {
    if (!selectedClient || orderItems.length === 0) {
      toast.error('Selecione um cliente e adicione produtos');
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

  const viewOrder = () => {
    if (orderItems.length === 0) {
      toast.warning('Adicione produtos ao pedido');
      return;
    }
    
    toast.success('Pedido salvo como rascunho');
  };

  return {
    orderItems,
    isSubmitting,
    addOrderItem,
    removeOrderItem,
    clearCart,
    calculateTotal,
    finishOrder,
    viewOrder
  };
};
