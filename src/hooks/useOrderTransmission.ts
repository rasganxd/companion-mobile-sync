import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import ApiService from '@/services/ApiService';
import { LocalOrder } from '@/types/order';
import { logOrderAction } from '@/utils/orderAuditLogger';
import { useAuth } from '@/hooks/useAuth';

export const useOrderTransmission = () => {
  const { salesRep } = useAuth();
  const [pendingOrders, setPendingOrders] = useState<LocalOrder[]>([]);
  const [transmittedOrders, setTransmittedOrders] = useState<LocalOrder[]>([]);
  const [errorOrders, setErrorOrders] = useState<LocalOrder[]>([]);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [transmissionError, setTransmissionError] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const db = getDatabaseAdapter();
      
      console.log('🔄 Loading orders for transmission page...');
      
      // Carregar pedidos pendentes
      const pending = await db.getPendingOrders();
      console.log(`📋 Loaded ${pending.length} pending orders`);
      setPendingOrders(pending);
      
      // Carregar pedidos transmitidos
      const transmitted = await db.getTransmittedOrders();
      console.log(`📤 Loaded ${transmitted.length} transmitted orders`);
      setTransmittedOrders(transmitted);
      
      // Carregar pedidos com erro
      const allOrders = await db.getAllOrders();
      const errorOrdersList = allOrders.filter(order => order.sync_status === 'error');
      console.log(`❌ Loaded ${errorOrdersList.length} error orders`);
      setErrorOrders(errorOrdersList);
      
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  const validateSalesRep = () => {
    if (!salesRep || !salesRep.id) {
      const errorMsg = 'Vendedor não identificado. Faça login novamente.';
      setTransmissionError(errorMsg);
      throw new Error(errorMsg);
    }
    return true;
  };

  const transmitAllOrders = async () => {
    if (pendingOrders.length === 0) {
      toast.warning('Não há pedidos pendentes para transmitir');
      return;
    }

    if (!confirm(`Transmitir ${pendingOrders.length} pedido(s)?`)) {
      return;
    }

    try {
      validateSalesRep();
      setTransmissionError(null);
    } catch (error) {
      return; // Erro já foi definido no estado
    }

    setIsTransmitting(true);
    let successCount = 0;
    let errorCount = 0;
    let lastError = '';

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
          
          // Log da transmissão
          logOrderAction({
            action: 'ORDER_TRANSMITTED',
            orderId: order.id,
            salesRepId: salesRep?.id,
            salesRepName: salesRep?.name,
            customerName: order.customer_name,
            syncStatus: 'transmitted',
            details: { total: order.total, itemsCount: order.items?.length || 0 }
          });
          
          successCount++;
          console.log('✅ Order transmitted successfully:', order.id);
          
        } catch (error) {
          console.error('❌ Error transmitting order:', order.id, error);
          lastError = error instanceof Error ? error.message : 'Erro desconhecido';
          await db.updateSyncStatus('orders', order.id, 'error');
          
          // Log do erro
          logOrderAction({
            action: 'ORDER_TRANSMISSION_FAILED',
            orderId: order.id,
            salesRepId: salesRep?.id,
            salesRepName: salesRep?.name,
            customerName: order.customer_name,
            syncStatus: 'error',
            details: { error: lastError }
          });
          
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} pedido(s) transmitido(s) com sucesso!`);
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} pedido(s) falharam na transmissão`);
        setTransmissionError(lastError);
      }

      await loadOrders();

    } catch (error) {
      console.error('Error in transmission process:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro no processo de transmissão';
      setTransmissionError(errorMsg);
      toast.error('Erro no processo de transmissão');
    } finally {
      setIsTransmitting(false);
    }
  };

  const retryTransmission = async () => {
    setTransmissionError(null);
    await transmitAllOrders();
  };

  const retryOrder = async (orderId: string) => {
    try {
      const db = getDatabaseAdapter();
      await db.updateSyncStatus('orders', orderId, 'pending_sync');
      
      // Log da tentativa
      logOrderAction({
        action: 'ORDER_RETRY_QUEUED',
        orderId,
        salesRepId: salesRep?.id,
        salesRepName: salesRep?.name,
        syncStatus: 'pending_sync'
      });
      
      toast.success('Pedido recolocado na fila de transmissão');
      await loadOrders();
    } catch (error) {
      console.error('Error retrying order:', error);
      toast.error('Erro ao tentar novamente');
    }
  };

  const retryAllErrorOrders = async () => {
    if (errorOrders.length === 0) {
      toast.warning('Não há pedidos com erro para tentar novamente');
      return;
    }

    if (!confirm(`Tentar transmitir novamente ${errorOrders.length} pedido(s) com erro?`)) {
      return;
    }

    try {
      const db = getDatabaseAdapter();
      
      for (const order of errorOrders) {
        await db.updateSyncStatus('orders', order.id, 'pending_sync');
        
        // Log da tentativa
        logOrderAction({
          action: 'ORDER_RETRY_QUEUED',
          orderId: order.id,
          salesRepId: salesRep?.id,
          salesRepName: salesRep?.name,
          customerName: order.customer_name,
          syncStatus: 'pending_sync'
        });
      }
      
      toast.success(`${errorOrders.length} pedido(s) recolocados na fila de transmissão`);
      await loadOrders();
    } catch (error) {
      console.error('Error retrying error orders:', error);
      toast.error('Erro ao tentar novamente');
    }
  };

  const deleteTransmittedOrder = async (orderId: string) => {
    // Buscar dados do pedido antes de deletar para log
    const orderToDelete = transmittedOrders.find(order => order.id === orderId);
    
    if (!confirm('Tem certeza que deseja excluir este pedido transmitido permanentemente? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const db = getDatabaseAdapter();
      await db.deleteOrder(orderId);
      
      // Log da exclusão
      logOrderAction({
        action: 'ORDER_DELETED_TRANSMITTED',
        orderId,
        salesRepId: salesRep?.id,
        salesRepName: salesRep?.name,
        customerName: orderToDelete?.customer_name,
        syncStatus: 'transmitted',
        details: { 
          total: orderToDelete?.total,
          deletedBy: 'transmission_page'
        }
      });
      
      toast.success('Pedido transmitido excluído com sucesso');
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
    clearTransmissionError: () => setTransmissionError(null)
  };
};
