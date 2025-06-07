
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
    const { type, sales_rep_id } = await req.json();
    
    console.log('📱 Mobile data sync request - Type:', type, 'Sales Rep ID:', sales_rep_id);

    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Missing or invalid authorization header');
      return new Response(
        JSON.stringify({ error: 'Token de autorização necessário' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔑 Received token type:', token.startsWith('local_') ? 'LOCAL' : 'SUPABASE_JWT');

    // Check if it's a local session token
    if (token.startsWith('local_')) {
      console.log('🔄 Processing local token, returning mock data for development');
      
      // For local tokens, return mock data to allow offline development
      if (type === 'clients' && sales_rep_id) {
        console.log('📥 Returning mock clients for local session');
        
        const mockClients = [
          {
            id: 'mock-client-1',
            name: 'Cliente Teste 1',
            company_name: 'Empresa Teste 1',
            code: 1001,
            active: true,
            sales_rep_id: sales_rep_id,
            visit_days: ['monday', 'wednesday', 'friday'],
            phone: '(11) 99999-9999',
            email: 'cliente1@teste.com',
            address: 'Rua Teste, 123',
            city: 'São Paulo',
            state: 'SP',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'mock-client-2',
            name: 'Cliente Teste 2',
            company_name: 'Empresa Teste 2',
            code: 1002,
            active: true,
            sales_rep_id: sales_rep_id,
            visit_days: ['tuesday', 'thursday'],
            phone: '(11) 88888-8888',
            email: 'cliente2@teste.com',
            address: 'Avenida Teste, 456',
            city: 'Rio de Janeiro',
            state: 'RJ',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];

        console.log(`✅ Returning ${mockClients.length} mock clients`);
        return new Response(
          JSON.stringify({ clients: mockClients }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (type === 'products') {
        console.log('📥 Returning mock products for local session');
        
        const mockProducts = [
          {
            id: 'mock-product-1',
            code: 2001,
            name: 'Produto Teste 1',
            sale_price: 25.50,
            cost_price: 15.00,
            stock: 100,
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'mock-product-2',
            code: 2002,
            name: 'Produto Teste 2',
            sale_price: 45.00,
            cost_price: 30.00,
            stock: 50,
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];

        console.log(`✅ Returning ${mockProducts.length} mock products`);
        return new Response(
          JSON.stringify({ products: mockProducts }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (type === 'payment_tables') {
        console.log('📥 Returning mock payment tables for local session');
        
        const mockPaymentTables = [
          {
            id: 'mock-payment-1',
            name: 'À Vista',
            description: 'Pagamento à vista com desconto',
            type: 'cash',
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'mock-payment-2',
            name: '30 Dias',
            description: 'Pagamento em 30 dias',
            type: 'term',
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];

        console.log(`✅ Returning ${mockPaymentTables.length} mock payment tables`);
        return new Response(
          JSON.stringify({ payment_tables: mockPaymentTables }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('❌ Invalid sync type for local session:', type);
      return new Response(
        JSON.stringify({ error: 'Tipo de sincronização inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For non-local tokens, proceed with Supabase authentication
    console.log('🔑 Processing Supabase JWT token');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (type === 'clients' && sales_rep_id) {
      console.log('📥 Fetching clients for sales rep:', sales_rep_id);
      
      const { data: clients, error } = await supabase
        .from('customers')
        .select('*')
        .eq('sales_rep_id', sales_rep_id)
        .eq('active', true);

      if (error) {
        console.error('❌ Error fetching clients:', error);
        return new Response(
          JSON.stringify({ error: 'Erro ao buscar clientes' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`✅ Found ${clients?.length || 0} clients`);
      return new Response(
        JSON.stringify({ clients: clients || [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (type === 'products') {
      console.log('📥 Fetching products');
      
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true);

      if (error) {
        console.error('❌ Error fetching products:', error);
        return new Response(
          JSON.stringify({ error: 'Erro ao buscar produtos' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`✅ Found ${products?.length || 0} products`);
      return new Response(
        JSON.stringify({ products: products || [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (type === 'payment_tables') {
      console.log('📥 Fetching payment tables');
      
      const { data: paymentTables, error } = await supabase
        .from('payment_tables')
        .select('*')
        .eq('active', true);

      if (error) {
        console.error('❌ Error fetching payment tables:', error);
        return new Response(
          JSON.stringify({ error: 'Erro ao buscar tabelas de pagamento' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`✅ Found ${paymentTables?.length || 0} payment tables`);
      return new Response(
        JSON.stringify({ payment_tables: paymentTables || [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('❌ Invalid sync type:', type);
    return new Response(
      JSON.stringify({ error: 'Tipo de sincronização inválido' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Mobile data sync error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
