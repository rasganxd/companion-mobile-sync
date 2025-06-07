
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
    return salesRep !== null;
  };

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
