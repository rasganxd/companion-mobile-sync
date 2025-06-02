
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
    const { code, password } = await req.json();
    
    console.log('🔐 Mobile auth attempt for sales rep code:', code);
    
    if (!code || !password) {
      console.log('❌ Missing credentials - code:', !!code, 'password:', !!password);
      return new Response(
        JSON.stringify({ error: 'Código e senha são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Convert code to number since it's stored as integer
    const codeNumber = parseInt(code);
    if (isNaN(codeNumber)) {
      console.log('❌ Invalid code format:', code);
      return new Response(
        JSON.stringify({ error: 'Código deve ser um número válido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Query sales_reps table to find the sales rep
    const { data: salesRep, error: salesRepError } = await supabase
      .from('sales_reps')
      .select('id, code, name, email, phone, password, active')
      .eq('code', codeNumber)
      .eq('active', true)
      .single();

    if (salesRepError || !salesRep) {
      console.log('❌ Sales rep not found or inactive:', salesRepError);
      return new Response(
        JSON.stringify({ error: 'Vendedor não encontrado ou inativo' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Sales rep found:', salesRep.name, 'has password:', !!salesRep.password);

    // Check if sales rep has a password set
    if (!salesRep.password) {
      console.log('❌ Sales rep has no password configured:', codeNumber);
      return new Response(
        JSON.stringify({ error: 'Senha não configurada para este vendedor. Entre em contato com o administrador.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use the verify_password function to validate the password
    console.log('🔑 Verifying password with hash function...');
    const { data: passwordValid, error: passwordError } = await supabase
      .rpc('verify_password', {
        password: password,
        hash: salesRep.password
      });

    if (passwordError) {
      console.log('❌ Error verifying password:', passwordError);
      return new Response(
        JSON.stringify({ error: 'Erro interno ao verificar senha' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!passwordValid) {
      console.log('❌ Password verification failed for sales rep:', codeNumber);
      return new Response(
        JSON.stringify({ error: 'Código ou senha incorretos' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a simple session token (in production, use JWT)
    const sessionToken = `mobile_${salesRep.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Return successful authentication
    const authResult = {
      success: true,
      sessionToken,
      salesRep: {
        id: salesRep.id,
        code: salesRep.code.toString(),
        name: salesRep.name,
        email: salesRep.email,
        phone: salesRep.phone
      }
    };

    console.log('✅ Mobile auth successful for sales rep:', codeNumber, '- Session token generated');
    
    return new Response(
      JSON.stringify(authResult),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Mobile auth error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
