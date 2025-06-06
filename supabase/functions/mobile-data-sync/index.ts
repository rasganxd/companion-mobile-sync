
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
      
      // Return empty array for now as we don't have payment tables structure
      return new Response(
        JSON.stringify({ payment_tables: [] }),
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
