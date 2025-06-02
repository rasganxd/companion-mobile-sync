
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface MobileSalesRep {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
}

interface MobileSession {
  sessionToken: string;
  salesRep: MobileSalesRep;
  apiConfig?: {
    token: string;
    apiUrl: string;
  };
}

export const useMobileAuth = () => {
  const [session, setSession] = useState<MobileSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Load session from localStorage on mount
    const savedSession = localStorage.getItem('mobile_session');
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        setSession(parsedSession);
      } catch (error) {
        console.error('Error parsing saved session:', error);
        localStorage.removeItem('mobile_session');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (code: string, password: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('mobile-auth', {
        body: { code, password }
      });

      if (error) {
        throw new Error(error.message || 'Erro de autenticação');
      }

      if (!data.success) {
        throw new Error(data.error || 'Credenciais inválidas');
      }

      const newSession: MobileSession = {
        sessionToken: data.sessionToken,
        salesRep: data.salesRep
      };

      // Save session to localStorage
      localStorage.setItem('mobile_session', JSON.stringify(newSession));
      setSession(newSession);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('mobile_session');
    localStorage.removeItem('api_config');
    setSession(null);
    navigate('/login');
  };

  const updateApiConfig = (config: { token: string; apiUrl: string }) => {
    if (session) {
      const updatedSession = {
        ...session,
        apiConfig: config
      };
      localStorage.setItem('mobile_session', JSON.stringify(updatedSession));
      setSession(updatedSession);
    }
  };

  const isAuthenticated = () => session !== null;
  
  const hasApiConfig = () => session?.apiConfig?.token && session?.apiConfig?.apiUrl;

  return {
    session,
    salesRep: session?.salesRep || null,
    isLoading,
    isAuthenticated,
    hasApiConfig,
    login,
    logout,
    updateApiConfig
  };
};
