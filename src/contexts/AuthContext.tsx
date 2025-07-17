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
  markSyncCompleted: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  // Log state changes com mais detalhes
  useEffect(() => {
    console.log('🔐 AuthContext state changed:', {
      salesRep: salesRep?.name || 'null',
      salesRepId: salesRep?.id || 'null',
      isLoading,
      needsInitialSync,
      connected,
      timestamp: new Date().toISOString()
    });
  }, [salesRep, isLoading, needsInitialSync, connected]);

  // Função para verificar e recuperar estado de autenticação
  const recoverAuthState = () => {
    try {
      console.log('🔐 AuthContext: Attempting to recover auth state...');
      
      const stored = localStorage.getItem('salesRep');
      if (stored) {
        const parsedSalesRep = JSON.parse(stored);
        console.log('🔐 AuthContext: Recovered salesRep from storage:', {
          id: parsedSalesRep.id,
          name: parsedSalesRep.name,
          hasSessionToken: !!parsedSalesRep.sessionToken
        });
        
        // Verificar se o objeto tem os campos necessários
        if (parsedSalesRep.id && parsedSalesRep.name) {
          setSalesRep(parsedSalesRep);
          return true;
        } else {
          console.warn('🔐 AuthContext: Invalid stored salesRep, removing...');
          localStorage.removeItem('salesRep');
        }
      }
      return false;
    } catch (error) {
      console.error('🔐 AuthContext: Error recovering auth state:', error);
      localStorage.removeItem('salesRep');
      return false;
    }
  };

  useEffect(() => {
    const loadStoredAuth = () => {
      console.log('🔐 AuthContext: Loading stored auth data...');
      
      const recovered = recoverAuthState();
      
      if (recovered) {
        // Check if needs initial sync
        const lastSync = localStorage.getItem('last_sync_date');
        console.log('🔐 AuthContext: last_sync_date:', lastSync ? 'found' : 'not found');
        if (!lastSync) {
          console.log('🔐 AuthContext: Setting needsInitialSync=true');
          setNeedsInitialSync(true);
        }
      } else {
        console.log('🔐 AuthContext: No valid stored auth found');
      }
      
      loadLastSyncDate();
      setIsLoading(false);
    };

    // Adicionar um pequeno delay para permitir que outros contextos se inicializem
    const timer = setTimeout(loadStoredAuth, 50);
    
    return () => clearTimeout(timer);
  }, [loadLastSyncDate]);

  // Adicionar listener para mudanças no localStorage (para sincronização entre abas)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'salesRep') {
        console.log('🔐 AuthContext: localStorage salesRep changed externally');
        
        if (e.newValue) {
          try {
            const newSalesRep = JSON.parse(e.newValue);
            console.log('🔐 AuthContext: Updating salesRep from storage change:', newSalesRep.name);
            setSalesRep(newSalesRep);
          } catch (error) {
            console.error('🔐 AuthContext: Error parsing external salesRep change:', error);
          }
        } else {
          console.log('🔐 AuthContext: salesRep removed externally');
          setSalesRep(null);
        }
      }
      
      // Escutar mudanças no status de sincronização
      if (e.key === 'sync_completed' && e.newValue === 'true') {
        console.log('🔄 AuthContext: Sincronização concluída detectada, removendo needsInitialSync');
        setNeedsInitialSync(false);
        localStorage.removeItem('sync_completed'); // Limpar o sinal
      }
      
      // Escutar mudanças na data de sincronização
      if (e.key === 'last_sync_date' && e.newValue) {
        console.log('🔄 AuthContext: Data de sincronização atualizada, removendo needsInitialSync');
        setNeedsInitialSync(false);
        loadLastSyncDate();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadLastSyncDate]);

  const login = (salesRepData: SalesRep) => {
    console.log('🔐 AuthContext: login() called for:', salesRepData.name);
    
    // Validar dados antes de salvar
    if (!salesRepData.id || !salesRepData.name) {
      console.error('🔐 AuthContext: Invalid salesRep data provided to login');
      return;
    }
    
    setSalesRep(salesRepData);
    
    // Persist immediately and verify
    try {
      const dataToStore = JSON.stringify(salesRepData);
      localStorage.setItem('salesRep', dataToStore);
      
      // Verificar se foi salvo corretamente
      const verification = localStorage.getItem('salesRep');
      console.log('🔐 AuthContext: localStorage persistence verified:', verification ? 'success' : 'failed');
      
      if (!verification) {
        console.error('🔐 AuthContext: Failed to persist salesRep to localStorage');
        toast.error('Erro ao salvar dados de login');
        return;
      }
    } catch (error) {
      console.error('🔐 AuthContext: Error persisting salesRep:', error);
      toast.error('Erro ao salvar dados de login');
      return;
    }
    
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
      
      if (!connected) {
        // Try offline login with stored credentials
        const storedRep = localStorage.getItem('salesRep');
        if (storedRep) {
          try {
            const parsedRep = JSON.parse(storedRep);
            if (parsedRep.code === code) {
              console.log('🔐 AuthContext: Offline login successful');
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
      
      // Authenticate with Supabase only - sem sincronização automática
      const authResult = await supabaseService.authenticateSalesRep(code, password);
      console.log('🔐 Resultado da autenticação recebido:', authResult);
      
      if (authResult.success && authResult.salesRep) {
        const salesRepData: SalesRep = {
          ...authResult.salesRep,
          sessionToken: authResult.sessionToken
        };
        
        console.log('✅ Login bem-sucedido, salvando dados do vendedor');
        login(salesRepData);
        
        // Apenas detectar se precisa de sincronização inicial - SEM executar automaticamente
        if (!lastSyncDate) {
          console.log('🔄 Detectada necessidade de sincronização inicial');
          setNeedsInitialSync(true);
          toast.success('Login realizado! É necessário sincronizar dados para uso offline.');
        } else {
          console.log('✅ Login concluído - dados já sincronizados anteriormente');
          toast.success('Login realizado com sucesso!');
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
    console.log('🔐 AuthContext: logout() started - preserving work data');
    
    // Log what data exists before logout
    const existingKeys = Object.keys(localStorage);
    const workDataKeys = existingKeys.filter(key => 
      key.startsWith('draft_order_') || 
      key === 'last_sync_date' || 
      key === 'sales_rep_id' ||
      key.includes('order_') ||
      key.includes('client_')
    );
    
    console.log('🔐 AuthContext: Work data keys to preserve:', workDataKeys);
    
    // Only clear authentication data - preserve everything else
    setSalesRep(null);
    localStorage.removeItem('salesRep'); // Only remove auth data
    
    // Reset sync requirement but keep sync data
    setNeedsInitialSync(false);
    
    console.log('🔐 AuthContext: logout completed - only auth data cleared, work data preserved');
    console.log('🔐 AuthContext: Preserved data keys:', Object.keys(localStorage).filter(key => 
      key.startsWith('draft_order_') || 
      key === 'last_sync_date' || 
      key === 'sales_rep_id'
    ));
  };

  const markSyncCompleted = () => {
    console.log('🔄 AuthContext: markSyncCompleted() chamado');
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
    needsInitialSync,
    markSyncCompleted
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
