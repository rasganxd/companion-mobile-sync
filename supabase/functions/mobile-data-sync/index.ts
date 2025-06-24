
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📱 Mobile data sync request started');
    console.log('🔍 Request method:', req.method);
    console.log('🔍 Request headers:', Object.fromEntries(req.headers.entries()));

    let requestBody;
    try {
      const bodyText = await req.text();
      console.log('📥 Raw request body:', bodyText);
      
      if (!bodyText || bodyText.trim() === '') {
        throw new Error('Request body is empty');
      }
      
      requestBody = JSON.parse(bodyText);
      console.log('✅ Parsed request body:', requestBody);
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body: ' + parseError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { type, sales_rep_id, sales_rep_code, limit } = requestBody;
    
    console.log('📱 Mobile data sync request - Type:', type, 'Sales Rep ID:', sales_rep_id, 'Sales Rep Code:', sales_rep_code);

    // Validate required parameters
    if (!type) {
      console.error('❌ Missing type parameter');
      return new Response(
        JSON.stringify({ error: 'Tipo de sincronização é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ VALIDAÇÃO DO SALES REP CODE CORRIGIDA
    if (!sales_rep_code && !sales_rep_id) {
      console.error('❌ Missing sales rep code or ID');
      return new Response(
        JSON.stringify({ error: 'Código ou ID do vendedor é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role key for direct data access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔄 Using service role key to fetch REAL data from database');

    // ✅ LÓGICA DE SALES REP MELHORADA
    let realSalesRepId = sales_rep_id;
    
    // Se temos o código, buscar o ID real
    if (sales_rep_code && sales_rep_code === '1') {
      realSalesRepId = 'e3eff363-2d17-4f73-9918-f53c6bc0bc48';
      console.log('🔄 Using REAL sales rep ID from code mapping:', realSalesRepId);
    } else if (sales_rep_code) {
      console.log('🔍 Searching for sales rep by code:', sales_rep_code);
      
      // Buscar ID real pelo código
      const { data: salesRepData, error: salesRepError } = await supabase
        .from('sales_reps')
        .select('id')
        .eq('code', sales_rep_code)
        .eq('active', true)
        .single();
        
      if (salesRepError || !salesRepData) {
        console.error('❌ Sales rep not found for code:', sales_rep_code, salesRepError);
        return new Response(
          JSON.stringify({ error: `Vendedor não encontrado para o código: ${sales_rep_code}` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      realSalesRepId = salesRepData.id;
      console.log('✅ Found sales rep ID:', realSalesRepId, 'for code:', sales_rep_code);
    } else {
      // Fallback para o ID padrão se não temos código
      realSalesRepId = realSalesRepId || 'e3eff363-2d17-4f73-9918-f53c6bc0bc48';
      console.log('🔄 Using fallback sales rep ID:', realSalesRepId);
    }

    if (type === 'clients') {
      console.log('📥 Fetching REAL clients for sales rep:', realSalesRepId);
      
      const { data: clients, error } = await supabase
        .from('customers')
        .select('*')
        .eq('sales_rep_id', realSalesRepId)
        .eq('active', true);

      if (error) {
        console.error('❌ Error fetching clients from DB:', error);
        return new Response(
          JSON.stringify({ error: 'Erro ao buscar clientes do banco de dados: ' + error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`✅ Successfully fetched ${clients?.length || 0} clients from database`);
      console.log('📊 Real clients data sample:', clients?.slice(0, 2));

      if (!clients || clients.length === 0) {
        console.log('ℹ️ No clients found in database for this sales rep');
        return new Response(
          JSON.stringify({ clients: [], message: 'Nenhum cliente encontrado para este vendedor' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`✅ Returning ${clients.length} REAL clients from database`);
      return new Response(
        JSON.stringify({ clients }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (type === 'products') {
      console.log('📥 Fetching REAL products with units and pricing restrictions from database');
      
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          id,
          code,
          name,
          sale_price,
          cost_price,
          stock,
          active,
          created_at,
          updated_at,
          max_discount_percent,
          main_unit_id,
          sub_unit_id,
          main_unit:units!main_unit_id(code, description, package_quantity),
          sub_unit:units!sub_unit_id(code, description, package_quantity)
        `)
        .eq('active', true);

      if (error) {
        console.error('❌ Error fetching products from DB:', error);
        return new Response(
          JSON.stringify({ error: 'Erro ao buscar produtos do banco de dados: ' + error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`✅ Successfully fetched ${products?.length || 0} products from database`);
      console.log('📊 Real products data sample:', products?.slice(0, 2));

      if (!products || products.length === 0) {
        console.log('ℹ️ No products found in database');
        return new Response(
          JSON.stringify({ products: [], message: 'Nenhum produto encontrado no banco de dados' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Transform products to include proper unit information and pricing restrictions
      const transformedProducts = products.map(product => {
        const hasSubunit = product.sub_unit_id && product.sub_unit;
        let subunitRatio = 1;
        
        // Calculate subunit ratio if both units exist
        if (hasSubunit && product.main_unit?.package_quantity && product.sub_unit?.package_quantity) {
          subunitRatio = product.main_unit.package_quantity / product.sub_unit.package_quantity;
        }
        
        console.log(`🔍 Product ${product.name} pricing data:`, {
          max_discount_percent: product.max_discount_percent,
          sale_price: product.sale_price
        });
        
        return {
          id: product.id,
          code: product.code,
          name: product.name,
          price: product.sale_price, // Map sale_price to price for compatibility
          sale_price: product.sale_price,
          cost_price: product.cost_price,
          max_discount_percent: product.max_discount_percent, // ✅ MANTER max_discount_percent
          stock: product.stock,
          active: product.active,
          created_at: product.created_at,
          updated_at: product.updated_at,
          unit: product.main_unit?.code || 'UN',
          has_subunit: hasSubunit,
          subunit: hasSubunit ? product.sub_unit?.code : null,
          subunit_ratio: hasSubunit ? subunitRatio : 1,
          main_unit_id: product.main_unit_id,
          sub_unit_id: product.sub_unit_id
        };
      });

      console.log(`✅ Returning ${transformedProducts.length} REAL products with unit and pricing information`);
      
      // Log produtos com restrições de preço para debug
      const productsWithRestrictions = transformedProducts.filter(p => 
        (p.max_discount_percent && p.max_discount_percent > 0)
      );
      console.log(`📊 Products with pricing restrictions: ${productsWithRestrictions.length}`);
      productsWithRestrictions.forEach(p => {
        console.log(`  - ${p.name}: max_discount=${p.max_discount_percent}%`);
      });
      
      return new Response(
        JSON.stringify({ products: transformedProducts }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (type === 'payment_tables') {
      console.log('📥 Fetching REAL payment tables from database');
      
      const { data: paymentTables, error } = await supabase
        .from('payment_tables')
        .select('*')
        .eq('active', true);

      if (error) {
        console.error('❌ Error fetching payment tables from DB:', error);
        return new Response(
          JSON.stringify({ error: 'Erro ao buscar tabelas de pagamento do banco de dados: ' + error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`✅ Successfully fetched ${paymentTables?.length || 0} payment tables from database`);
      
      if (!paymentTables || paymentTables.length === 0) {
        console.log('ℹ️ No payment tables found in database');
        return new Response(
          JSON.stringify({ payment_tables: [], message: 'Nenhuma tabela de pagamento encontrada' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`✅ Returning ${paymentTables.length} REAL payment tables from database`);
      return new Response(
        JSON.stringify({ payment_tables: paymentTables }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ NOVO: Suporte para histórico de pedidos
    if (type === 'orders_history') {
      console.log('📥 Fetching REAL orders history for sales rep:', realSalesRepId);
      
      const orderLimit = limit || 100; // Limitar para não sobrecarregar
      console.log('📊 Orders limit:', orderLimit);
      
      // Buscar pedidos com seus itens
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          code,
          customer_id,
          customer_name,
          date,
          total,
          status,
          sync_status,
          notes,
          payment_method,
          payment_table,
          created_at,
          updated_at
        `)
        .eq('sales_rep_id', realSalesRepId)
        .order('date', { ascending: false })
        .limit(orderLimit);

      if (error) {
        console.error('❌ Error fetching orders from DB:', error);
        return new Response(
          JSON.stringify({ error: 'Erro ao buscar histórico de pedidos do banco de dados: ' + error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`✅ Successfully fetched ${orders?.length || 0} orders from database`);

      if (!orders || orders.length === 0) {
        console.log('ℹ️ No orders found in database for this sales rep');
        return new Response(
          JSON.stringify({ orders: [], message: 'Nenhum pedido encontrado para este vendedor' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Buscar itens de todos os pedidos
      const orderIds = orders.map(order => order.id);
      console.log('📥 Fetching order items for', orderIds.length, 'orders');
      
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          product_id,
          product_name,
          product_code,
          quantity,
          unit,
          unit_price,
          price,
          total,
          discount
        `)
        .in('order_id', orderIds);

      if (itemsError) {
        console.error('❌ Error fetching order items from DB:', itemsError);
        // Continue sem os itens se houver erro
      }

      console.log(`✅ Successfully fetched ${orderItems?.length || 0} order items from database`);

      // Agrupar itens por pedido
      const itemsByOrder = {};
      if (orderItems) {
        orderItems.forEach(item => {
          if (!itemsByOrder[item.order_id]) {
            itemsByOrder[item.order_id] = [];
          }
          itemsByOrder[item.order_id].push(item);
        });
      }

      // Transformar pedidos para incluir itens
      const transformedOrders = orders.map(order => ({
        ...order,
        items: itemsByOrder[order.id] || []
      }));

      console.log(`✅ Returning ${transformedOrders.length} REAL orders with items from database`);
      console.log('📊 Sample order:', transformedOrders[0] ? {
        id: transformedOrders[0].id,
        customer_name: transformedOrders[0].customer_name,
        total: transformedOrders[0].total,
        items_count: transformedOrders[0].items.length
      } : 'No orders');
      
      return new Response(
        JSON.stringify({ orders: transformedOrders }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('❌ Invalid sync type:', type);
    return new Response(
      JSON.stringify({ error: 'Tipo de sincronização inválido: ' + type }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Mobile data sync error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor: ' + error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
