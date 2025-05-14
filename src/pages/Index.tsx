
import React from 'react';
import { Package2, ThumbsDown, Box, Mail, Compass } from 'lucide-react';
import Header from '@/components/Header';
import MenuCard from '@/components/MenuCard';
import { useNavigate, useLocation } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientName, clientId } = location.state || { clientName: 'Cliente', clientId: null };
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title={`Lista de Atividades - ${clientName}`}
        showBackButton={true} 
        backgroundColor="blue" 
      />
      
      <div className="flex-1 p-4 grid grid-cols-2 gap-4">
        <MenuCard
          icon={<Package2 size={32} />}
          title="Fazer Pedidos"
          to="/fazer-pedidos"
          state={{ clientName, clientId }}
        />
        <MenuCard
          icon={<ThumbsDown size={32} color="red" />}
          title="Negativar Venda"
          to="/negativar-venda"
          state={{ clientName, clientId, day: location.state?.day }}
        />
        <MenuCard
          icon={<Box size={32} color="orange" />}
          title="Últimas Compras"
          to="/ultimas-compras"
          state={{ clientName, clientId }}
        />
        <MenuCard
          icon={<Mail size={32} color="gold" />}
          title="Mensagem"
          to="/mensagem"
          state={{ clientName, clientId }}
        />
        <MenuCard
          icon={<Compass size={32} color="blue" />}
          title="Capturar Posição"
          to="/capturar-posicao"
          state={{ clientName, clientId }}
        />
      </div>
    </div>
  );
};

export default Index;
