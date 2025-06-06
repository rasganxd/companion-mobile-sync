
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { salesRep, isLoading, needsInitialSync } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-lg">Verificando autenticação...</div>
        </div>
      </div>
    );
  }

  if (!salesRep) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to initial sync if needed (except if already on sync page)
  if (needsInitialSync && location.pathname !== '/initial-sync') {
    return <Navigate to="/initial-sync" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
