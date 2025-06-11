
import type { MobileOrder, AuthenticatedUser, SalesRep } from './types.ts';

export const getSalesRep = async (user: AuthenticatedUser, supabase: any): Promise<SalesRep> => {
  let salesRep;
  
  // Se o usuário tem dados de vendedor (mobile token), usar esses dados
  if (user.sales_rep_data) {
    salesRep = user.sales_rep_data;
  } else {
    // Buscar informações do vendedor baseado no user autenticado (JWT)
    const { data: foundSalesRep, error: salesRepError } = await supabase
      .from('sales_reps')
      .select('id, code, name, email')
      .eq('auth_user_id', user.id)
      .eq('active', true)
      .single();

    if (salesRepError || !foundSalesRep) {
      console.error('❌ Sales rep not found for user:', user.id, salesRepError);
      throw new Error('Sales representative not found for authenticated user');
    }
    
    salesRep = foundSalesRep;
  }

  console.log('✅ Sales rep found:', { id: salesRep.id, name: salesRep.name });
  return salesRep;
};

export const validateCustomer = async (customerId: string, salesRepId: string, supabase: any) => {
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id, name, company_name, sales_rep_id')
    .eq('id', customerId)
    .eq('sales_rep_id', salesRepId)
    .eq('active', true)
    .single();

  if (customerError || !customer) {
    console.error('❌ Customer validation failed:', customerError);
    throw new Error('Customer not found or does not belong to the authenticated sales representative');
  }

  console.log('✅ Customer validated:', { id: customer.id, name: customer.name });
  return customer;
};

export const createOrder = async (orderData: MobileOrder, salesRep: SalesRep, customer: any, supabase: any) => {
  // Gerar código do pedido
  const { data: codeData, error: codeError } = await supabase.rpc('get_next_order_code');
  if (codeError) {
    console.error('❌ Error generating order code:', codeError);
    throw new Error('Failed to generate order code');
  }

  console.log('🔢 Generated order code:', codeData);

  // Log para verificar se payment_table_id está sendo recebido
  console.log('💳 Payment table ID received:', orderData.payment_table_id);

  // Preparar dados do pedido para inserção na tabela mobile_orders
  const orderToInsert = {
    customer_id: orderData.customer_id,
    customer_name: orderData.customer_name || customer.company_name || customer.name,
    customer_code: customer.code || null,
    sales_rep_id: salesRep.id,
    sales_rep_name: salesRep.name,
    date: orderData.date,
    status: orderData.status,
    total: orderData.total,
    notes: orderData.notes || '',
    payment_method: orderData.payment_method || '',
    payment_table_id: orderData.payment_table_id || null,
    code: codeData,
    mobile_order_id: `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sync_status: 'pending',
    rejection_reason: orderData.reason,
    imported_to_orders: false,
    imported_at: null,
    imported_by: null,
    visit_notes: orderData.notes || ''
  };

  console.log('💳 Mobile order data to insert:', {
    payment_method: orderToInsert.payment_method,
    payment_table_id: orderToInsert.payment_table_id,
    total: orderToInsert.total,
    status: orderToInsert.status,
    table: 'mobile_orders'
  });

  // Inserir pedido na tabela mobile_orders
  const { data: createdOrder, error: orderError } = await supabase
    .from('mobile_orders')
    .insert(orderToInsert)
    .select()
    .single();

  if (orderError) {
    console.error('❌ Error creating mobile order:', orderError);
    throw new Error(`Failed to create mobile order: ${orderError.message}`);
  }

  console.log('✅ Mobile order created successfully:', createdOrder.id);
  console.log('💳 Payment table ID saved in mobile_orders:', createdOrder.payment_table_id);
  return createdOrder;
};

export const createOrderItems = async (orderData: MobileOrder, orderId: string, supabase: any) => {
  // Inserir itens do pedido (apenas se não for cancelado)
  if (orderData.items && orderData.items.length > 0) {
    console.log('📋 Creating mobile order items...');
    
    const itemsToInsert = orderData.items.map(item => ({
      mobile_order_id: orderId,
      product_name: item.product_name,
      product_code: item.product_code,
      quantity: item.quantity,
      price: item.price,
      unit_price: item.price,
      total: item.total,
      unit: item.unit || 'UN'
    }));

    console.log(`🔍 Inserting ${itemsToInsert.length} items into mobile_order_items with units:`, 
      itemsToInsert.map(item => ({ name: item.product_name, unit: item.unit }))
    );

    const { error: itemsError } = await supabase
      .from('mobile_order_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('❌ Error creating mobile order items:', itemsError);
      // Tentar deletar o pedido criado se os itens falharam
      await supabase.from('mobile_orders').delete().eq('id', orderId);
      throw new Error(`Failed to create mobile order items: ${itemsError.message}`);
    }

    console.log('✅ Mobile order items created successfully with preserved units');
  } else if (orderData.status === 'cancelled') {
    console.log('ℹ️ No items to create for cancelled mobile order (negation)');
  }
};
