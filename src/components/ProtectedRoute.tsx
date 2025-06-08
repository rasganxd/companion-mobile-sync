
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { salesRep, isLoading, needsInitialSync } = useAuth();
  const location = useLocation();

  console.log('🛡️ ProtectedRoute check:', {
    pathname: location.pathname,
    salesRep: salesRep?.name || 'null',
    isLoading,
    needsInitialSync,
    timestamp: new Date().toISOString()
  });

  if (isLoading) {
    console.log('🛡️ ProtectedRoute: Showing loading screen');
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-lg">Verificando autenticação...</div>
        </div>
      </div>
    );
  }

  if (!salesRep) {
    console.log('🛡️ ProtectedRoute: No salesRep found, redirecting to login from:', location.pathname);
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
