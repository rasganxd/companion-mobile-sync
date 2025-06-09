
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { LocalOrder } from '@/types/order';
import { logOrderAction } from '@/utils/orderAuditLogger';
import { useAuth } from '@/hooks/useAuth';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { supabaseService } from '@/services/SupabaseService';

export const useOrderTransmission = () => {
  const { salesRep, isOnline } = useAuth();
  const { connected } = useNetworkStatus();
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
      
      const pending = await db.getPendingOrders();
      console.log(`📋 Loaded ${pending.length} pending orders`);
      setPendingOrders(pending);
      
      const transmitted = await db.getTransmittedOrders();
      console.log(`📤 Loaded ${transmitted.length} transmitted orders`);
      setTransmittedOrders(transmitted);
      
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

  const validateOrderData = (order: LocalOrder): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Validar campos obrigatórios
    if (!order.customer_id) {
      errors.push('ID do cliente ausente');
    }
    
    if (!order.customer_name) {
      errors.push('Nome do cliente ausente');
    }
    
    if (!order.total || order.total <= 0) {
      errors.push('Total do pedido inválido');
    }
    
    if (!order.items || order.items.length === 0) {
      errors.push('Pedido sem itens');
    }
    
    // Validar itens do pedido
    if (order.items) {
      order.items.forEach((item: any, index: number) => {
        if (!item.productId && !item.product_id) {
          errors.push(`Item ${index + 1}: ID do produto ausente`);
        }
        
        if (!item.productName && !item.product_name) {
          errors.push(`Item ${index + 1}: Nome do produto ausente`);
        }
        
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Item ${index + 1}: Quantidade inválida`);
        }
        
        if (!item.price && !item.unit_price) {
          errors.push(`Item ${index + 1}: Preço ausente`);
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const normalizeOrderData = (order: LocalOrder): any => {
    console.log('🔧 Normalizing order data:', order);
    
    // Normalizar itens do pedido
    const normalizedItems = order.items?.map((item: any) => {
      const normalizedItem = {
        product_id: item.productId || item.product_id,
        product_name: item.productName || item.product_name,
        product_code: item.code || item.product_code,
        quantity: item.quantity,
        price: item.price || item.unit_price,
        unit_price: item.price || item.unit_price,
        unit: item.unit || 'UN',
        total: (item.price || item.unit_price || 0) * item.quantity
      };
      
      console.log('🔧 Normalized item:', normalizedItem);
      return normalizedItem;
    }) || [];
    
    const normalizedOrder = {
      ...order,
      items: normalizedItems
    };
    
    console.log('✅ Normalized order:', normalizedOrder);
    return normalizedOrder;
  };

  const validateSalesRep = () => {
    if (!salesRep || !salesRep.id) {
      const errorMsg = 'Vendedor não identificado. Faça login novamente.';
      setTransmissionError(errorMsg);
      throw new Error(errorMsg);
    }
    
    if (!salesRep.sessionToken) {
      const errorMsg = 'Token de sessão expirado. Faça login novamente.';
      setTransmissionError(errorMsg);
      throw new Error(errorMsg);
    }
    
    // Verificar se o token não é muito antigo (para tokens mobile)
    if (salesRep.sessionToken.startsWith('mobile_')) {
      const tokenParts = salesRep.sessionToken.split('_');
      if (tokenParts.length >= 3) {
        const timestamp = parseInt(tokenParts[2]);
        const tokenAge = Date.now() - timestamp;
        const maxAge = 20 * 60 * 60 * 1000; // 20 horas (menos que o limite de 24h do servidor)
        
        if (tokenAge > maxAge) {
          const errorMsg = 'Sessão expirada. Faça login novamente.';
          setTransmissionError(errorMsg);
          throw new Error(errorMsg);
        }
      }
    }
    
    return true;
  };

  const transmitAllOrders = async () => {
    if (pendingOrders.length === 0) {
      toast.warning('Não há pedidos pendentes para transmitir');
      return;
    }

    if (!connected || !isOnline) {
      toast.error('Sem conexão com a internet. Conecte-se para transmitir pedidos.');
      return;
    }

    if (!confirm(`Transmitir ${pendingOrders.length} pedido(s) para o servidor?`)) {
      return;
    }

    try {
      validateSalesRep();
      setTransmissionError(null);
    } catch (error) {
      console.error('❌ Sales rep validation failed:', error);
      return;
    }

    setIsTransmitting(true);

    try {
      const db = getDatabaseAdapter();

      console.log('📤 Starting transmission to Supabase...');
      console.log('🔐 Using session token:', salesRep.sessionToken?.substring(0, 20) + '...');
      
      // Validar e normalizar dados dos pedidos antes da transmissão
      const validatedOrders: LocalOrder[] = [];
      const invalidOrders: { order: LocalOrder; errors: string[] }[] = [];
      
      for (const order of pendingOrders) {
        const validation = validateOrderData(order);
        
        if (validation.isValid) {
          const normalizedOrder = normalizeOrderData(order);
          validatedOrders.push(normalizedOrder);
        } else {
          console.error(`❌ Invalid order data for ${order.id}:`, validation.errors);
          invalidOrders.push({ order, errors: validation.errors });
          
          // Marcar pedidos inválidos como erro
          await db.updateSyncStatus('orders', order.id, 'error');
        }
      }
      
      if (invalidOrders.length > 0) {
        const errorMsg = `${invalidOrders.length} pedido(s) com dados inválidos foram marcados como erro`;
        console.error('❌ Invalid orders:', invalidOrders);
        toast.error(errorMsg);
      }
      
      if (validatedOrders.length === 0) {
        throw new Error('Nenhum pedido válido para transmitir');
      }
      
      // Transmit orders to Supabase (agora com dados validados e normalizados)
      const transmissionResult = await supabaseService.transmitOrders(
        validatedOrders, 
        salesRep.sessionToken!
      );

      console.log('📊 Transmission result:', transmissionResult);

      if (transmissionResult.success && transmissionResult.successCount > 0) {
        console.log(`✅ ${transmissionResult.successCount} orders transmitted successfully`);
        
        // Mark successfully transmitted orders
        for (const order of validatedOrders) {
          try {
            await db.markOrderAsTransmitted(order.id);
            
            logOrderAction({
              action: 'ORDER_TRANSMITTED_TO_SUPABASE',
              orderId: order.id,
              salesRepId: salesRep?.id,
              salesRepName: salesRep?.name,
              customerName: order.customer_name,
              syncStatus: 'transmitted',
              details: { total: order.total, itemsCount: order.items?.length || 0 }
            });
            
            console.log('✅ Order marked as transmitted:', order.id);
            
          } catch (error) {
            console.error('❌ Error marking order as transmitted:', order.id, error);
            await db.updateSyncStatus('orders', order.id, 'error');
          }
        }

        toast.success(`${transmissionResult.successCount} pedido(s) transmitido(s) com sucesso!`);
      }
      
      if (transmissionResult.errorCount > 0) {
        console.error('❌ Some orders failed transmission:', transmissionResult.errors);
        
        // Mark failed orders as error
        const db = getDatabaseAdapter();
        for (const order of validatedOrders) {
          await db.updateSyncStatus('orders', order.id, 'error');
        }
        
        toast.error(`${transmissionResult.errorCount} pedido(s) falharam na transmissão`);
        
        if (transmissionResult.errors) {
          setTransmissionError(transmissionResult.errors.join('\n'));
        }
      }

      if (transmissionResult.successCount === 0 && transmissionResult.errorCount > 0) {
        throw new Error(transmissionResult.errorMessage || 'Todos os pedidos falharam na transmissão');
      }

      await loadOrders();

    } catch (error) {
      console.error('❌ Error in transmission process:', error);
      
      let errorMsg = 'Erro no processo de transmissão';
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid authentication')) {
          errorMsg = 'Erro de autenticação. Faça login novamente.';
        } else if (error.message.includes('session token expired')) {
          errorMsg = 'Sessão expirada. Faça login novamente.';
        } else if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
          errorMsg = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else {
          errorMsg = error.message;
        }
      }
      
      setTransmissionError(errorMsg);
      toast.error('Erro na transmissão: ' + errorMsg);
      
      // Mark all orders as error if transmission failed completely
      const db = getDatabaseAdapter();
      for (const order of pendingOrders) {
        await db.updateSyncStatus('orders', order.id, 'error');
      }
      await loadOrders();
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
    canTransmit: connected && isOnline,
    loadOrders,
    transmitAllOrders,
    retryOrder,
    retryAllErrorOrders,
    deleteTransmittedOrder,
    retryTransmission,
    clearTransmissionError: () => setTransmissionError(null)
  };
};
