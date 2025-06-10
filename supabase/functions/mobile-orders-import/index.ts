
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { MobileOrder } from './types.ts'
import { authenticateUser } from './auth.ts'
import { validateOrderData } from './validation.ts'
import { getSalesRep, validateCustomer, createOrder, createOrderItems } from './order-processor.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Autenticar usuário
    const authHeader = req.headers.get('Authorization');
    const user = await authenticateUser(authHeader, supabase);

    // Parse dos dados do pedido
    const orderData: MobileOrder = await req.json();

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

    // Validar dados do pedido
    validateOrderData(orderData);

    // Obter informações do vendedor
    const salesRep = await getSalesRep(user, supabase);

    // Validar cliente
    const customer = await validateCustomer(orderData.customer_id, salesRep.id, supabase);

    // Criar pedido
    const createdOrder = await createOrder(orderData, salesRep, customer, supabase);

    // Criar itens do pedido
    await createOrderItems(orderData, createdOrder.id, supabase);

    return new Response(
      JSON.stringify({
        success: true,
        order_id: createdOrder.id,
        code: createdOrder.code,
        sales_rep_id: salesRep.id,
        sales_rep_name: salesRep.name,
        message: orderData.status === 'cancelled' 
          ? 'Negação de venda recebida e processada com sucesso'
          : 'Pedido recebido e processado com sucesso',
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
