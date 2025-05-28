
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import ApiService from '@/services/ApiService';
import { LocalOrder } from '@/types/order';

export const useOrderTransmission = () => {
  const [pendingOrders, setPendingOrders] = useState<LocalOrder[]>([]);
  const [transmittedOrders, setTransmittedOrders] = useState<LocalOrder[]>([]);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const db = getDatabaseAdapter();
      
      console.log('🔄 Loading orders for transmission page...');
      
      // Carregar pedidos pendentes
      const pending = await db.getPendingOrders();
      console.log(`📋 Loaded ${pending.length} pending orders:`, pending.map(o => ({
        id: o.id,
        customer_name: o.customer_name,
        sync_status: o.sync_status,
        total: o.total
      })));
      setPendingOrders(pending);
      
      // Carregar pedidos transmitidos
      const transmitted = await db.getTransmittedOrders();
      console.log(`📤 Loaded ${transmitted.length} transmitted orders`);
      setTransmittedOrders(transmitted);
      
      // Carregar todos os pedidos para debug
      const allOrders = await db.getAllOrders();
      console.log(`📊 Total orders in database: ${allOrders.length}`);
      console.log(`📊 Orders breakdown by sync_status:`, {
        pending_sync: allOrders.filter(o => o.sync_status === 'pending_sync').length,
        transmitted: allOrders.filter(o => o.sync_status === 'transmitted').length,
        synced: allOrders.filter(o => o.sync_status === 'synced').length,
        error: allOrders.filter(o => o.sync_status === 'error').length,
        other: allOrders.filter(o => !['pending_sync', 'transmitted', 'synced', 'error'].includes(o.sync_status)).length
      });
      
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  const transmitAllOrders = async () => {
    if (pendingOrders.length === 0) {
      toast.warning('Não há pedidos pendentes para transmitir');
      return;
    }

    if (!confirm(`Transmitir ${pendingOrders.length} pedido(s)?`)) {
      return;
    }

    setIsTransmitting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const apiService = ApiService.getInstance();
      const db = getDatabaseAdapter();

      for (const order of pendingOrders) {
        try {
          console.log('🚀 Transmitting order:', order.id);

          const orderData = {
            customer_id: order.customer_id,
            customer_name: order.customer_name,
            date: order.date,
            status: order.status as 'pending' | 'processed' | 'cancelled' | 'delivered',
            total: order.total,
            notes: order.notes || '',
            payment_method: order.payment_method || '',
            source_project: 'mobile'
          };

          await apiService.createOrderWithItems(orderData, order.items || []);
          await db.markOrderAsTransmitted(order.id);
          
          successCount++;
          console.log('✅ Order transmitted successfully:', order.id);
          
        } catch (error) {
          console.error('❌ Error transmitting order:', order.id, error);
          await db.updateSyncStatus('orders', order.id, 'error');
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} pedido(s) transmitido(s) com sucesso!`);
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} pedido(s) falharam na transmissão`);
      }

      await loadOrders();

    } catch (error) {
      console.error('Error in transmission process:', error);
      toast.error('Erro no processo de transmissão');
    } finally {
      setIsTransmitting(false);
    }
  };

  const deleteTransmittedOrder = async (orderId: string) => {
    if (!confirm('Tem certeza que deseja excluir este pedido permanentemente?')) {
      return;
    }

    try {
      const db = getDatabaseAdapter();
      await db.deleteOrder(orderId);
      toast.success('Pedido excluído com sucesso');
      await loadOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Erro ao excluir pedido');
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return {
    pendingOrders,
    transmittedOrders,
    isTransmitting,
    isLoading,
    loadOrders,
    transmitAllOrders,
    deleteTransmittedOrder
  };
};
