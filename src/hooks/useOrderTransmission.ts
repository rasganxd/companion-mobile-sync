
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { supabaseService } from '@/services/SupabaseService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAuth } from '@/contexts/AuthContext';
import { validateOrderData } from '@/utils/androidDataValidator';

interface Order {
  id: string;
  customer_id: string;
  customer_name: string;
  total: number;
  items: any[];
  status: string;
  sync_status: string;
  sales_rep_id: string;
  created_at: string;
  order_date: string;
  date: string;
}

interface TransmissionResult {
  success: boolean;
  transmitted?: number;
  failed?: number;
  errors?: { order: Order; error: string }[];
}

export const useOrderTransmission = () => {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const { connected } = useNetworkStatus();
  const { salesRep } = useAuth();

  const transmitOrders = useCallback(async (): Promise<TransmissionResult> => {
    if (!connected) {
      toast.error('Sem conexão com a internet. A transmissão será feita quando estiver online.');
      return { success: false, transmitted: 0, failed: 0, errors: [] };
    }

    if (!salesRep?.id) {
      toast.error('Vendedor não autenticado. Impossível transmitir pedidos.');
      return { success: false, transmitted: 0, failed: 0, errors: [] };
    }

    setIsTransmitting(true);
    toast.info('Iniciando transmissão de pedidos...');

    try {
      const db = getDatabaseAdapter();
      const ordersToTransmit: Order[] = await db.getOrdersToSync(salesRep.id);

      if (!ordersToTransmit || ordersToTransmit.length === 0) {
        toast.info('Nenhum pedido pendente para transmissão.');
        return { success: true, transmitted: 0, failed: 0, errors: [] };
      }

      let transmittedCount = 0;
      let failedCount = 0;
      const failedOrders: { order: Order; error: string }[] = [];

      for (const order of ordersToTransmit) {
        try {
          console.log(`Transmitting order ${order.id}:`, order.customer_name);
          
          const validatedOrder = validateOrderData(order);
          if (!validatedOrder) {
            console.error('Order validation failed:', order.id);
            failedOrders.push({
              order,
              error: 'Dados do pedido inválidos'
            });
            failedCount++;
            continue;
          }

          const transmissionResult = await supabaseService.transmitOrder(validatedOrder);

          if (transmissionResult.success) {
            console.log(`Order ${order.id} transmitted successfully.`);
            await db.updateOrderStatus(order.id, 'transmitted');
            transmittedCount++;
          } else {
            console.error(`Order ${order.id} transmission failed:`, transmissionResult.error);
            failedOrders.push({
              order,
              error: transmissionResult.error || 'Erro desconhecido na transmissão'
            });
            failedCount++;
          }
        } catch (error) {
          console.error('Error transmitting order:', error);
          failedOrders.push({
            order,
            error: error instanceof Error ? error.message : 'Erro na transmissão'
          });
          failedCount++;
        }
      }

      const totalOrders = ordersToTransmit.length;
      const success = failedOrders.length === 0;

      if (success) {
        toast.success(`Todos os ${totalOrders} pedidos foram transmitidos com sucesso!`);
      } else {
        toast.error(`${transmittedCount} pedidos transmitidos. ${failedCount} falharam.`);
        failedOrders.forEach(failedOrder => {
          toast.error(`Falha ao transmitir pedido para ${failedOrder.order.customer_name}: ${failedOrder.error}`);
        });
      }

      return {
        success,
        transmitted: transmittedCount,
        failed: failedCount,
        errors: failedOrders
      };

    } catch (error) {
      console.error('Erro geral na transmissão de pedidos:', error);
      toast.error('Erro ao transmitir pedidos. Verifique sua conexão e tente novamente.');
      return { success: false, transmitted: 0, failed: 0, errors: [] };
    } finally {
      setIsTransmitting(false);
    }
  }, [connected, salesRep]);

  return {
    isTransmitting,
    transmitOrders
  };
};
