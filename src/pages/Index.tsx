
import React from 'react';
import { Package2, ThumbsDown, Box, Mail, Compass, RefreshCw } from 'lucide-react';
import Header from '@/components/Header';
import MenuCard from '@/components/MenuCard';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSync } from '@/hooks/useSync';
import { SyncStatusBadge } from '@/components/SyncComponents';

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientName } = location.state || { clientName: 'Cliente' };
  const { syncStatus } = useSync();
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Lista de Atividades" 
        showBackButton={true} 
        backgroundColor="blue" 
      />
      
      <div className="p-3 pb-0 flex justify-end">
        <SyncStatusBadge connected={syncStatus.connected} />
      </div>
      
      <div className="flex-1 p-4 grid grid-cols-2 gap-4">
        <MenuCard
          icon={<Package2 size={32} />}
          title="Fazer Pedidos"
          to="/fazer-pedidos"
        />
        <MenuCard
          icon={<ThumbsDown size={32} color="red" />}
          title="Negativar Venda"
          to="/negativar-venda"
        />
        <MenuCard
          icon={<Box size={32} color="orange" />}
          title="Últimas Compras"
          to="/ultimas-compras"
          state={{ clientName }}
        />
        <MenuCard
          icon={<Mail size={32} color="gold" />}
          title="Mensagem"
          to="/mensagem"
        />
        <MenuCard
          icon={<Compass size={32} color="blue" />}
          title="Capturar Posição"
          to="/capturar-posicao"
        />
        <MenuCard
          icon={<RefreshCw size={32} color="green" />}
          title="Sincronização"
          to="/sincronizacao"
          variant="secondary"
        />
      </div>
    </div>
  );
};

export default Index;
