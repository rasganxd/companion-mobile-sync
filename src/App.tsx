
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ClientDetails from "./pages/ClientDetails";
import ClientsList from "./pages/ClientsList";
import LastPurchases from "./pages/LastPurchases";
import VisitRoutes from "./pages/VisitRoutes";
import PlaceOrder from "./pages/PlaceOrder";
import OrderDetails from "./pages/OrderDetails";
import NotFound from "./pages/NotFound";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { initializeSync } from "./lib/sync";

// Initialize mock data for offline testing
import { seedDatabaseWithMockData } from "./lib/mock-data";

const App = () => {
  // Create QueryClient inside the component
  const [queryClient] = useState(() => new QueryClient());
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const setupSync = async () => {
      try {
        // Get or create device ID
        let deviceId = localStorage.getItem("device_id");
        if (!deviceId) {
          deviceId = uuidv4();
          localStorage.setItem("device_id", deviceId);
        }

        // Initialize sync system
        await initializeSync({ deviceId });

        // For development/testing, seed with mock data
        await seedDatabaseWithMockData();

        console.log("Mobile sync initialized successfully");
      } catch (error) {
        console.error("Failed to initialize mobile sync:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    setupSync();
  }, []);

  if (isInitializing) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Inicializando aplicativo...</p>
        </div>
      </div>
    );
  }

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
