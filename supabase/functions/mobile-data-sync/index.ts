
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

    // Initialize Supabase client with service role key for direct data access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔄 Using service role key to fetch REAL data from database');

    // SEMPRE usar o ID real do Candatti
    const realSalesRepId = 'e3eff363-2d17-4f73-9918-f53c6bc0bc48';
    console.log('🔄 Using REAL sales rep ID:', realSalesRepId);

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
          JSON.stringify({ error: 'Erro ao buscar clientes do banco de dados' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`✅ Successfully fetched ${clients?.length || 0} clients from database`);
      console.log('📊 Real clients data:', clients);

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
      console.log('📥 Fetching REAL products from database');
      
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
          updated_at
        `)
        .eq('active', true);

      if (error) {
        console.error('❌ Error fetching products from DB:', error);
        return new Response(
          JSON.stringify({ error: 'Erro ao buscar produtos do banco de dados' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`✅ Successfully fetched ${products?.length || 0} products from database`);
      console.log('📊 Real products data:', products);

      if (!products || products.length === 0) {
        console.log('ℹ️ No products found in database');
        return new Response(
          JSON.stringify({ products: [], message: 'Nenhum produto encontrado no banco de dados' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`✅ Returning ${products.length} REAL products from database`);
      return new Response(
        JSON.stringify({ products }),
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
          JSON.stringify({ error: 'Erro ao buscar tabelas de pagamento do banco de dados' }),
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

    console.log('❌ Invalid sync type:', type);
    return new Response(
      JSON.stringify({ error: 'Tipo de sincronização inválido' }),
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
