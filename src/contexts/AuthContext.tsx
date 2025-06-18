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
  // Propriedades adicionadas para compatibilidade
  isLoading: boolean;
  needsInitialSync: boolean;
  isOnline: boolean;
  lastSyncDate: Date | null;
  loginWithCredentials: (code: string, password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [salesRep, setSalesRep] = useState<SalesRep | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsInitialSync, setNeedsInitialSync] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);

  // Verificar se há uma sessão armazenada ao inicializar
  useEffect(() => {
    const initializeAuth = () => {
      console.log('🔄 AuthContext: Initializing authentication...');
      
      const storedSalesRep = localStorage.getItem('salesRep');
      const storedToken = localStorage.getItem('sessionToken');
      const storedLastSync = localStorage.getItem('last_sync_date');
      
      if (storedSalesRep && storedToken) {
        console.log('🔄 AuthContext: Restoring stored session');
        setSalesRep(JSON.parse(storedSalesRep));
        setSessionToken(storedToken);
      }
      
      if (storedLastSync) {
        setLastSyncDate(new Date(storedLastSync));
      }
      
      // Verificar se precisa de sincronização inicial
      const hasInitialData = localStorage.getItem('initial_sync_completed');
      setNeedsInitialSync(!hasInitialData);
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const login = async (code: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔐 AuthContext.login - REAL AUTH START for code:', code);
      
      // Usar APENAS autenticação real via DatabaseAdapter
      const db = getDatabaseAdapter();
      await db.initDatabase();
      
      console.log('🔍 Attempting REAL authentication via DatabaseAdapter...');
      const authResult = await db.authenticateSalesRep(code, password);
      
      console.log('📊 DatabaseAdapter auth result:', authResult);
      
      if (authResult.success && authResult.salesRep) {
        console.log('✅ Real authentication successful');
        
        const authSalesRep = authResult.salesRep;
        const realToken = `real_${authSalesRep.id}_${Date.now()}`;
        
        setSalesRep(authSalesRep);
        setSessionToken(realToken);
        
        // Armazenar no localStorage
        localStorage.setItem('salesRep', JSON.stringify(authSalesRep));
        localStorage.setItem('sessionToken', realToken);
        
        console.log('✅ Real authentication completed successfully');
        return { success: true };
      }
      
      console.log('❌ Real authentication failed:', authResult.error);
      return { 
        success: false, 
        error: authResult.error || 'Credenciais inválidas' 
      };
      
    } catch (error) {
      console.error('❌ Error in login:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro na autenticação' 
      };
    }
  };

  const loginWithCredentials = async (code: string, password: string): Promise<boolean> => {
    const result = await login(code, password);
    return result.success;
  };

  const logout = () => {
    console.log('🚪 AuthContext.logout');
    setSalesRep(null);
    setSessionToken(null);
    localStorage.removeItem('salesRep');
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('initial_sync_completed');
    toast.success('Logout realizado com sucesso');
  };

  const isAuthenticated = salesRep !== null && sessionToken !== null;

  return (
    <AuthContext.Provider value={{
      salesRep,
      sessionToken,
      login,
      logout,
      isAuthenticated,
      isLoading,
      needsInitialSync,
      isOnline,
      lastSyncDate,
      loginWithCredentials
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
