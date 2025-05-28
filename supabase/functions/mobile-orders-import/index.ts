
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderItem {
  product_name: string;
  product_code?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
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

    // Parse dos dados do pedido
    const orderData: MobileOrder = await req.json();
    console.log('📦 Received order data:', orderData);

    // Validar dados obrigatórios
    if (!orderData.customer_id || !orderData.total || !orderData.date) {
      throw new Error('Missing required order fields: customer_id, total, date');
    }

    // Gerar código do pedido
    const { data: codeData, error: codeError } = await supabase.rpc('get_next_order_code');
    if (codeError) {
      console.error('❌ Error generating order code:', codeError);
      throw new Error('Failed to generate order code');
    }

    console.log('🔢 Generated order code:', codeData);

    // Preparar dados do pedido para inserção
    const orderToInsert = {
      customer_id: orderData.customer_id,
      customer_name: orderData.customer_name,
      date: orderData.date,
      status: orderData.status,
      total: orderData.total,
      notes: orderData.notes || '',
      payment_method: orderData.payment_method || '',
      code: codeData,
      source_project: 'mobile',
      imported: false, // CRUCIAL: marcar como não importado
      sync_status: 'pending_import' // Status especial para pedidos móveis
    };

    // Inserir pedido na tabela (sem RLS porque estamos usando service role)
    const { data: createdOrder, error: orderError } = await supabase
      .from('orders')
      .insert(orderToInsert)
      .select()
      .single();

    if (orderError) {
      console.error('❌ Error creating order:', orderError);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    console.log('✅ Order created successfully:', createdOrder.id);

    // Inserir itens do pedido se existirem
    if (orderData.items && orderData.items.length > 0) {
      console.log('📋 Creating order items...');
      
      const itemsToInsert = orderData.items.map(item => ({
        order_id: createdOrder.id,
        product_name: item.product_name,
        product_code: item.product_code,
        quantity: item.quantity,
        price: item.unit_price,
        unit_price: item.unit_price,
        total: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('❌ Error creating order items:', itemsError);
        // Tentar deletar o pedido criado se os itens falharam
        await supabase.from('orders').delete().eq('id', createdOrder.id);
        throw new Error(`Failed to create order items: ${itemsError.message}`);
      }

      console.log('✅ Order items created successfully');
    }

    // Log da operação
    console.log('📝 Logging mobile order import...');
    const { error: logError } = await supabase
      .from('sync_logs')
      .insert({
        event_type: 'mobile_order_import',
        data_type: 'orders',
        records_count: 1,
        status: 'pending_manual_import',
        metadata: {
          order_id: createdOrder.id,
          customer_id: orderData.customer_id,
          total: orderData.total,
          source: 'mobile_app',
          imported: false
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
