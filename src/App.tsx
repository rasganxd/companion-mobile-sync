
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ClientDetails from "./pages/ClientDetails";
import ClientsList from "./pages/ClientsList";
import LastPurchases from "./pages/LastPurchases";
import VisitRoutes from "./pages/VisitRoutes";
import PlaceOrder from "./pages/PlaceOrder";
import OrderDetails from "./pages/OrderDetails";
import NotFound from "./pages/NotFound";
import SyncSettings from "./pages/SyncSettings";
import DatabaseService from "./services/DatabaseService";

const App = () => {
  // Create QueryClient inside the component
  const [queryClient] = useState(() => new QueryClient());
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    // Initialize database on app startup
    const initDb = async () => {
      const dbService = DatabaseService.getInstance();
      await dbService.initDatabase();
      setDbInitialized(true);
    };

    initDb();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/menu" element={<Index />} />
            <Route path="/" element={<VisitRoutes />} />
            <Route path="/clientes" element={<ClientDetails />} />
            <Route path="/clientes-lista" element={<ClientsList />} />
            <Route path="/ultimas-compras" element={<LastPurchases />} />
            <Route path="/fazer-pedidos" element={<PlaceOrder />} />
            <Route path="/detalhes-pedido" element={<OrderDetails />} />
            <Route path="/sincronizacao" element={<SyncSettings />} />
            
            {/* Rotas temporárias que redirecionam para a página principal */}
            <Route path="/negativar-venda" element={<Navigate to="/menu" />} />
            <Route path="/mensagem" element={<Navigate to="/menu" />} />
            <Route path="/capturar-posicao" element={<Navigate to="/menu" />} />
            
            {/* Rota de fallback para páginas não encontradas */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
          <Sonner />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
