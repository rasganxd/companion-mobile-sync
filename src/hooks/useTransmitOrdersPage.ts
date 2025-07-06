import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { supabaseService } from '@/services/SupabaseService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAuth } from '@/contexts/AuthContext';
import { validateOrderData } from '@/utils/androidDataValidator';
import { LocalOrder } from '@/types/order';

export const useTransmitOrdersPage = () => {
  const [pendingOrders, setPendingOrders] = useState<LocalOrder[]>([]);
  const [transmittedOrders, setTransmittedOrders] = useState<LocalOrder[]>([]);
  const [errorOrders, setErrorOrders] = useState<LocalOrder[]>([]);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transmissionError, setTransmissionError] = useState<string | null>(null);

  const { connected } = useNetworkStatus();
  const { salesRep } = useAuth();

  const loadOrders = useCallback(async () => {
    if (!salesRep?.id) return;

    setIsLoading(true);
    try {
      const db = getDatabaseAdapter();
      const allOrders = await db.getAllOrders();
      
      const salesRepOrders = allOrders.filter(order => order.sales_rep_id === salesRep.id);
      
      setPendingOrders(salesRepOrders.filter(order => order.sync_status === 'pending_sync'));
      setTransmittedOrders(salesRepOrders.filter(order => order.sync_status === 'transmitted'));
      setErrorOrders(salesRepOrders.filter(order => order.sync_status === 'error'));
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setIsLoading(false);
    }
  }, [salesRep]);

  const transmitAllOrders = useCallback(async () => {
    if (!connected) {
      toast.error('Sem conexão com a internet');
      return;
    }

    if (!salesRep?.sessionToken) {
      toast.error('Token de sessão não encontrado. Faça login novamente.');
      return;
    }

    if (pendingOrders.length === 0) {
      toast.info('Nenhum pedido pendente para transmissão');
      return;
    }

    setIsTransmitting(true);
    toast.info(`Iniciando transmissão de ${pendingOrders.length} pedidos...`);

    try {
      const db = getDatabaseAdapter();
      let successCount = 0;
      let errorCount = 0;

      for (const order of pendingOrders) {
        try {
          const validatedOrder = validateOrderData(order);
          if (!validatedOrder) {
            await db.updateOrderStatus(order.id, 'error');
            errorCount++;
            continue;
          }

          const result = await supabaseService.transmitOrder(validatedOrder, salesRep.sessionToken);
          
          if (result.success) {
            await db.updateOrderStatus(order.id, 'transmitted');
            successCount++;
          } else {
            await db.updateOrderStatus(order.id, 'error');
            errorCount++;
          }
        } catch (error) {
          await db.updateOrderStatus(order.id, 'error');
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} pedidos transmitidos com sucesso!`);
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} pedidos falharam na transmissão`);
      }

      await loadOrders();
    } catch (error) {
      console.error('Error in batch transmission:', error);
      toast.error('Erro na transmissão em lote');
    } finally {
      setIsTransmitting(false);
    }
  }, [connected, pendingOrders, loadOrders, salesRep?.sessionToken]);

  const retryOrder = useCallback(async (orderId: string) => {
    if (!connected) {
      toast.error('Sem conexão com a internet');
      return;
    }

    if (!salesRep?.sessionToken) {
      toast.error('Token de sessão não encontrado. Faça login novamente.');
      return;
    }

    const order = errorOrders.find(o => o.id === orderId);
    if (!order) return;

    setIsTransmitting(true);
    try {
      const db = getDatabaseAdapter();
      const validatedOrder = validateOrderData(order);
      
      if (!validatedOrder) {
        toast.error('Dados do pedido inválidos');
        return;
      }

      const result = await supabaseService.transmitOrder(validatedOrder, salesRep.sessionToken);
      
      if (result.success) {
        await db.updateOrderStatus(orderId, 'transmitted');
        toast.success('Pedido transmitido com sucesso!');
        await loadOrders();
      } else {
        toast.error(`Erro ao transmitir: ${result.error}`);
      }
    } catch (error) {
      console.error('Error retrying order:', error);
      toast.error('Erro ao reenviar pedido');
    } finally {
      setIsTransmitting(false);
    }
  }, [connected, errorOrders, loadOrders, salesRep?.sessionToken]);

  const retryAllErrorOrders = useCallback(async () => {
    if (!connected) {
      toast.error('Sem conexão com a internet');
      return;
    }

    if (!salesRep?.sessionToken) {
      toast.error('Token de sessão não encontrado. Faça login novamente.');
      return;
    }

    if (errorOrders.length === 0) {
      toast.info('Nenhum pedido com erro para reenviar');
      return;
    }

    setIsTransmitting(true);
    toast.info(`Reenviando ${errorOrders.length} pedidos com erro...`);

    try {
      const db = getDatabaseAdapter();
      let successCount = 0;
      let errorCount = 0;

      for (const order of errorOrders) {
        try {
          const validatedOrder = validateOrderData(order);
          if (!validatedOrder) {
            errorCount++;
            continue;
          }

          const result = await supabaseService.transmitOrder(validatedOrder, salesRep.sessionToken);
          
          if (result.success) {
            await db.updateOrderStatus(order.id, 'transmitted');
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} pedidos reenviados com sucesso!`);
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} pedidos ainda com erro`);
      }

      await loadOrders();
    } catch (error) {
      console.error('Error retrying all error orders:', error);
      toast.error('Erro ao reenviar pedidos');
    } finally {
      setIsTransmitting(false);
    }
  }, [connected, errorOrders, loadOrders, salesRep?.sessionToken]);

  const deleteTransmittedOrder = useCallback(async (orderId: string) => {
    try {
      const db = getDatabaseAdapter();
      await db.deleteOrder(orderId);
      toast.success('Pedido removido com sucesso');
      await loadOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Erro ao remover pedido');
    }
  }, [loadOrders]);

  const retryTransmission = useCallback(async () => {
    await transmitAllOrders();
  }, [transmitAllOrders]);

  const clearTransmissionError = useCallback(() => {
    setTransmissionError(null);
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return {
    pendingOrders,
    transmittedOrders,
    errorOrders,
    isTransmitting,
    isLoading,
    transmissionError,
    loadOrders,
    transmitAllOrders,
    retryOrder,
    retryAllErrorOrders,
    deleteTransmittedOrder,
    retryTransmission,
    clearTransmissionError
  };
};
