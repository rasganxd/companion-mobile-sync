import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { MobileBackButtonManager } from '@/components/MobileBackButtonManager';
import { useMobileAuth } from '@/hooks/useMobileAuth';

import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import ClientsList from '@/pages/ClientsList';
import ClientDetails from '@/pages/ClientDetails';
import PlaceOrder from '@/pages/PlaceOrder';
import OrderReview from '@/pages/OrderReview';
import LastPurchases from '@/pages/LastPurchases';
import VisitRoutes from '@/pages/VisitRoutes';
import NegativeSale from '@/pages/NegativeSale';
import MessagePage from '@/pages/MessagePage';
import CapturePosition from '@/pages/CapturePosition';
import SyncSettings from '@/pages/SyncSettings';
import QRScanPage from '@/pages/QRScanPage';
import NotFound from '@/pages/NotFound';
import ApiSettings from '@/pages/ApiSettings';
import MyOrders from '@/pages/MyOrders';
import OrderDetails from '@/pages/OrderDetails';
import TransmitOrders from '@/pages/TransmitOrders';
import ClientFullScreenView from '@/pages/ClientFullScreenView';
import Reports from '@/pages/Reports';
import SupabaseSync from '@/pages/SupabaseSync';

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useMobileAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Config Route - requires auth but redirects to config if not configured
const ConfigRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, hasApiConfig, isLoading } = useMobileAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (!hasApiConfig()) {
    return <Navigate to="/api-settings" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <BrowserRouter>
          <NavigationProvider>
            <MobileBackButtonManager />
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Config route - requires auth but allows unconfigured users */}
              <Route path="/api-settings" element={
                <ProtectedRoute>
                  <ApiSettings />
                </ProtectedRoute>
              } />
              
              {/* Protected routes - require auth AND config */}
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={
                <ConfigRoute>
                  <Home />
                </ConfigRoute>
              } />
              
              <Route path="/client-activities" element={
                <ConfigRoute>
                  <Index />
                </ConfigRoute>
              } />
              
              <Route path="/client-fullscreen" element={
                <ConfigRoute>
                  <ClientFullScreenView />
                </ConfigRoute>
              } />
              
              <Route path="/clients" element={
                <ConfigRoute>
                  <ClientsList />
                </ConfigRoute>
              } />
              <Route path="/clientes-lista" element={
                <ConfigRoute>
                  <ClientsList />
                </ConfigRoute>
              } />
              <Route path="/client/:id" element={
                <ConfigRoute>
                  <ClientDetails />
                </ConfigRoute>
              } />
              <Route path="/place-order" element={
                <ConfigRoute>
                  <PlaceOrder />
                </ConfigRoute>
              } />
              <Route path="/order-review" element={
                <ConfigRoute>
                  <OrderReview />
                </ConfigRoute>
              } />
              <Route path="/my-orders" element={
                <ConfigRoute>
                  <MyOrders />
                </ConfigRoute>
              } />
              <Route path="/order-details/:id" element={
                <ConfigRoute>
                  <OrderDetails />
                </ConfigRoute>
              } />
              <Route path="/ultimas-compras" element={
                <ConfigRoute>
                  <LastPurchases />
                </ConfigRoute>
              } />
              <Route path="/visit-routes" element={
                <ConfigRoute>
                  <VisitRoutes />
                </ConfigRoute>
              } />
              <Route path="/rotas" element={
                <ConfigRoute>
                  <VisitRoutes />
                </ConfigRoute>
              } />
              <Route path="/negativar-venda" element={
                <ConfigRoute>
                  <NegativeSale />
                </ConfigRoute>
              } />
              <Route path="/mensagem" element={
                <ConfigRoute>
                  <MessagePage />
                </ConfigRoute>
              } />
              <Route path="/capturar-posicao" element={
                <ConfigRoute>
                  <CapturePosition />
                </ConfigRoute>
              } />
              <Route path="/sync-settings" element={
                <ConfigRoute>
                  <SyncSettings />
                </ConfigRoute>
              } />
              <Route path="/qr-scanner" element={
                <ConfigRoute>
                  <QRScanPage />
                </ConfigRoute>
              } />
              <Route path="/transmit-orders" element={
                <ConfigRoute>
                  <TransmitOrders />
                </ConfigRoute>
              } />
              <Route path="/reports" element={
                <ConfigRoute>
                  <Reports />
                </ConfigRoute>
              } />
              <Route path="/supabase-sync" element={<SupabaseSync />} />
              
              {/* Redirects for old routes */}
              <Route path="/message" element={<Navigate to="/mensagem" replace />} />
              <Route path="/negative-sale" element={<Navigate to="/negativar-venda" replace />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </NavigationProvider>
        </BrowserRouter>
      </div>
    </QueryClientProvider>
  );
}

export default App;
