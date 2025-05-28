
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface SalesRep {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
}

export const useAuth = () => {
  const [salesRep, setSalesRep] = useState<SalesRep | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      try {
        const authenticatedSalesRep = localStorage.getItem('authenticated_sales_rep');
        
        if (authenticatedSalesRep) {
          const salesRepData = JSON.parse(authenticatedSalesRep);
          console.log('🔍 useAuth - Loaded sales rep from localStorage:', salesRepData);
          setSalesRep(salesRepData);
        } else {
          console.log('🔍 useAuth - No authenticated sales rep found in localStorage');
          setSalesRep(null);
        }
      } catch (error) {
        console.error('Error parsing sales rep data:', error);
        localStorage.removeItem('authenticated_sales_rep');
        setSalesRep(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Escutar mudanças no localStorage para sincronizar entre abas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authenticated_sales_rep') {
        if (e.newValue) {
          try {
            const salesRepData = JSON.parse(e.newValue);
            setSalesRep(salesRepData);
          } catch (error) {
            console.error('Error parsing sales rep data from storage event:', error);
            setSalesRep(null);
          }
        } else {
          setSalesRep(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const logout = () => {
    localStorage.removeItem('authenticated_sales_rep');
    localStorage.removeItem('api_config');
    setSalesRep(null);
    navigate('/login');
  };

  const isAuthenticated = () => {
    return salesRep !== null && !isLoading;
  };

  return {
    salesRep,
    isLoading,
    isAuthenticated,
    logout
  };
};
