
import { useLocalAuth } from './useLocalAuth';

interface SalesRep {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
}

export const useAuth = () => {
  const { isLoading, signOut } = useLocalAuth();

  const logout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const isAuthenticated = () => {
    return localStorage.getItem('desktop_ip') !== null && 
           localStorage.getItem('sales_rep_code') !== null;
  };

  // Get sales rep info from localStorage
  const getSalesRepFromStorage = (): SalesRep | null => {
    try {
      const code = localStorage.getItem('sales_rep_code');
      if (!code) return null;

      // For now, return basic info from localStorage
      // Later this can be enhanced to get full data from local database
      return {
        id: code,
        code: code,
        name: `Vendedor ${code}`,
      };
    } catch (error) {
      console.error('Error getting sales rep from storage:', error);
      return null;
    }
  };

  const salesRep = getSalesRepFromStorage();

  return {
    salesRep,
    isLoading,
    isAuthenticated,
    logout
  };
};
