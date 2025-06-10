
import type { AuthenticatedUser } from './types.ts';

export const validateMobileSessionToken = async (token: string, supabase: any): Promise<AuthenticatedUser> => {
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

export const authenticateUser = async (authHeader: string | null, supabase: any): Promise<AuthenticatedUser> => {
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
  return user;
};
