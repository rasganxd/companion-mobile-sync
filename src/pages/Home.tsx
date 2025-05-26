
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { RefreshCw, Upload, Download, Calendar, LogOut, User } from 'lucide-react';
import { useSync } from '@/hooks/useSync';
import { SyncStatusBadge } from '@/components/SyncComponents';
import { toast } from 'sonner';
import { ShoppingCart, Plus, Package, Settings } from 'lucide-react';

interface SalesRep {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
}

const Home = () => {
  const navigate = useNavigate();
  const { syncStatus, startSync } = useSync();
  const [salesRep, setSalesRep] = useState<SalesRep | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const authenticatedSalesRep = localStorage.getItem('authenticated_sales_rep');
    if (!authenticatedSalesRep) {
      navigate('/login');
      return;
    }

    try {
      const salesRepData = JSON.parse(authenticatedSalesRep);
      setSalesRep(salesRepData);
    } catch (error) {
      console.error('Error parsing sales rep data:', error);
      navigate('/login');
    }
  }, [navigate]);

  const handleTransmitirDados = async () => {
    toast.info("Iniciando transmissão de dados...");
    try {
      const result = await startSync();
      if (result) {
        toast.success("Transmissão de dados concluída com sucesso!");
      } else {
        toast.error("Erro na transmissão de dados");
      }
    } catch (error) {
      toast.error("Erro inesperado durante a transmissão");
      console.error("Erro na transmissão:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authenticated_sales_rep');
    localStorage.removeItem('api_config');
    navigate('/login');
  };

  const menuItems = [
    {
      title: "Fazer Pedido (Local)",
      description: "Criar novos pedidos no banco local",
      icon: <ShoppingCart size={32} />,
      color: "bg-gradient-to-br from-green-400 to-green-600",
      route: "/place-order"
    },
    {
      title: "Novo Pedido (API)",
      description: "Criar pedidos via API REST",
      icon: <Plus size={32} />,
      color: "bg-gradient-to-br from-emerald-400 to-emerald-600",
      route: "/new-order"
    },
    {
      title: "Meus Pedidos",
      description: "Visualizar e gerenciar pedidos via API",
      icon: <Package size={32} />,
      color: "bg-gradient-to-br from-blue-400 to-blue-600",
      route: "/my-orders"
    },
    {
      title: "Configuração da API",
      description: "Configurar integração com API REST",
      icon: <Settings size={32} />,
      color: "bg-gradient-to-br from-purple-400 to-purple-600",
      route: "/api-settings"
    }
  ];

  if (!salesRep) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4" size={32} />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Vendas Fortes" 
        showBackButton={false} 
        backgroundColor="blue" 
      />
      
      <div className="p-4 flex-1 flex flex-col gap-4">
        {/* Card do Vendedor Autenticado */}
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <User size={18} className="mr-2 text-blue-500" />
              Vendedor Logado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Avatar className="h-16 w-16 mr-4 bg-blue-100">
                <AvatarFallback className="text-lg font-semibold text-blue-700">
                  {salesRep.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-lg">{salesRep.name}</h3>
                <p className="text-sm text-gray-500">Código: {salesRep.code}</p>
                <p className="text-sm text-gray-500">ID: {salesRep.id}</p>
                {salesRep.email && (
                  <p className="text-sm text-gray-500">{salesRep.email}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Status da Sincronização */}
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center">
                <RefreshCw size={18} className="mr-2 text-blue-500" />
                Status da Sincronização
              </span>
              <SyncStatusBadge connected={syncStatus.connected} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="border rounded-md p-3 bg-blue-50">
                <div className="flex items-center mb-1">
                  <Upload size={16} className="mr-1 text-blue-600" />
                  <span className="text-sm font-medium">Pendentes para envio</span>
                </div>
                <p className="text-xl font-semibold text-center">{syncStatus.pendingUploads}</p>
              </div>
              <div className="border rounded-md p-3 bg-green-50">
                <div className="flex items-center mb-1">
                  <Download size={16} className="mr-1 text-green-600" />
                  <span className="text-sm font-medium">Pendentes para receber</span>
                </div>
                <p className="text-xl font-semibold text-center">{syncStatus.pendingDownloads}</p>
              </div>
            </div>
            
            <Button 
              onClick={handleTransmitirDados}
              disabled={syncStatus.inProgress}
              className="w-full mb-2"
              variant="default"
            >
              {syncStatus.inProgress ? (
                <>
                  <RefreshCw size={16} className="animate-spin mr-2" />
                  Transmitindo...
                </>
              ) : (
                <>
                  <Upload size={16} className="mr-2" />
                  Transmitir Pedidos
                </>
              )}
            </Button>
            
            <Button 
              onClick={() => navigate('/sync-settings')}
              className="w-full"
              variant="outline"
            >
              Configurações de Sincronização
            </Button>
          </CardContent>
        </Card>
        
        {/* Botões de Navegação */}
        <div className="grid grid-cols-1 gap-4">
          <Button 
            onClick={() => navigate('/visit-routes')}
            className="w-full"
            variant="secondary"
            size="lg"
          >
            <Calendar size={16} className="mr-2" />
            Rotas de Visitas
          </Button>
        </div>
        
        {/* Botão de Logout */}
        <Button 
          onClick={handleLogout}
          className="w-full mt-auto"
          variant="destructive"
          size="lg"
        >
          <LogOut size={16} className="mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default Home;
