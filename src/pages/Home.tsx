
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Route, Package, BarChart3, Settings, Send } from 'lucide-react';
import Header from '@/components/Header';
import MenuCard from '@/components/MenuCard';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { Badge } from '@/components/ui/badge';
import { useSync } from '@/hooks/useSync';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Home = () => {
  const navigate = useNavigate();
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [salesRepName, setSalesRepName] = useState('');
  const { syncStatus } = useSync();

  useEffect(() => {
    loadPendingOrdersCount();
    loadSalesRepInfo();
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

  const loadSalesRepInfo = () => {
    try {
      const salesRepData = localStorage.getItem('authenticated_sales_rep');
      if (salesRepData) {
        const salesRep = JSON.parse(salesRepData);
        setSalesRepName(salesRep.name || 'Vendedor');
      }
    } catch (error) {
      console.error('Error loading sales rep info:', error);
      setSalesRepName('Vendedor');
    }
  };

  const formatLastSync = () => {
    if (!syncStatus.lastSync) {
      return 'Nunca sincronizado';
    }
    
    try {
      return format(syncStatus.lastSync, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="Vendas Fortes" backgroundColor="blue" />
      
      {/* Informações do vendedor e sincronização */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Vendedor: {salesRepName}</p>
          </div>
          <div className={`flex items-center px-2 py-1 rounded-full text-xs ${
            syncStatus.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <span className={`w-2 h-2 mr-1 rounded-full ${
              syncStatus.connected ? 'bg-green-500' : 'bg-red-500'
            }`}></span>
            <span>{syncStatus.connected ? 'Online' : 'Offline'}</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-600">
            Última sincronização: {formatLastSync()}
          </p>
        </div>
      </div>
      
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
      </div>
    </div>
  );
};

export default Home;
