
import { useSupabaseAuth } from './useSupabaseAuth';

// Interface para manter compatibilidade com código existente
interface ApiConfig {
  apiUrl: string;
  token: string;
}

interface MobileSession {
  sessionToken: string;
  salesRep: {
    id: string;
    name: string;
    code: number;
    email?: string;
    phone?: string;
  };
  apiConfig?: ApiConfig;
}

export const useMobileAuth = () => {
  const { 
    user, 
    salesRep, 
    isLoading, 
    isAuthenticated, 
    signInWithEmailPassword, 
    signOut: supabaseSignOut 
  } = useSupabaseAuth();

  // Criar sessão compatível com o formato existente
  const session: MobileSession | null = user && salesRep ? {
    sessionToken: user.id, // Usar user ID como token de sessão
    salesRep: {
      id: salesRep.sales_rep_id,
      name: salesRep.name,
      code: salesRep.code,
      email: salesRep.email,
      phone: salesRep.phone
    }
  } : null;

  const login = async (username: string, password: string) => {
    // Converter código do vendedor para email se necessário
    let email = username;
    if (!username.includes('@')) {
      // Se não é email, assumir que é código do vendedor
      // Para funcionar, o vendedor precisa ter email cadastrado
      console.log('⚠️ Login por código ainda não implementado. Use email e senha.');
      return {
        success: false,
        error: 'Use email e senha para fazer login'
      };
    }

    return await signInWithEmailPassword(email, password);
  };

  const signOut = async () => {
    await supabaseSignOut();
  };

  // Para manter compatibilidade, sempre retorna true (não precisa de config API)
  const hasApiConfig = () => true;

  // Função vazia para manter compatibilidade
  const updateApiConfig = (config: ApiConfig) => {
    console.log('🔄 API config not needed with Supabase integration');
  };

  return {
    session,
    login,
    signOut,
    isAuthenticated,
    isLoading,
    hasApiConfig,
    updateApiConfig
  };
};
