
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { MobileBackButtonManager } from '@/components/MobileBackButtonManager';

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

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <BrowserRouter>
          <NavigationProvider>
            <MobileBackButtonManager />
            <Routes>
              {/* Redirecionar rota raiz para /home */}
              <Route path="/" element={<Navigate to="/home" replace />} />
              
              <Route path="/login" element={<Login />} />
              <Route path="/home" element={<Home />} />
              
              {/* Lista de Atividades - acessível apenas com estado de cliente */}
              <Route path="/client-activities" element={<Index />} />
              
              <Route path="/clients" element={<ClientsList />} />
              <Route path="/clientes-lista" element={<ClientsList />} />
              <Route path="/client/:id" element={<ClientDetails />} />
              <Route path="/place-order" element={<PlaceOrder />} />
              <Route path="/order-review" element={<OrderReview />} />
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/order-details/:id" element={<OrderDetails />} />
              <Route path="/ultimas-compras" element={<LastPurchases />} />
              <Route path="/visit-routes" element={<VisitRoutes />} />
              <Route path="/rotas" element={<VisitRoutes />} />
              <Route path="/negativar-venda" element={<NegativeSale />} />
              <Route path="/mensagem" element={<MessagePage />} />
              <Route path="/capturar-posicao" element={<CapturePosition />} />
              <Route path="/sync-settings" element={<SyncSettings />} />
              <Route path="/api-settings" element={<ApiSettings />} />
              <Route path="/qr-scanner" element={<QRScanPage />} />
              <Route path="/transmit-orders" element={<TransmitOrders />} />
              
              {/* Redirecionamentos para rotas antigas em inglês */}
              <Route path="/message" element={<Navigate to="/mensagem" replace />} />
              <Route path="/negative-sale" element={<Navigate to="/negativar-venda" replace />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </NavigationProvider>
        </BrowserRouter>
      </div>
    </QueryClientProvider>
  );
}

export default App;
