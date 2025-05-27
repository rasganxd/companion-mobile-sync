
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Route, Package, BarChart3, Settings, QrCode, Send, FileText } from 'lucide-react';
import Header from '@/components/Header';
import MenuCard from '@/components/MenuCard';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { Badge } from '@/components/ui/badge';

const Home = () => {
  const navigate = useNavigate();
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  useEffect(() => {
    loadPendingOrdersCount();
  }, []);

  const loadPendingOrdersCount = async () => {
    try {
      const db = getDatabaseAdapter();
      const pendingOrders = await db.getPendingSyncItems('orders');
      setPendingOrdersCount(pendingOrders.length);
    } catch (error) {
      console.error('Error loading pending orders count:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="Vendas Fortes" backgroundColor="blue" />
      
      <div className="flex-1 p-4 grid grid-cols-2 gap-4">
        <MenuCard
          icon={<Users size={32} />}
          title="Clientes"
          to="/clientes-lista"
        />
        <MenuCard
          icon={<Route size={32} />}
          title="Rotas"
          to="/rotas"
        />
        <MenuCard
          icon={<Package size={32} />}
          title="Meus Pedidos"
          to="/my-orders"
        />
        <MenuCard
          icon={<BarChart3 size={32} />}
          title="Relatórios"
          to="/reports"
        />
        <MenuCard
          icon={<Settings size={32} />}
          title="Configurações"
          to="/sync-settings"
        />
        <MenuCard
          icon={<QrCode size={32} />}
          title="QR Scanner"
          to="/qr-scanner"
        />
        
        {/* Transmit Orders Card with Badge */}
        <div className="relative">
          <MenuCard
            icon={<Send size={32} />}
            title="Transmitir Pedidos"
            to="/transmit-orders"
          />
          {pendingOrdersCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 min-w-[1.5rem] h-6 rounded-full flex items-center justify-center text-xs font-bold"
            >
              {pendingOrdersCount}
            </Badge>
          )}
        </div>
        
        <MenuCard
          icon={<FileText size={32} />}
          title="Configurações API"
          to="/api-settings"
        />
      </div>
    </div>
  );
};

export default Home;
