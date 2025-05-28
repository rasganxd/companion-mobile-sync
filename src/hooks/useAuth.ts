
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
      const authenticatedSalesRep = localStorage.getItem('authenticated_sales_rep');
      
      if (authenticatedSalesRep) {
        try {
          const salesRepData = JSON.parse(authenticatedSalesRep);
          console.log('🔍 useAuth - Loaded sales rep from localStorage:', salesRepData);
          setSalesRep(salesRepData);
        } catch (error) {
          console.error('Error parsing sales rep data:', error);
          localStorage.removeItem('authenticated_sales_rep');
        }
      } else {
        console.log('🔍 useAuth - No authenticated sales rep found in localStorage');
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem('authenticated_sales_rep');
    localStorage.removeItem('api_config');
    setSalesRep(null);
    navigate('/login');
  };

  const isAuthenticated = () => {
    return salesRep !== null;
  };

  return {
    salesRep,
    isLoading,
    isAuthenticated,
    logout
  };
};
