
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ClientDetails from "./pages/ClientDetails";
import ClientsList from "./pages/ClientsList";
import LastPurchases from "./pages/LastPurchases";
import VisitRoutes from "./pages/VisitRoutes";
import PlaceOrder from "./pages/PlaceOrder";
import OrderDetails from "./pages/OrderDetails";
import NotFound from "./pages/NotFound";
import SyncSettings from "./pages/SyncSettings";
import { getDatabaseAdapter } from "./services/DatabaseAdapter";
import { AlertTriangle } from "lucide-react";
import { Button } from "./components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";

const App = () => {
  // Create QueryClient inside the component
  const [queryClient] = useState(() => new QueryClient());
  const [dbInitialized, setDbInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize database on app startup
    const initDb = async () => {
      try {
        const dbService = getDatabaseAdapter();
        await dbService.initDatabase();
        setDbInitialized(true);
      } catch (err) {
        console.error("Database initialization error:", err);
        setError("Não foi possível inicializar o banco de dados. Por favor, recarregue a aplicação.");
      }
    };

    initDb();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg">Erro na inicialização</AlertTitle>
          <AlertDescription className="mt-2">{error}</AlertDescription>
          <Button 
            className="mt-4 w-full" 
            variant="destructive" 
            onClick={() => window.location.reload()}
          >
            Tentar Novamente
          </Button>
        </Alert>
      </div>
    );
  }

  if (!dbInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">Carregando aplicativo...</p>
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
            <Route path="/" element={<Home />} />
            <Route path="/rotas" element={<VisitRoutes />} />
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
