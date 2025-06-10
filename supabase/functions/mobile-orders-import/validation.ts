
import type { MobileOrder } from './types.ts';

export const validateOrderData = (orderData: MobileOrder): void => {
  console.log('📦 Received order data:', { 
    customer_id: orderData.customer_id, 
    total: orderData.total, 
    status: orderData.status,
    test: orderData.test,
    reason: orderData.reason,
    itemsCount: orderData.items?.length || 0
  });

  // Se for um teste de conexão, não validar
  if (orderData.test) {
    return;
  }

  // Validar dados obrigatórios básicos
  if (!orderData.customer_id || !orderData.date) {
    throw new Error('Missing required order fields: customer_id, date');
  }

  // Validação específica baseada no status do pedido
  if (orderData.status === 'cancelled') {
    // Para pedidos cancelados (negações), validar apenas campos específicos
    console.log('🔍 Validating cancelled order (negation):', {
      customer_id: orderData.customer_id,
      date: orderData.date,
      reason: orderData.reason,
      total: orderData.total
    });
    
    if (!orderData.reason) {
      throw new Error('Missing required field for cancelled order: reason');
    }
    
    console.log('✅ Cancelled order validation passed');
  } else {
    // Para pedidos normais, aplicar validação tradicional
    if (!orderData.total || orderData.total <= 0) {
      throw new Error('Missing required order fields: total must be greater than 0');
    }
    
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('Missing required order fields: items');
    }
    
    console.log('✅ Normal order validation passed');
  }
};
