
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ClientDetails from "./pages/ClientDetails";
import LastPurchases from "./pages/LastPurchases";
import VisitRoutes from "./pages/VisitRoutes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Index />} />
          <Route path="/clientes" element={<ClientDetails />} />
          <Route path="/ultimas-compras" element={<LastPurchases />} />
          <Route path="/rotas" element={<VisitRoutes />} />
          
          {/* Rotas temporárias que redirecionam para a página principal */}
          <Route path="/fazer-pedidos" element={<Navigate to="/" />} />
          <Route path="/negativar-venda" element={<Navigate to="/" />} />
          <Route path="/mensagem" element={<Navigate to="/" />} />
          <Route path="/capturar-posicao" element={<Navigate to="/" />} />
          
          {/* Rota de fallback para páginas não encontradas */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
