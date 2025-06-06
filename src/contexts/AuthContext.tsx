
import React, { createContext, useContext, useState, useEffect } from 'react';

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
  loginWithCredentials: (code: string, password: string) => Promise<boolean>;
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

// Mock vendors data for testing
const mockVendors = [
  {
    id: '001',
    code: '001',
    name: 'João Silva',
    email: 'joao@empresa.com',
    password: '123456'
  },
  {
    id: '002',
    code: '002',
    name: 'Maria Santos',
    email: 'maria@empresa.com',
    password: '123456'
  },
  {
    id: '003',
    code: '003',
    name: 'Pedro Oliveira',
    email: 'pedro@empresa.com',
    password: '123456'
  }
];

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

  const loginWithCredentials = async (code: string, password: string): Promise<boolean> => {
    try {
      // Find vendor in mock data
      const vendor = mockVendors.find(v => v.code === code && v.password === password);
      
      if (vendor) {
        const salesRepData: SalesRep = {
          id: vendor.id,
          name: vendor.name,
          code: vendor.code,
          email: vendor.email
        };
        
        login(salesRepData);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  };

  const logout = () => {
    setSalesRep(null);
    localStorage.removeItem('salesRep');
  };

  const value = {
    salesRep,
    isLoading,
    login,
    loginWithCredentials,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
