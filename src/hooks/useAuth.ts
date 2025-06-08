
import { useAuth as useAuthContext } from '@/contexts/AuthContext';

export const useAuth = () => {
  const { 
    salesRep, 
    isLoading, 
    logout, 
    loginWithCredentials,
    needsInitialSync, 
    isOnline, 
    lastSyncDate 
  } = useAuthContext();

  const isAuthenticated = () => {
    const authenticated = salesRep !== null;
    console.log('🔐 useAuth.isAuthenticated():', authenticated, 'salesRep:', salesRep?.name || 'null');
    return authenticated;
  };

  // Log auth state whenever it's accessed
  console.log('🔐 useAuth hook called - salesRep:', salesRep?.name || 'null', 'isLoading:', isLoading);

  return {
    salesRep,
    isLoading,
    isAuthenticated,
    logout,
    loginWithCredentials,
    needsInitialSync,
    isOnline,
    lastSyncDate
  };
};
