
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

// Context Providers
import { AuthProvider } from '@/contexts/AuthContext';

// Protected Route Component
import ProtectedRoute from '@/components/ProtectedRoute';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Login Route - não protegida */}
              <Route path="/login" element={<Login />} />
              
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
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            
            <Toaster richColors position="top-center" />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
