import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { supabaseService } from '@/services/SupabaseService';
import { useDataSync } from '@/hooks/useDataSync';
import { toast } from 'sonner';

interface SalesRep {
  id: string;
  name: string;
  code?: string;
  email?: string;
  sessionToken?: string;
}

interface AuthContextType {
  salesRep: SalesRep | null;
  isLoading: boolean;
  isOnline: boolean;
  lastSyncDate: Date | null;
  login: (salesRep: SalesRep) => void;
  loginWithCredentials: (code: string, password: string) => Promise<boolean>;
  logout: () => void;
  needsInitialSync: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [salesRep, setSalesRep] = useState<SalesRep | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsInitialSync, setNeedsInitialSync] = useState(false);
  const { connected } = useNetworkStatus();
  const { performFullSync, loadLastSyncDate, lastSyncDate } = useDataSync();

  useEffect(() => {
    const loadStoredAuth = () => {
      try {
        const stored = localStorage.getItem('salesRep');
        if (stored) {
          const parsedSalesRep = JSON.parse(stored);
          setSalesRep(parsedSalesRep);
          
          // Check if needs initial sync
          const lastSync = localStorage.getItem('last_sync_date');
          if (!lastSync) {
            setNeedsInitialSync(true);
          }
        }
        
        loadLastSyncDate();
      } catch (error) {
        console.error('Error loading stored auth:', error);
        localStorage.removeItem('salesRep');
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, [loadLastSyncDate]);

  const login = (salesRepData: SalesRep) => {
    setSalesRep(salesRepData);
    localStorage.setItem('salesRep', JSON.stringify(salesRepData));
    
    // Check if needs sync
    if (!lastSyncDate) {
      setNeedsInitialSync(true);
    }
  };

  const loginWithCredentials = async (code: string, password: string): Promise<boolean> => {
    if (!connected) {
      // Try offline login with stored credentials
      const storedRep = localStorage.getItem('salesRep');
      if (storedRep) {
        try {
          const parsedRep = JSON.parse(storedRep);
          if (parsedRep.code === code) {
            setSalesRep(parsedRep);
            toast.success('Login offline realizado com sucesso');
            return true;
          }
        } catch (error) {
          console.error('Error with offline login:', error);
        }
      }
      
      toast.error('Sem conexão. Não foi possível fazer login.');
      return false;
    }

    try {
      setIsLoading(true);
      console.log('🔐 Attempting login with code:', code);
      
      // Para desenvolvimento, aceitar login local com código "1"
      if (code === '1' && password === 'senha123') {
        console.log('🔐 Using local development login');
        const salesRepData: SalesRep = {
          id: 'e3eff363-2d17-4f73-9918-f53c6bc0bc48',
          name: 'Candatti',
          code: '1',
          email: 'candatti@empresa.com',
          sessionToken: 'local_dev_token_' + Date.now()
        };
        
        console.log('✅ Local login successful, saving sales rep data');
        login(salesRepData);
        
        // Perform initial sync
        console.log('🔄 Starting initial sync...');
        toast.success('Login realizado! Iniciando sincronização de dados...');
        
        const syncResult = await performFullSync(salesRepData.id, salesRepData.sessionToken!);
        if (syncResult.success) {
          setNeedsInitialSync(false);
          toast.success('Sincronização concluída com sucesso!');
        } else {
          console.error('❌ Sync failed:', syncResult.error);
          toast.warning('Dados carregados localmente. ' + (syncResult.error || ''));
          setNeedsInitialSync(false); // Considerar como sucesso se temos dados locais
        }
        
        return true;
      }
      
      // Authenticate with Supabase
      const authResult = await supabaseService.authenticateSalesRep(code, password);
      console.log('🔐 Auth result received:', authResult);
      
      if (authResult.success && authResult.salesRep) {
        const salesRepData: SalesRep = {
          ...authResult.salesRep,
          sessionToken: authResult.sessionToken
        };
        
        console.log('✅ Login successful, saving sales rep data');
        login(salesRepData);
        
        // Perform initial sync if needed
        if (!lastSyncDate) {
          console.log('🔄 Starting initial sync...');
          toast.success('Login realizado! Iniciando sincronização de dados...');
          
          const syncResult = await performFullSync(salesRepData.id, authResult.sessionToken);
          if (syncResult.success) {
            setNeedsInitialSync(false);
            toast.success('Sincronização concluída com sucesso!');
          } else {
            console.error('❌ Sync failed:', syncResult.error);
            toast.error('Falha na sincronização: ' + syncResult.error);
            setNeedsInitialSync(true);
          }
        }
        
        return true;
      }
      
      console.log('❌ Login failed - invalid credentials or response');
      return false;
    } catch (error) {
      console.error('❌ Error during login:', error);
      toast.error(error instanceof Error ? error.message : 'Erro durante o login');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setSalesRep(null);
    localStorage.removeItem('salesRep');
    localStorage.removeItem('last_sync_date');
    localStorage.removeItem('sales_rep_id');
    setNeedsInitialSync(false);
  };

  const value = {
    salesRep,
    isLoading,
    isOnline: connected,
    lastSyncDate,
    login,
    loginWithCredentials,
    logout,
    needsInitialSync
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
