
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
import NotFound from '@/pages/NotFound';
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
              
              {/* Protected routes */}
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } />
              
              <Route path="/client-activities" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              
              <Route path="/client-fullscreen" element={
                <ProtectedRoute>
                  <ClientFullScreenView />
                </ProtectedRoute>
              } />
              
              <Route path="/clients" element={
                <ProtectedRoute>
                  <ClientsList />
                </ProtectedRoute>
              } />
              <Route path="/clientes-lista" element={
                <ProtectedRoute>
                  <ClientsList />
                </ProtectedRoute>
              } />
              <Route path="/client/:id" element={
                <ProtectedRoute>
                  <ClientDetails />
                </ProtectedRoute>
              } />
              <Route path="/place-order" element={
                <ProtectedRoute>
                  <PlaceOrder />
                </ProtectedRoute>
              } />
              <Route path="/order-review" element={
                <ProtectedRoute>
                  <OrderReview />
                </ProtectedRoute>
              } />
              <Route path="/my-orders" element={
                <ProtectedRoute>
                  <MyOrders />
                </ProtectedRoute>
              } />
              <Route path="/order-details/:id" element={
                <ProtectedRoute>
                  <OrderDetails />
                </ProtectedRoute>
              } />
              <Route path="/ultimas-compras" element={
                <ProtectedRoute>
                  <LastPurchases />
                </ProtectedRoute>
              } />
              <Route path="/visit-routes" element={
                <ProtectedRoute>
                  <VisitRoutes />
                </ProtectedRoute>
              } />
              <Route path="/rotas" element={
                <ProtectedRoute>
                  <VisitRoutes />
                </ProtectedRoute>
              } />
              <Route path="/negativar-venda" element={
                <ProtectedRoute>
                  <NegativeSale />
                </ProtectedRoute>
              } />
              <Route path="/mensagem" element={
                <ProtectedRoute>
                  <MessagePage />
                </ProtectedRoute>
              } />
              <Route path="/capturar-posicao" element={
                <ProtectedRoute>
                  <CapturePosition />
                </ProtectedRoute>
              } />
              <Route path="/sync-settings" element={
                <ProtectedRoute>
                  <SyncSettings />
                </ProtectedRoute>
              } />
              <Route path="/transmit-orders" element={
                <ProtectedRoute>
                  <TransmitOrders />
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              } />
              <Route path="/supabase-sync" element={
                <ProtectedRoute>
                  <SupabaseSync />
                </ProtectedRoute>
              } />
              
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
