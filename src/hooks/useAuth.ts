
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMobileAuth } from './useMobileAuth';

interface SalesRep {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
}

export const useAuth = () => {
  const navigate = useNavigate();
  const { session, isLoading: mobileAuthLoading, signOut: mobileSignOut } = useMobileAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Use mobile auth loading state
    setIsLoading(mobileAuthLoading);
  }, [mobileAuthLoading]);

  const logout = async () => {
    try {
      await mobileSignOut();
    } catch (error) {
      console.error('Error during logout:', error);
      // Force cleanup even with error
      localStorage.removeItem('mobile_session');
      localStorage.removeItem('api_config');
      navigate('/login');
    }
  };

  const isAuthenticated = () => {
    return session !== null;
  };

  // Convert mobile session to expected format
  const salesRep: SalesRep | null = session ? {
    id: session.salesRep.id,
    code: session.salesRep.code.toString(), // Convert number to string
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
