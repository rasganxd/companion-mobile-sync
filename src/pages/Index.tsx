
import React from 'react';
import { Package2, ThumbsDown, Box, Mail, Compass, LogOut } from 'lucide-react';
import Header from '@/components/Header';
import MenuCard from '@/components/MenuCard';

const Index = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header title="Lista de Atividades" backgroundColor="orange" />
      
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
      </div>
      
      <div className="p-4">
        <MenuCard
          icon={<LogOut size={32} />}
          title="Fechar"
          to="/login"
        />
      </div>
    </div>
  );
};

export default Index;
