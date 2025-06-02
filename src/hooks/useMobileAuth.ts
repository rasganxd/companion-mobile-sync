
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

  // Helper function to validate if a token is valid (starts with sk_)
  const isValidToken = (value: string): boolean => {
    return value.trim().startsWith('sk_') && value.trim().length > 10;
  };

  // Helper function to detect if a value is a URL
  const isUrl = (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    // Load session from localStorage on mount
    const savedSession = localStorage.getItem('mobile_session');
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        
        console.log('📱 Loading mobile session from localStorage:', {
          salesRep: parsedSession.salesRep?.name,
          hasApiConfig: !!parsedSession.apiConfig
        });

        // Validate API config for corruption if it exists
        if (parsedSession.apiConfig) {
          const { token, apiUrl } = parsedSession.apiConfig;
          
          console.log('🔍 Validating API config:', {
            tokenPreview: token ? `${token.substring(0, 6)}...` : 'empty',
            apiUrl,
            tokenValid: token ? isValidToken(token) : false,
            urlValid: apiUrl ? isUrl(apiUrl) : false
          });

          // Check for data corruption
          let hasCorruption = false;

          if (token && isUrl(token)) {
            console.error('❌ CORRUPTION: Token field contains URL:', token);
            hasCorruption = true;
          }

          if (apiUrl && isValidToken(apiUrl)) {
            console.error('❌ CORRUPTION: API URL field contains token');
            hasCorruption = true;
          }

          if (token && !isValidToken(token) && !isUrl(token)) {
            console.error('❌ INVALID TOKEN: Does not start with sk_');
            hasCorruption = true;
          }

          if (hasCorruption) {
            console.log('🧹 Removing corrupted session data...');
            localStorage.removeItem('mobile_session');
            setSession({
              sessionToken: parsedSession.sessionToken,
              salesRep: parsedSession.salesRep
              // Remove corrupted apiConfig
            });
          } else {
            setSession(parsedSession);
            console.log('✅ Valid session loaded');
          }
        } else {
          setSession(parsedSession);
          console.log('📝 Session loaded without API config');
        }
      } catch (error) {
        console.error('❌ Error parsing saved session:', error);
        localStorage.removeItem('mobile_session');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (code: string, password: string) => {
    try {
      setIsLoading(true);
      
      console.log('🔐 Attempting mobile auth for sales rep code:', code);
      
      const { data, error } = await supabase.functions.invoke('mobile-auth', {
        body: { code, password }
      });

      if (error) {
        console.error('❌ Mobile auth error:', error);
        throw new Error(error.message || 'Erro de autenticação');
      }

      if (!data.success) {
        console.error('❌ Mobile auth failed:', data.error);
        throw new Error(data.error || 'Credenciais inválidas');
      }

      const newSession: MobileSession = {
        sessionToken: data.sessionToken,
        salesRep: data.salesRep
      };

      // Save session to localStorage
      localStorage.setItem('mobile_session', JSON.stringify(newSession));
      setSession(newSession);

      console.log('✅ Mobile auth successful for sales rep:', data.salesRep.name);
      return { success: true };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('👋 Logging out mobile session');
    localStorage.removeItem('mobile_session');
    setSession(null);
    navigate('/login');
  };

  const updateApiConfig = (config: { token: string; apiUrl: string }) => {
    if (session) {
      // Validate the config before saving
      if (!isValidToken(config.token)) {
        console.error('❌ Invalid token provided:', config.token.substring(0, 10) + '...');
        throw new Error('Token inválido. Deve começar com "sk_"');
      }

      if (!isUrl(config.apiUrl)) {
        console.error('❌ Invalid API URL provided:', config.apiUrl);
        throw new Error('URL da API inválida');
      }

      const updatedSession = {
        ...session,
        apiConfig: config
      };
      
      console.log('🔧 Updating API config:', {
        apiUrl: config.apiUrl,
        tokenPreview: `${config.token.substring(0, 6)}...`,
        tokenLength: config.token.length
      });

      localStorage.setItem('mobile_session', JSON.stringify(updatedSession));
      setSession(updatedSession);
    }
  };

  const isAuthenticated = () => session !== null;
  
  const hasApiConfig = () => {
    const hasConfig = session?.apiConfig?.token && session?.apiConfig?.apiUrl;
    
    // Additional validation to ensure the config is not corrupted
    if (hasConfig) {
      const { token, apiUrl } = session.apiConfig;
      const validToken = isValidToken(token);
      const validUrl = isUrl(apiUrl);
      
      console.log('🔍 Checking API config validity:', {
        hasSession: !!session,
        hasToken: !!token,
        hasApiUrl: !!apiUrl,
        validToken,
        validUrl,
        result: validToken && validUrl
      });

      return validToken && validUrl;
    }
    
    console.log('🔍 No API config found');
    return false;
  };

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
