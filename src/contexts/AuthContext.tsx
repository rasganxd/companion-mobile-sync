
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';

interface SalesRep {
  id: string;
  name: string;
  code?: string;
  email?: string;
}

interface AuthContextType {
  salesRep: SalesRep | null;
  isLoading: boolean;
  login: (salesRep: SalesRep) => void;
  logout: () => void;
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

  useEffect(() => {
    const loadStoredAuth = () => {
      try {
        const stored = localStorage.getItem('salesRep');
        if (stored) {
          const parsedSalesRep = JSON.parse(stored);
          setSalesRep(parsedSalesRep);
        }
      } catch (error) {
        console.error('Error loading stored auth:', error);
        localStorage.removeItem('salesRep');
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  const login = (salesRepData: SalesRep) => {
    setSalesRep(salesRepData);
    localStorage.setItem('salesRep', JSON.stringify(salesRepData));
  };

  const logout = () => {
    setSalesRep(null);
    localStorage.removeItem('salesRep');
  };

  const value = {
    salesRep,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
