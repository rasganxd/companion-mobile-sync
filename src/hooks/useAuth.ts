
import { useLocalAuth } from './useLocalAuth';

interface SalesRep {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
}

export const useAuth = () => {
  const { session, isLoading, isAuthenticated: localIsAuthenticated, signOut } = useLocalAuth();

  const logout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const isAuthenticated = () => {
    return localIsAuthenticated();
  };

  // Convert local session to expected format
  const salesRep: SalesRep | null = session ? {
    id: session.salesRep.id,
    code: session.salesRep.code.toString(),
    name: session.salesRep.name,
    email: session.salesRep.email,
    phone: session.salesRep.phone
  } : null;

  return {
    salesRep,
    isLoading,
    isAuthenticated,
    logout
  };
};
