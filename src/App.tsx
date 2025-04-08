
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ClientDetails from "./pages/ClientDetails";
import ClientsList from "./pages/ClientsList";
import LastPurchases from "./pages/LastPurchases";
import VisitRoutes from "./pages/VisitRoutes";
import PlaceOrder from "./pages/PlaceOrder";
import NotFound from "./pages/NotFound";

// Create a new QueryClient instance
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/menu" element={<Index />} />
        <Route path="/" element={<VisitRoutes />} />
        <Route path="/clientes" element={<ClientDetails />} />
        <Route path="/clientes-lista" element={<ClientsList />} />
        <Route path="/ultimas-compras" element={<LastPurchases />} />
        <Route path="/fazer-pedidos" element={<PlaceOrder />} />
        
        {/* Rotas temporárias que redirecionam para a página principal */}
        <Route path="/negativar-venda" element={<Navigate to="/menu" />} />
        <Route path="/mensagem" element={<Navigate to="/menu" />} />
        <Route path="/capturar-posicao" element={<Navigate to="/menu" />} />
        
        {/* Rota de fallback para páginas não encontradas */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
