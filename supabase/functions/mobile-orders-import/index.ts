
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderItem {
  product_name: string;
  product_code?: number;
  quantity: number;
  price: number;
  total: number;
  description?: string;
}

interface MobileOrder {
  customer_id: string;
  customer_name?: string;
  date: string;
  status: 'pending' | 'processed' | 'cancelled' | 'delivered';
  total: number;
  notes?: string;
  payment_method?: string;
  items?: OrderItem[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('📱 Mobile Orders Import endpoint called');

    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      throw new Error('Invalid authentication');
    }

    console.log('✅ User authenticated:', user.id);

    // Buscar informações do vendedor baseado no user autenticado
    const { data: salesRep, error: salesRepError } = await supabase
      .from('sales_reps')
      .select('id, code, name, email')
      .eq('auth_user_id', user.id)
      .eq('active', true)
      .single();

    if (salesRepError || !salesRep) {
      console.error('❌ Sales rep not found for user:', user.id, salesRepError);
      throw new Error('Sales representative not found for authenticated user');
    }

    console.log('✅ Sales rep found:', salesRep);

    // Parse dos dados do pedido
    const orderData: MobileOrder = await req.json();
    console.log('📦 Received order data:', orderData);

    // Validar dados obrigatórios
    if (!orderData.customer_id || !orderData.total || !orderData.date) {
      throw new Error('Missing required order fields: customer_id, total, date');
    }

    // Verificar se o cliente pertence ao vendedor
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name, company_name, sales_rep_id')
      .eq('id', orderData.customer_id)
      .eq('sales_rep_id', salesRep.id)
      .eq('active', true)
      .single();

    if (customerError || !customer) {
      console.error('❌ Customer validation failed:', customerError);
      throw new Error('Customer not found or does not belong to the authenticated sales representative');
    }

    console.log('✅ Customer validated:', customer);

    // Gerar código do pedido
    const { data: codeData, error: codeError } = await supabase.rpc('get_next_order_code');
    if (codeError) {
      console.error('❌ Error generating order code:', codeError);
      throw new Error('Failed to generate order code');
    }

    console.log('🔢 Generated order code:', codeData);

    // Preparar dados do pedido para inserção na tabela orders_mobile
    const orderToInsert = {
      customer_id: orderData.customer_id,
      customer_name: orderData.customer_name || customer.company_name || customer.name,
      sales_rep_id: salesRep.id,
      sales_rep_name: salesRep.name,
      date: orderData.date,
      status: orderData.status,
      total: orderData.total,
      notes: orderData.notes || '',
      payment_method: orderData.payment_method || '',
      code: codeData,
      source_project: 'mobile',
      imported: false,
      sync_status: 'pending_import'
    };

    // Inserir pedido na tabela orders_mobile
    const { data: createdOrder, error: orderError } = await supabase
      .from('orders_mobile')
      .insert(orderToInsert)
      .select()
      .single();

    if (orderError) {
      console.error('❌ Error creating mobile order:', orderError);
      throw new Error(`Failed to create mobile order: ${orderError.message}`);
    }

    console.log('✅ Mobile order created successfully:', createdOrder.id);

    // Inserir itens do pedido na tabela order_items_mobile
    if (orderData.items && orderData.items.length > 0) {
      console.log('📋 Creating mobile order items...');
      
      const itemsToInsert = orderData.items.map(item => ({
        order_id: createdOrder.id,
        product_name: item.product_name,
        product_code: item.product_code,
        quantity: item.quantity,
        price: item.price,
        unit_price: item.price,
        total: item.total
      }));

      console.log('🔍 Items to insert:', itemsToInsert);

      const { error: itemsError } = await supabase
        .from('order_items_mobile')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('❌ Error creating mobile order items:', itemsError);
        // Tentar deletar o pedido criado se os itens falharam
        await supabase.from('orders_mobile').delete().eq('id', createdOrder.id);
        throw new Error(`Failed to create mobile order items: ${itemsError.message}`);
      }

      console.log('✅ Mobile order items created successfully');
    }

    // Log da operação
    console.log('📝 Logging mobile order import...');
    const { error: logError } = await supabase
      .from('sync_logs')
      .insert({
        sales_rep_id: salesRep.id,
        event_type: 'mobile_order_received',
        data_type: 'orders',
        records_count: 1,
        status: 'pending_import',
        metadata: {
          order_id: createdOrder.id,
          customer_id: orderData.customer_id,
          total: orderData.total,
          source: 'mobile_app',
          imported: false,
          sales_rep_id: salesRep.id,
          sales_rep_name: salesRep.name
        }
      });

    if (logError) {
      console.error('⚠️ Warning: Failed to log operation:', logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: createdOrder.id,
        code: createdOrder.code,
        sales_rep_id: salesRep.id,
        sales_rep_name: salesRep.name,
        message: 'Pedido recebido e aguardando importação manual',
        status: 'pending_import'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      }
    )

  } catch (error) {
    console.error('❌ Mobile orders import error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
