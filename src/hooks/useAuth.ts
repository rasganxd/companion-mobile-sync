
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface SalesRep {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
}

export const useAuth = () => {
  const [salesRep, setSalesRep] = useState<SalesRep | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Primeiro verificar se há usuário autenticado
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.log('🔍 useAuth - No authenticated user found');
          setIsLoading(false);
          return;
        }

        console.log('🔍 useAuth - User authenticated:', user.id);

        // Buscar vendedor pelo auth_user_id
        const { data: salesRepData, error: salesRepError } = await supabase
          .from('sales_reps')
          .select('id, code, name, email, phone')
          .eq('auth_user_id', user.id)
          .eq('active', true)
          .single();

        if (salesRepError || !salesRepData) {
          console.error('❌ useAuth - Sales rep not found for user:', user.id, salesRepError);
          
          // Fallback: tentar buscar por email se auth_user_id não funcionou
          if (user.email) {
            const { data: fallbackSalesRep, error: fallbackError } = await supabase
              .from('sales_reps')
              .select('id, code, name, email, phone')
              .eq('email', user.email)
              .eq('active', true)
              .single();

            if (fallbackError || !fallbackSalesRep) {
              console.error('❌ useAuth - Fallback sales rep lookup failed:', fallbackError);
              setIsLoading(false);
              return;
            }

            console.log('✅ useAuth - Sales rep found via email fallback:', fallbackSalesRep);
            setSalesRep(fallbackSalesRep);
            
            // Atualizar auth_user_id para futuros logins
            await supabase
              .from('sales_reps')
              .update({ auth_user_id: user.id })
              .eq('id', fallbackSalesRep.id);
          }
        } else {
          console.log('✅ useAuth - Sales rep found:', salesRepData);
          setSalesRep(salesRepData);
        }

        // Manter compatibilidade com localStorage para outras partes do sistema
        if (salesRepData) {
          localStorage.setItem('authenticated_sales_rep', JSON.stringify(salesRepData));
        }
        
      } catch (error) {
        console.error('❌ useAuth - Error checking authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 useAuth - Auth state changed:', event);
        
        if (event === 'SIGNED_OUT') {
          setSalesRep(null);
          localStorage.removeItem('authenticated_sales_rep');
        } else if (event === 'SIGNED_IN' && session?.user) {
          // Recarregar dados do vendedor quando fazer login
          setTimeout(() => {
            checkAuth();
          }, 100);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('authenticated_sales_rep');
      localStorage.removeItem('api_config');
      setSalesRep(null);
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      // Força limpeza mesmo com erro
      localStorage.removeItem('authenticated_sales_rep');
      localStorage.removeItem('api_config');
      setSalesRep(null);
      navigate('/login');
    }
  };

  const isAuthenticated = () => {
    return salesRep !== null;
  };

  return {
    salesRep,
    isLoading,
    isAuthenticated,
    logout
  };
};
