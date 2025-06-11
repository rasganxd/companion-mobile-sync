
import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { salesRep, isLoading, needsInitialSync } = useAuth();
  const location = useLocation();
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [hasStoredAuth, setHasStoredAuth] = useState(false);

  console.log('🛡️ ProtectedRoute check:', {
    pathname: location.pathname,
    salesRep: salesRep?.name || 'null',
    isLoading,
    needsInitialSync,
    authCheckComplete,
    hasStoredAuth,
    timestamp: new Date().toISOString()
  });

  // Verificação mais robusta de autenticação armazenada
  useEffect(() => {
    const checkStoredAuth = () => {
      try {
        console.log('🛡️ ProtectedRoute: Checking stored authentication...');
        
        const stored = localStorage.getItem('salesRep');
        const lastSync = localStorage.getItem('last_sync_date');
        
        console.log('🛡️ ProtectedRoute: Storage check:', {
          hasSalesRep: !!stored,
          hasLastSync: !!lastSync,
          storedData: stored ? 'found' : 'not found'
        });
        
        if (stored) {
          try {
            const parsedSalesRep = JSON.parse(stored);
            console.log('🛡️ ProtectedRoute: Parsed stored salesRep:', {
              id: parsedSalesRep.id,
              name: parsedSalesRep.name,
              hasSessionToken: !!parsedSalesRep.sessionToken
            });
            setHasStoredAuth(true);
          } catch (parseError) {
            console.error('🛡️ ProtectedRoute: Error parsing stored salesRep:', parseError);
            localStorage.removeItem('salesRep');
            setHasStoredAuth(false);
          }
        } else {
          setHasStoredAuth(false);
        }
      } catch (error) {
        console.error('🛡️ ProtectedRoute: Error checking localStorage:', error);
        setHasStoredAuth(false);
      } finally {
        setAuthCheckComplete(true);
      }
    };

    // Dar um tempo para o contexto de auth inicializar
    const timer = setTimeout(checkStoredAuth, 100);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Loading state - mostrar enquanto auth não terminou de carregar
  if (isLoading || !authCheckComplete) {
    console.log('🛡️ ProtectedRoute: Showing loading screen - isLoading:', isLoading, 'authCheckComplete:', authCheckComplete);
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-lg">Verificando autenticação...</div>
          <div className="text-sm mt-2">Aguarde um momento</div>
        </div>
      </div>
    );
  }

  // Se não há salesRep no estado, mas há dados persistidos, permitir acesso
  if (!salesRep && hasStoredAuth) {
    console.log('🛡️ ProtectedRoute: No salesRep in state but found stored auth, allowing access');
    return <>{children}</>;
  }

  // Se não há nenhuma autenticação, redirecionar para login
  if (!salesRep && !hasStoredAuth) {
    console.log('🛡️ ProtectedRoute: No authentication found, redirecting to login from:', location.pathname);
    return <Navigate to="/login" replace />;
  }

  // Redirect to initial sync if needed (except if already on sync page)
  if (needsInitialSync && location.pathname !== '/initial-sync') {
    console.log('🛡️ ProtectedRoute: needsInitialSync=true, redirecting to initial-sync from:', location.pathname);
    return <Navigate to="/initial-sync" replace />;
  }

  console.log('🛡️ ProtectedRoute: Access granted to:', location.pathname);
  return <>{children}</>;
};

export default ProtectedRoute;
