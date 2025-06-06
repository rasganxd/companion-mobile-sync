
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
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

    if (!confirm(`Preparar ${pendingOrders.length} pedido(s) para transmissão ao desktop?`)) {
      return;
    }

    try {
      validateSalesRep();
      setTransmissionError(null);
    } catch (error) {
      return;
    }

    setIsTransmitting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const db = getDatabaseAdapter();

      for (const order of pendingOrders) {
        try {
          console.log('📦 Preparing order for transmission:', order.id);

          // Marcar como pronto para transmissão
          await db.markOrderAsTransmitted(order.id);
          
          // Log da preparação
          logOrderAction({
            action: 'ORDER_PREPARED_FOR_TRANSMISSION',
            orderId: order.id,
            salesRepId: salesRep?.id,
            salesRepName: salesRep?.name,
            customerName: order.customer_name,
            syncStatus: 'transmitted',
            details: { total: order.total, itemsCount: order.items?.length || 0 }
          });
          
          successCount++;
          console.log('✅ Order prepared for transmission:', order.id);
          
        } catch (error) {
          console.error('❌ Error preparing order:', order.id, error);
          const lastError = error instanceof Error ? error.message : 'Erro desconhecido';
          await db.updateSyncStatus('orders', order.id, 'error');
          
          logOrderAction({
            action: 'ORDER_PREPARATION_FAILED',
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
        toast.success(`${successCount} pedido(s) preparado(s) para transmissão ao desktop!`);
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} pedido(s) falharam na preparação`);
      }

      await loadOrders();

    } catch (error) {
      console.error('Error in transmission preparation process:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro no processo de preparação';
      setTransmissionError(errorMsg);
      toast.error('Erro no processo de preparação para transmissão');
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
    const orderToDelete = transmittedOrders.find(order => order.id === orderId);
    
    if (!confirm('Tem certeza que deseja excluir este pedido transmitido permanentemente? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const db = getDatabaseAdapter();
      await db.deleteOrder(orderId);
      
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
