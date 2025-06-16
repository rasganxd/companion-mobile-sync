
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Pages
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import VisitRoutes from '@/pages/VisitRoutes';
import ClientsList from '@/pages/ClientsList';
import ClientActivities from '@/pages/ClientActivities';
import MyOrders from '@/pages/MyOrders';
import Reports from '@/pages/Reports';
import SyncSettings from '@/pages/SyncSettings';
import TransmitOrders from '@/pages/TransmitOrders';
import NewOrder from '@/pages/NewOrder';
import NegativeSale from '@/pages/NegativeSale';
import MessagePage from '@/pages/MessagePage';
import LastPurchases from '@/pages/LastPurchases';
import ViewOrderDetails from '@/pages/ViewOrderDetails';
import MobileDebugPage from '@/pages/MobileDebugPage';

// Context Providers
import { NavigationProvider } from '@/contexts/NavigationContext';

// Protected Route Component
import ProtectedRoute from '@/components/ProtectedRoute';

// Initial Sync Screen
import InitialSyncScreen from '@/components/InitialSyncScreen';

// Mobile Back Button Manager
import { MobileBackButtonManager } from '@/components/MobileBackButtonManager';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <NavigationProvider>
          <div className="App">
            {/* Adicionar o gerenciador do botão voltar para mobile */}
            <MobileBackButtonManager />
            
            <Routes>
              {/* Login Route - não protegida */}
              <Route path="/login" element={<Login />} />
              
              {/* Initial Sync Route - protegida mas não precisa verificar sync */}
              <Route path="/initial-sync" element={
                <ProtectedRoute>
                  <InitialSyncScreen />
                </ProtectedRoute>
              } />
              
              {/* Protected Routes */}
              <Route path="/home" element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } />
              
              <Route path="/rotas" element={
                <ProtectedRoute>
                  <VisitRoutes />
                </ProtectedRoute>
              } />
              
              <Route path="/clients-list" element={
                <ProtectedRoute>
                  <ClientsList />
                </ProtectedRoute>
              } />
              
              <Route path="/client-activities" element={
                <ProtectedRoute>
                  <ClientActivities />
                </ProtectedRoute>
              } />
              
              <Route path="/my-orders" element={
                <ProtectedRoute>
                  <MyOrders />
                </ProtectedRoute>
              } />
              
              <Route path="/new-order" element={
                <ProtectedRoute>
                  <NewOrder />
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
              
              <Route path="/ultimas-compras" element={
                <ProtectedRoute>
                  <LastPurchases />
                </ProtectedRoute>
              } />
              
              <Route path="/reports" element={
                <ProtectedRoute>
                  <Reports />
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
              
              <Route path="/view-order-details/:orderId" element={
                <ProtectedRoute>
                  <ViewOrderDetails />
                </ProtectedRoute>
              } />
              
              <Route path="/mobile-debug" element={
                <ProtectedRoute>
                  <MobileDebugPage />
                </ProtectedRoute>
              } />
              
              {/* Default redirect - vai para HOME, não para login */}
              <Route path="/" element={<Navigate to="/home" replace />} />
              
              {/* Catch all route - vai para HOME, não para login */}
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
            
            <Toaster richColors position="top-center" />
          </div>
        </NavigationProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
