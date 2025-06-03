
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';

interface LocalSession {
  salesRep: {
    id: string;
    name: string;
    code: number;
    email?: string;
    phone?: string;
  };
  sessionToken: string;
}

export const useLocalAuth = () => {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session on load
    loadExistingSession();
  }, []);

  const loadExistingSession = async () => {
    try {
      const savedSession = localStorage.getItem('local_session');
      if (savedSession) {
        const sessionData = JSON.parse(savedSession);
        
        // Validate session is still valid
        const db = getDatabaseAdapter();
        await db.initDatabase();
        
        const salesRep = await db.getClientById(sessionData.salesRep.id);
        if (salesRep) {
          setSession(sessionData);
        } else {
          // Clear invalid session
          localStorage.removeItem('local_session');
        }
      }
    } catch (error) {
      console.error('Error loading existing session:', error);
      localStorage.removeItem('local_session');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithCode = async (code: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const db = getDatabaseAdapter();
      await db.initDatabase();
      
      // Find sales rep by code in local database
      const clients = await db.getClients();
      const salesRep = clients.find(client => 
        client.code === parseInt(code) && client.type === 'sales_rep'
      );
      
      if (!salesRep) {
        return { success: false, error: 'Vendedor não encontrado. Verifique se já fez a primeira sincronização.' };
      }
      
      // Simple password validation (in a real app, use proper hashing)
      if (salesRep.password !== password) {
        return { success: false, error: 'Senha incorreta' };
      }
      
      // Create session
      const sessionData: LocalSession = {
        salesRep: {
          id: salesRep.id,
          name: salesRep.name,
          code: salesRep.code,
          email: salesRep.email,
          phone: salesRep.phone
        },
        sessionToken: `local_${Date.now()}_${salesRep.id}`
      };
      
      setSession(sessionData);
      localStorage.setItem('local_session', JSON.stringify(sessionData));
      
      console.log('✅ Local login successful for:', salesRep.name);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Local login error:', error);
      return { success: false, error: 'Erro interno. Tente novamente.' };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('local_session');
      setSession(null);
      navigate('/initial-sync');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const isAuthenticated = () => session !== null;

  const hasInitialSync = () => {
    return localStorage.getItem('desktop_ip') !== null;
  };

  return {
    session,
    isLoading,
    isAuthenticated,
    hasInitialSync,
    loginWithCode,
    signOut
  };
};
