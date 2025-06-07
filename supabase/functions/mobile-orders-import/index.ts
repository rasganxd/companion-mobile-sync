
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
  test?: boolean; // For connection testing
}

// Função para validar token de sessão mobile
const validateMobileSessionToken = async (token: string, supabase: any) => {
  console.log('🔍 Validating mobile session token:', token.substring(0, 20) + '...');
  
  if (!token.startsWith('mobile_')) {
    throw new Error('Invalid mobile session token format');
  }
  
  // Formato: mobile_{sales_rep_id}_{timestamp}_{random}
  const tokenParts = token.split('_');
  if (tokenParts.length < 4) {
    throw new Error('Invalid mobile session token structure');
  }
  
  const salesRepId = tokenParts[1];
  const timestamp = parseInt(tokenParts[2]);
  
  // Verificar se o token não é muito antigo (24 horas)
  const tokenAge = Date.now() - timestamp;
  const maxAge = 24 * 60 * 60 * 1000; // 24 horas
  
  if (tokenAge > maxAge) {
    throw new Error('Mobile session token expired');
  }
  
  // Verificar se o vendedor existe e está ativo
  const { data: salesRep, error: salesRepError } = await supabase
    .from('sales_reps')
    .select('id, code, name, email, active')
    .eq('id', salesRepId)
    .eq('active', true)
    .single();
  
  if (salesRepError || !salesRep) {
    console.error('❌ Sales rep not found for mobile token:', salesRepId, salesRepError);
    throw new Error('Invalid mobile session token - sales rep not found');
  }
  
  console.log('✅ Mobile session token validated for sales rep:', salesRep.name);
  
  return {
    id: `mobile_${salesRepId}`,
    email: salesRep.email || `sales_rep_${salesRep.code}@mobile.app`,
    sales_rep_id: salesRepId,
    sales_rep_data: salesRep
  };
};

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
      console.error('❌ No Authorization header provided');
      throw new Error('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔐 Processing token type:', token.startsWith('mobile_') ? 'mobile_session' : 'jwt');
    
    let user = null;
    
    try {
      if (token.startsWith('mobile_')) {
        // Validar token de sessão mobile
        console.log('🔍 Validating mobile session token...');
        user = await validateMobileSessionToken(token, supabase);
        console.log('✅ Mobile token validation successful');
      } else {
        // Tentar validar como JWT do Supabase
        console.log('🔍 Validating as Supabase JWT...');
        const { data: { user: jwtUser }, error: jwtError } = await supabase.auth.getUser(token);
        
        if (jwtError || !jwtUser) {
          console.error('❌ JWT validation failed:', jwtError);
          throw new Error('Invalid JWT token');
        }
        
        user = jwtUser;
        console.log('✅ JWT validation successful');
      }
    } catch (authError) {
      console.error('❌ Authentication failed:', authError.message);
      throw new Error('Invalid authentication: ' + authError.message);
    }
    
    if (!user) {
      console.error('❌ No user found after authentication');
      throw new Error('Authentication failed - no user found');
    }

    console.log('✅ User authenticated:', user.id);

    // Parse dos dados do pedido
    const orderData: MobileOrder = await req.json();
    console.log('📦 Received order data:', { 
      customer_id: orderData.customer_id, 
      total: orderData.total, 
      test: orderData.test,
      itemsCount: orderData.items?.length || 0
    });

    // Se for um teste de conexão, retornar sucesso
    if (orderData.test) {
      console.log('✅ Connection test successful');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Connection test successful',
          endpoint: 'mobile-orders-import',
          authenticated_user: user.id,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Validar dados obrigatórios para pedidos reais
    if (!orderData.customer_id || !orderData.total || !orderData.date) {
      throw new Error('Missing required order fields: customer_id, total, date');
    }

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

    console.log('✅ Customer validated:', { id: customer.id, name: customer.name });

    // Gerar código do pedido
    const { data: codeData, error: codeError } = await supabase.rpc('get_next_order_code');
    if (codeError) {
      console.error('❌ Error generating order code:', codeError);
      throw new Error('Failed to generate order code');
    }

    console.log('🔢 Generated order code:', codeData);

    // Preparar dados do pedido para inserção na tabela orders
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
      mobile_order_id: `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sync_status: 'synced'
    };

    // Inserir pedido na tabela orders principal
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

    // Inserir itens do pedido
    if (orderData.items && orderData.items.length > 0) {
      console.log('📋 Creating order items...');
      
      const itemsToInsert = orderData.items.map(item => ({
        order_id: createdOrder.id,
        product_name: item.product_name,
        product_code: item.product_code,
        quantity: item.quantity,
        price: item.price,
        unit_price: item.price,
        total: item.total
      }));

      console.log(`🔍 Inserting ${itemsToInsert.length} items`);

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

    return new Response(
      JSON.stringify({
        success: true,
        order_id: createdOrder.id,
        code: createdOrder.code,
        sales_rep_id: salesRep.id,
        sales_rep_name: salesRep.name,
        message: 'Pedido recebido e processado com sucesso',
        status: 'synced'
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
        success: false,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
