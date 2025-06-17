
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import MenuCard from '@/components/MenuCard';
import DataSyncDebugPanel from '@/components/DataSyncDebugPanel';
import { useLocalSyncStatus } from '@/hooks/useLocalSyncStatus';
import { Users, Package, ShoppingCart, BarChart3, Route, Send } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const { syncStatus } = useLocalSyncStatus();

  const menuItems = [
    {
      icon: Users,
      title: 'Clientes',
      description: 'Visualizar lista de clientes',
      color: 'blue' as const,
      onClick: () => navigate('/clients-list')
    },
    {
      icon: Route,
      title: 'Rotas de Visita',
      description: 'Gerenciar rotas e visitas',
      color: 'green' as const,
      onClick: () => navigate('/visit-routes')
    },
    {
      icon: ShoppingCart,
      title: 'Novo Pedido',
      description: 'Criar um novo pedido',
      color: 'purple' as const,
      onClick: () => navigate('/new-order')
    },
    {
      icon: Package,
      title: 'Meus Pedidos',
      description: 'Visualizar pedidos criados',
      color: 'orange' as const,
      onClick: () => navigate('/my-orders')
    },
    {
      icon: Send,
      title: 'Transmitir Pedidos',
      description: 'Enviar pedidos para o servidor',
      color: 'red' as const,
      onClick: () => navigate('/transmit-orders')
    },
    {
      icon: BarChart3,
      title: 'Relatórios',
      description: 'Visualizar relatórios de vendas',
      color: 'gray' as const,
      onClick: () => navigate('/reports')
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header 
        title="Vendas Fortes" 
        backgroundColor="blue"
        rightComponent={
          <div className="text-right text-white text-xs">
            <div>Pedidos pendentes: {syncStatus.pendingOrdersCount}</div>
            {syncStatus.lastSync && (
              <div>Última sync: {syncStatus.lastSync.toLocaleTimeString()}</div>
            )}
          </div>
        }
      />
      
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {menuItems.map((item, index) => (
            <MenuCard
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              color={item.color}
              onClick={item.onClick}
            />
          ))}
        </div>
      </div>

      <DataSyncDebugPanel />
    </div>
  );
};

export default Home;
