
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { LocalOrder } from '@/types/order';
import { logOrderAction } from '@/utils/orderAuditLogger';
import { useAuth } from '@/contexts/AuthContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { supabaseService } from '@/services/SupabaseService';
import { ensureArray, validateOrderData, logAndroidDebug } from '@/utils/androidDataValidator';

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
      
      console.log('🔄 [ANDROID] Loading orders for transmission page...');
      
      // ✅ CORREÇÃO CRÍTICA: Garantir arrays válidos sempre
      const pendingResult = await db.getPendingOrders();
      const pending = ensureArray(pendingResult);
      
      logAndroidDebug('loadOrders pending', pending);
      
      console.log(`📋 [ANDROID] Loaded ${pending.length} pending orders`);
      setPendingOrders(pending);
      
      const transmittedResult = await db.getTransmittedOrders();
      const transmitted = ensureArray(transmittedResult);
      
      logAndroidDebug('loadOrders transmitted', transmitted);
      
      console.log(`📤 [ANDROID] Loaded ${transmitted.length} transmitted orders`);
      setTransmittedOrders(transmitted);
      
      const allOrdersResult = await db.getAllOrders();
      const allOrders = ensureArray(allOrdersResult);
      
      logAndroidDebug('loadOrders allOrders', allOrders);
      
      // ✅ CORREÇÃO: Filtrar pedidos com erro de forma segura
      const errorOrdersList = allOrders.filter(order => order && order.sync_status === 'error');
      console.log(`❌ [ANDROID] Loaded ${errorOrdersList.length} error orders`);
      setErrorOrders(errorOrdersList);
      
    } catch (error) {
      console.error('❌ [ANDROID] Error loading orders:', error);
      toast.error('Erro ao carregar pedidos');
      
      // ✅ CORREÇÃO: Definir arrays vazios em caso de erro
      setPendingOrders([]);
      setTransmittedOrders([]);
      setErrorOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const validateOrderData = (order: LocalOrder): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // ✅ CORREÇÃO: Verificar se o pedido existe antes de validar
    if (!order) {
      errors.push('Pedido inválido ou corrompido');
      return { isValid: false, errors };
    }
    
    // Validar campos obrigatórios
    if (!order.customer_id) {
      errors.push('ID do cliente ausente');
    }
    
    if (!order.customer_name) {
      errors.push('Nome do cliente ausente');
    }
    
    // ✅ CORREÇÃO: Permitir pedidos cancelados (negação) com total zero
    if (order.status === 'cancelled') {
      // Para pedidos cancelados, validar se há motivo de negação
      if (!order.reason) {
        errors.push('Motivo da negação ausente para pedido cancelado');
      }
      // Pedidos cancelados podem ter total 0 e sem itens - isso é válido
      console.log('🔍 [ANDROID] Validating cancelled order (negativation):', {
        orderId: order.id,
        reason: order.reason,
        total: order.total,
        itemsCount: Array.isArray(order.items) ? order.items.length : 0
      });
    } else {
      // Para pedidos normais, aplicar validações tradicionais
      if (!order.total || order.total <= 0) {
        errors.push('Total do pedido inválido');
      }
      
      // ✅ CORREÇÃO: Validar items de forma segura
      const orderItems = ensureArray(order.items);
      if (orderItems.length === 0) {
        errors.push('Pedido sem itens');
      }
      
      // Validar itens do pedido apenas para pedidos não cancelados
      if (orderItems.length > 0) {
        orderItems.forEach((item: any, index: number) => {
          if (!item) {
            errors.push(`Item ${index + 1}: Item inválido`);
            return;
          }
          
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
    }
    
    console.log('🔍 [ANDROID] Order validation result:', {
      orderId: order.id,
      status: order.status,
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : 'none'
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const normalizeOrderData = (order: LocalOrder): any => {
    console.log('🔧 [ANDROID] Normalizing order data:', order);
    
    // ✅ CORREÇÃO: Garantir que items seja array antes de normalizar
    const orderItems = ensureArray(order.items);
    
    // Normalizar itens do pedido
    const normalizedItems = orderItems.map((item: any) => {
      if (!item) {
        console.warn('🔧 [ANDROID] Skipping invalid item:', item);
        return null;
      }
      
      const normalizedItem = {
        product_id: item.productId || item.product_id,
        product_name: item.productName || item.product_name,
        product_code: item.code || item.product_code,
        quantity: item.quantity,
        price: item.price || item.unit_price,
        unit_price: item.price || item.unit_price,
        unit: item.unit,
        total: (item.price || item.unit_price || 0) * item.quantity
      };
      
      console.log('🔧 [ANDROID] Normalized item:', {
        ...normalizedItem,
        originalUnit: item.unit,
        preservedUnit: normalizedItem.unit
      });
      
      return normalizedItem;
    }).filter(item => item !== null); // Remover itens inválidos
    
    const normalizedOrder = {
      ...order,
      items: normalizedItems,
      payment_table_id: order.payment_table_id
    };
    
    console.log('✅ [ANDROID] Normalized order with preserved units and payment table:', {
      orderId: normalizedOrder.id,
      customerName: normalizedOrder.customer_name,
      status: normalizedOrder.status,
      total: normalizedOrder.total,
      reason: normalizedOrder.reason,
      paymentTableId: normalizedOrder.payment_table_id,
      itemsWithUnits: normalizedItems.map(item => ({
        name: item.product_name,
        unit: item.unit,
        quantity: item.quantity
      }))
    });
    
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
    // ✅ CORREÇÃO: Verificar se pendingOrders é array válido
    const validPendingOrders = ensureArray(pendingOrders);
    
    if (validPendingOrders.length === 0) {
      toast.warning('Não há pedidos pendentes para transmitir');
      return;
    }

    if (!connected || !isOnline) {
      toast.error('Sem conexão com a internet. Conecte-se para transmitir pedidos.');
      return;
    }

    try {
      validateSalesRep();
      setTransmissionError(null);
    } catch (error) {
      console.error('❌ [ANDROID] Sales rep validation failed:', error);
      return;
    }

    setIsTransmitting(true);

    try {
      const db = getDatabaseAdapter();

      console.log('📤 [ANDROID] Starting transmission to Supabase...');
      console.log('🔐 Using session token:', salesRep.sessionToken?.substring(0, 20) + '...');
      
      // Validar e normalizar dados dos pedidos antes da transmissão
      const validatedOrders: LocalOrder[] = [];
      const invalidOrders: { order: LocalOrder; errors: string[] }[] = [];
      
      for (const order of validPendingOrders) {
        const validation = validateOrderData(order);
        
        if (validation.isValid) {
          const normalizedOrder = normalizeOrderData(order);
          validatedOrders.push(normalizedOrder);
        } else {
          console.error(`❌ [ANDROID] Invalid order data for ${order.id}:`, validation.errors);
          invalidOrders.push({ order, errors: validation.errors });
          
          // Marcar pedidos inválidos como erro
          await db.updateSyncStatus('orders', order.id, 'error');
        }
      }
      
      if (invalidOrders.length > 0) {
        const errorMsg = `${invalidOrders.length} pedido(s) com dados inválidos foram marcados como erro`;
        console.error('❌ [ANDROID] Invalid orders:', invalidOrders);
        toast.error(errorMsg);
      }
      
      if (validatedOrders.length === 0) {
        throw new Error('Nenhum pedido válido para transmitir');
      }
      
      // Transmit orders to Supabase (agora com dados validados e normalizados incluindo payment_table_id)
      const transmissionResult = await supabaseService.transmitOrders(
        validatedOrders, 
        salesRep.sessionToken!
      );

      console.log('📊 [ANDROID] Transmission result:', transmissionResult);

      if (transmissionResult.success && transmissionResult.successCount > 0) {
        console.log(`✅ [ANDROID] ${transmissionResult.successCount} orders transmitted successfully`);
        
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
              details: { 
                total: order.total, 
                itemsCount: Array.isArray(order.items) ? order.items.length : 0,
                paymentTableId: order.payment_table_id,
                status: order.status,
                reason: order.reason
              }
            });
            
            console.log('✅ [ANDROID] Order marked as transmitted:', order.id);
            
          } catch (error) {
            console.error('❌ [ANDROID] Error marking order as transmitted:', order.id, error);
            await db.updateSyncStatus('orders', order.id, 'error');
          }
        }

        toast.success(`${transmissionResult.successCount} pedido(s) transmitido(s) com sucesso!`);
      }
      
      if (transmissionResult.errorCount > 0) {
        console.error('❌ [ANDROID] Some orders failed transmission:', transmissionResult.errors);
        
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
      console.error('❌ [ANDROID] Error in transmission process:', error);
      
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
      const validPendingOrders = ensureArray(pendingOrders);
      for (const order of validPendingOrders) {
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
    const validErrorOrders = ensureArray(errorOrders);
    
    if (validErrorOrders.length === 0) {
      toast.warning('Não há pedidos com erro para tentar novamente');
      return;
    }

    try {
      const db = getDatabaseAdapter();
      
      for (const order of validErrorOrders) {
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
      
      toast.success(`${validErrorOrders.length} pedido(s) recolocados na fila de transmissão`);
      await loadOrders();
    } catch (error) {
      console.error('❌ [ANDROID] Error retrying error orders:', error);
      toast.error('Erro ao tentar novamente');
    }
  };

  const deleteTransmittedOrder = async (orderId: string) => {
    const validTransmittedOrders = ensureArray(transmittedOrders);
    const orderToDelete = validTransmittedOrders.find(order => order && order.id === orderId);
    
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
      console.error('❌ [ANDROID] Error deleting order:', error);
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
