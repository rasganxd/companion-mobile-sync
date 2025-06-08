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

  // Log state changes
  useEffect(() => {
    console.log('🔐 AuthContext state changed:', {
      salesRep: salesRep?.name || 'null',
      isLoading,
      needsInitialSync,
      connected,
      timestamp: new Date().toISOString()
    });
  }, [salesRep, isLoading, needsInitialSync, connected]);

  useEffect(() => {
    const loadStoredAuth = () => {
      console.log('🔐 AuthContext: Loading stored auth data...');
      try {
        const stored = localStorage.getItem('salesRep');
        console.log('🔐 AuthContext: localStorage salesRep:', stored ? 'found' : 'not found');
        
        if (stored) {
          const parsedSalesRep = JSON.parse(stored);
          console.log('🔐 AuthContext: Parsed salesRep:', parsedSalesRep.name, 'ID:', parsedSalesRep.id);
          setSalesRep(parsedSalesRep);
          
          // Check if needs initial sync
          const lastSync = localStorage.getItem('last_sync_date');
          console.log('🔐 AuthContext: last_sync_date:', lastSync ? 'found' : 'not found');
          if (!lastSync) {
            console.log('🔐 AuthContext: Setting needsInitialSync=true');
            setNeedsInitialSync(true);
          }
        } else {
          console.log('🔐 AuthContext: No stored auth found');
        }
        
        loadLastSyncDate();
      } catch (error) {
        console.error('🔐 AuthContext: Error loading stored auth:', error);
        localStorage.removeItem('salesRep');
      } finally {
        console.log('🔐 AuthContext: Setting isLoading=false');
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, [loadLastSyncDate]);

  const login = (salesRepData: SalesRep) => {
    console.log('🔐 AuthContext: login() called for:', salesRepData.name);
    setSalesRep(salesRepData);
    
    // Persist immediately and verify
    localStorage.setItem('salesRep', JSON.stringify(salesRepData));
    const verification = localStorage.getItem('salesRep');
    console.log('🔐 AuthContext: localStorage persistence verified:', verification ? 'success' : 'failed');
    
    // Check if needs sync
    if (!lastSyncDate) {
      console.log('🔐 AuthContext: No lastSyncDate, setting needsInitialSync=true');
      setNeedsInitialSync(true);
    }
  };

  const loginWithCredentials = async (code: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('🔐 AuthContext: loginWithCredentials() started for code:', code);
      
      // Para desenvolvimento, aceitar login local com código "1"
      if (code === '1' && password === 'senha123') {
        console.log('🔐 AuthContext: Using local development login');
        const salesRepData: SalesRep = {
          id: 'e3eff363-2d17-4f73-9918-f53c6bc0bc48',
          name: 'Candatti',
          code: '1',
          email: 'candatti@empresa.com',
          sessionToken: 'local_dev_token_' + Date.now()
        };
        
        console.log('🔐 AuthContext: Local login successful, calling login()');
        login(salesRepData);
        
        // Realizar sincronização inicial com melhor tratamento de erros
        console.log('🔐 AuthContext: Starting initial sync...');
        toast.success('Login realizado! Carregando dados do banco...');
        
        try {
          const syncResult = await performFullSync(salesRepData.id, salesRepData.sessionToken!);
          if (syncResult.success) {
            setNeedsInitialSync(false);
            console.log('🔐 AuthContext: Sync completed successfully');
            const { clients = 0, products = 0, paymentTables = 0 } = syncResult.syncedData || {};
            
            if (clients > 0 || products > 0) {
              toast.success(`Dados carregados! ${clients} clientes, ${products} produtos, ${paymentTables} tabelas de pagamento`);
            } else {
              toast.warning('Login realizado, mas nenhum dado foi encontrado no banco para este vendedor.');
              console.log('🔐 AuthContext: No data found for this sales rep');
            }
          } else {
            console.error('🔐 AuthContext: Sync failed:', syncResult.error);
            toast.error('Erro na sincronização: ' + (syncResult.error || 'Erro desconhecido'));
            setNeedsInitialSync(true);
          }
        } catch (syncError) {
          console.error('🔐 AuthContext: Sync error:', syncError);
          toast.error('Erro durante a sincronização. Verifique a conexão e tente novamente.');
          setNeedsInitialSync(true);
        }
        
        return true;
      }

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
      
      // Authenticate with Supabase
      const authResult = await supabaseService.authenticateSalesRep(code, password);
      console.log('🔐 Resultado da autenticação recebido:', authResult);
      
      if (authResult.success && authResult.salesRep) {
        const salesRepData: SalesRep = {
          ...authResult.salesRep,
          sessionToken: authResult.sessionToken
        };
        
        console.log('✅ Login bem-sucedido, salvando dados do vendedor');
        login(salesRepData);
        
        // Perform initial sync if needed
        if (!lastSyncDate) {
          console.log('🔄 Iniciando sincronização inicial...');
          toast.success('Login realizado! Iniciando sincronização de dados...');
          
          const syncResult = await performFullSync(salesRepData.id, authResult.sessionToken);
          if (syncResult.success) {
            setNeedsInitialSync(false);
            const { clients = 0, products = 0, paymentTables = 0 } = syncResult.syncedData || {};
            toast.success(`Sincronização concluída! ${clients} clientes, ${products} produtos`);
          } else {
            console.error('❌ Sincronização falhou:', syncResult.error);
            toast.error('Falha na sincronização: ' + syncResult.error);
            setNeedsInitialSync(true);
          }
        }
        
        return true;
      }
      
      console.log('❌ Login falhou - credenciais inválidas');
      toast.error('Código ou senha incorretos');
      return false;
    } catch (error) {
      console.error('❌ Erro durante login:', error);
      toast.error(error instanceof Error ? error.message : 'Erro durante o login');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('🔐 AuthContext: logout() called');
    setSalesRep(null);
    localStorage.removeItem('salesRep');
    localStorage.removeItem('last_sync_date');
    localStorage.removeItem('sales_rep_id');
    setNeedsInitialSync(false);
    console.log('🔐 AuthContext: logout completed, localStorage cleared');
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
