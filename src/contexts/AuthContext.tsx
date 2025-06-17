
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { supabaseService } from '@/services/SupabaseService';
import { toast } from 'sonner';

interface SalesRep {
  id: string;
  name: string;
  code: string;
  email?: string;
}

interface AuthContextType {
  salesRep: SalesRep | null;
  sessionToken: string | null;
  login: (code: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [salesRep, setSalesRep] = useState<SalesRep | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Verificar se há uma sessão armazenada ao inicializar
  useEffect(() => {
    const storedSalesRep = localStorage.getItem('salesRep');
    const storedToken = localStorage.getItem('sessionToken');
    
    if (storedSalesRep && storedToken) {
      console.log('🔄 AuthContext: Restoring stored session');
      setSalesRep(JSON.parse(storedSalesRep));
      setSessionToken(storedToken);
    }
  }, []);

  const login = async (code: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔐 AuthContext.login - START for code:', code);
      
      // Primeiro tentar autenticação local
      const db = getDatabaseAdapter();
      await db.initDatabase();
      
      console.log('🔍 Attempting local authentication...');
      const localResult = await db.authenticateSalesRep(code, password);
      
      if (localResult.success && localResult.salesRep) {
        console.log('✅ Local authentication successful');
        
        const authSalesRep = {
          id: localResult.salesRep.id,
          name: localResult.salesRep.name,
          code: localResult.salesRep.code,
          email: localResult.salesRep.email
        };
        
        const localToken = `local_${authSalesRep.id}_${Date.now()}`;
        
        setSalesRep(authSalesRep);
        setSessionToken(localToken);
        
        // Armazenar no localStorage
        localStorage.setItem('salesRep', JSON.stringify(authSalesRep));
        localStorage.setItem('sessionToken', localToken);
        
        return { success: true };
      }
      
      // Se falhou localmente, tentar no Supabase
      console.log('🌐 Local auth failed, trying Supabase authentication...');
      const supabaseResult = await supabaseService.authenticateSalesRep(code, password);
      
      if (supabaseResult.success && supabaseResult.salesRep && supabaseResult.sessionToken) {
        console.log('✅ Supabase authentication successful');
        
        setSalesRep(supabaseResult.salesRep);
        setSessionToken(supabaseResult.sessionToken);
        
        // Armazenar no localStorage
        localStorage.setItem('salesRep', JSON.stringify(supabaseResult.salesRep));
        localStorage.setItem('sessionToken', supabaseResult.sessionToken);
        
        return { success: true };
      }
      
      console.log('❌ Authentication failed on both local and Supabase');
      return { 
        success: false, 
        error: supabaseResult.error || 'Credenciais inválidas' 
      };
      
    } catch (error) {
      console.error('❌ Error in login:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro na autenticação' 
      };
    }
  };

  const logout = () => {
    console.log('🚪 AuthContext.logout');
    setSalesRep(null);
    setSessionToken(null);
    localStorage.removeItem('salesRep');
    localStorage.removeItem('sessionToken');
    toast.success('Logout realizado com sucesso');
  };

  const isAuthenticated = salesRep !== null && sessionToken !== null;

  return (
    <AuthContext.Provider value={{
      salesRep,
      sessionToken,
      login,
      logout,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
