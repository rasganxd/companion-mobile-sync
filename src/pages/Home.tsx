
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

const Home = () => {
  const navigate = useNavigate();
  const { syncStatus, startSync } = useSync();
  const [vendedor, setVendedor] = useState({
    id: 'V001',
    nome: 'Carlos Silva',
    email: 'carlos@example.com',
    ultimoLogin: new Date().toLocaleDateString()
  });

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
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Vendas Fortes" 
        showBackButton={false} 
        backgroundColor="blue" 
      />
      
      <div className="p-4 flex-1 flex flex-col gap-4">
        {/* Card do Vendedor */}
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <User size={18} className="mr-2 text-blue-500" />
              Informações do Vendedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Avatar className="h-16 w-16 mr-4 bg-blue-100">
                <AvatarFallback className="text-lg font-semibold text-blue-700">
                  {vendedor.nome.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-lg">{vendedor.nome}</h3>
                <p className="text-sm text-gray-500">ID: {vendedor.id}</p>
                <p className="text-sm text-gray-500">{vendedor.email}</p>
                <p className="text-sm text-gray-500">Último acesso: {vendedor.ultimoLogin}</p>
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
              onClick={() => navigate('/sincronizacao')}
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
            onClick={() => navigate('/rotas')}
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
