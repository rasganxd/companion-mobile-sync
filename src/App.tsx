
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import ClientsList from '@/pages/ClientsList';
import ClientDetails from '@/pages/ClientDetails';
import PlaceOrder from '@/pages/PlaceOrder';
import VisitRoutes from '@/pages/VisitRoutes';
import NegativeSale from '@/pages/NegativeSale';
import MessagePage from '@/pages/MessagePage';
import SyncSettings from '@/pages/SyncSettings';
import QRScanPage from '@/pages/QRScanPage';
import NotFound from '@/pages/NotFound';
import ApiSettings from '@/pages/ApiSettings';
import MyOrders from '@/pages/MyOrders';
import OrderDetails from '@/pages/OrderDetails';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/home" element={<Home />} />
            <Route path="/clients" element={<ClientsList />} />
            <Route path="/clientes-lista" element={<ClientsList />} />
            <Route path="/client/:id" element={<ClientDetails />} />
            <Route path="/place-order" element={<PlaceOrder />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/order-details/:id" element={<OrderDetails />} />
            <Route path="/visit-routes" element={<VisitRoutes />} />
            <Route path="/rotas" element={<VisitRoutes />} />
            <Route path="/negativar-venda" element={<NegativeSale />} />
            <Route path="/negative-sale" element={<NegativeSale />} />
            <Route path="/mensagem" element={<MessagePage />} />
            <Route path="/message" element={<MessagePage />} />
            <Route path="/capturar-posicao" element={<MessagePage />} />
            <Route path="/sync-settings" element={<SyncSettings />} />
            <Route path="/api-settings" element={<ApiSettings />} />
            <Route path="/qr-scanner" element={<QRScanPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </div>
    </QueryClientProvider>
  );
}

export default App;
