
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import Header from '@/components/Header';
import MenuCard from '@/components/MenuCard';
import NetworkStatusIndicator from '@/components/NetworkStatusIndicator';
import DataSyncDebugPanel from '@/components/DataSyncDebugPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Route, 
  FileText, 
  Users, 
  ShoppingCart, 
  Send, 
  BarChart3, 
  Settings,
  MapPin,
  Package,
  MessageSquare,
  History,
  Minus
} from 'lucide-react';

const Home = () => {
  const { salesRep, lastSyncDate, isOnline } = useAuth();
  const { navigateTo } = useAppNavigation();
  const { connected } = useNetworkStatus();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');
  }, []);

  const menuItems = [
    {
      title: 'Rotas de Visita',
      description: 'Visualizar rotas e clientes do dia',
      icon: <Route size={24} />,
      color: 'blue',
      route: '/rotas'
    },
    {
      title: 'Lista de Clientes',
      description: 'Visualizar todos os clientes',
      icon: <Users size={24} />,
      color: 'green',
      route: '/clients-list'
    },
    {
      title: 'Novo Pedido',
      description: 'Criar um novo pedido',
      icon: <ShoppingCart size={24} />,
      color: 'orange',
      route: '/new-order'
    },
    {
      title: 'Meus Pedidos',
      description: 'Ver pedidos criados',
      icon: <FileText size={24} />,
      color: 'purple',
      route: '/my-orders'
    },
    {
      title: 'Transmitir Pedidos',
      description: 'Enviar pedidos para o servidor',
      icon: <Send size={24} />,
      color: 'red',
      route: '/transmit-orders'
    },
    {
      title: 'Negativar Venda',
      description: 'Registrar venda negativa',
      icon: <Minus size={24} />,
      color: 'gray',
      route: '/negativar-venda'
    },
    {
      title: 'Relatórios',
      description: 'Visualizar relatórios de vendas',
      icon: <BarChart3 size={24} />,
      color: 'indigo',
      route: '/reports'
    },
    {
      title: 'Configurações de Sync',
      description: 'Configurar sincronização',
      icon: <Settings size={24} />,
      color: 'gray',
      route: '/sync-settings'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title={`${greeting}, ${salesRep?.name || 'Vendedor'}!`} 
        showBackButton={false} 
        backgroundColor="blue"
      />
      
      <div className="p-4 flex-1">
        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Status da Conexão</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-lg font-semibold">
                  {connected ? 'Online' : 'Offline'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Última Sincronização</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-lg font-semibold">
                {lastSyncDate 
                  ? new Date(lastSyncDate).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Nunca'
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item, index) => (
            <MenuCard
              key={index}
              title={item.title}
              description={item.description}
              icon={item.icon}
              color={item.color}
              onClick={() => navigateTo(item.route)}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Ações Rápidas</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTo('/new-order')}
              className="flex flex-col items-center p-3 h-auto"
            >
              <Package size={20} className="mb-1" />
              <span className="text-xs">Novo Pedido</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTo('/mensagem')}
              className="flex flex-col items-center p-3 h-auto"
            >
              <MessageSquare size={20} className="mb-1" />
              <span className="text-xs">Mensagem</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTo('/ultimas-compras')}
              className="flex flex-col items-center p-3 h-auto"
            >
              <History size={20} className="mb-1" />
              <span className="text-xs">Últimas Compras</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTo('/rotas')}
              className="flex flex-col items-center p-3 h-auto"
            >
              <MapPin size={20} className="mb-1" />
              <span className="text-xs">Rotas</span>
            </Button>
          </div>
        </div>
      </div>

      <NetworkStatusIndicator />
      <DataSyncDebugPanel />
    </div>
  );
};

export default Home;
