
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
    
    console.log('🔐 [DEBUG] Mobile auth attempt started');
    console.log('🔐 [DEBUG] Received code:', code, 'type:', typeof code);
    console.log('🔐 [DEBUG] Received password:', password ? '***PROVIDED***' : 'NOT_PROVIDED', 'length:', password?.length);
    
    if (!code || !password) {
      console.log('❌ [DEBUG] Missing credentials validation failed');
      return new Response(
        JSON.stringify({ error: 'Código e senha são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔐 [DEBUG] Supabase client initialized successfully');

    // Convert code to number since it's stored as integer
    const codeNumber = parseInt(code);
    if (isNaN(codeNumber)) {
      console.log('❌ [DEBUG] Code parsing failed. Original:', code, 'Parsed:', codeNumber);
      return new Response(
        JSON.stringify({ error: 'Código deve ser um número válido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔐 [DEBUG] Code parsed successfully:', codeNumber);

    // Query sales_reps table to find the sales rep
    console.log('🔐 [DEBUG] Querying sales_reps table for code:', codeNumber);
    
    const { data: salesRep, error: salesRepError } = await supabase
      .from('sales_reps')
      .select('id, code, name, email, phone, password, active')
      .eq('code', codeNumber)
      .eq('active', true)
      .single();

    console.log('🔐 [DEBUG] Query completed');
    console.log('🔐 [DEBUG] Sales rep data received:', salesRep ? {
      id: salesRep.id,
      code: salesRep.code,
      name: salesRep.name,
      email: salesRep.email,
      active: salesRep.active,
      hasPassword: !!salesRep.password
    } : 'NULL');
    console.log('🔐 [DEBUG] Query error:', salesRepError);

    if (salesRepError || !salesRep) {
      console.log('❌ [DEBUG] Sales rep lookup failed');
      console.log('❌ [DEBUG] Error details:', salesRepError);
      console.log('❌ [DEBUG] Data received:', salesRep);
      
      return new Response(
        JSON.stringify({ error: 'Vendedor não encontrado ou inativo' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [DEBUG] Sales rep found successfully');

    // Check if sales rep has a password set
    if (!salesRep.password) {
      console.log('❌ [DEBUG] Sales rep has no password configured');
      console.log('❌ [DEBUG] Sales rep details:', {
        id: salesRep.id,
        code: salesRep.code,
        name: salesRep.name,
        passwordExists: !!salesRep.password
      });
      
      return new Response(
        JSON.stringify({ error: 'Senha não configurada para este vendedor. Entre em contato com o administrador.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [DEBUG] Sales rep has password configured');

    // Use the verify_password function to validate the password
    console.log('🔑 [DEBUG] Starting password verification...');
    console.log('🔑 [DEBUG] Password provided length:', password.length);
    console.log('🔑 [DEBUG] Hash exists:', !!salesRep.password);
    
    const { data: passwordValid, error: passwordError } = await supabase
      .rpc('verify_password', {
        password: password,
        hash: salesRep.password
      });

    console.log('🔑 [DEBUG] Password verification completed');
    console.log('🔑 [DEBUG] Verification result:', passwordValid);
    console.log('🔑 [DEBUG] Verification error:', passwordError);

    if (passwordError) {
      console.log('❌ [DEBUG] Password verification function error');
      console.log('❌ [DEBUG] Function error details:', passwordError);
      
      return new Response(
        JSON.stringify({ error: 'Erro interno ao verificar senha' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!passwordValid) {
      console.log('❌ [DEBUG] Password verification failed');
      console.log('❌ [DEBUG] Provided password length:', password.length);
      console.log('❌ [DEBUG] Sales rep code:', codeNumber);
      console.log('❌ [DEBUG] This is the 401 error source - password mismatch');
      
      return new Response(
        JSON.stringify({ error: 'Código ou senha incorretos' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [DEBUG] Password verification successful!');

    // Generate a simple session token (in production, use JWT)
    const sessionToken = `mobile_${salesRep.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🔐 [DEBUG] Session token generated');

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

    console.log('✅ [DEBUG] Authentication successful - returning result');
    console.log('✅ [DEBUG] Auth result summary:', {
      success: authResult.success,
      salesRepId: authResult.salesRep.id,
      salesRepName: authResult.salesRep.name,
      hasSessionToken: !!authResult.sessionToken
    });
    
    return new Response(
      JSON.stringify(authResult),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [DEBUG] Unexpected error in mobile auth');
    console.error('❌ [DEBUG] Error details:', error);
    console.error('❌ [DEBUG] Error message:', error.message);
    console.error('❌ [DEBUG] Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
