
import React from 'react';
import { Package2, ThumbsDown, Box, Mail, Compass, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import MenuCard from '@/components/MenuCard';
import AppButton from '@/components/AppButton';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  
  const handleGoBack = () => {
    // Ao voltar do menu, vai para detalhes do cliente
    navigate('/clientes');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="Lista de Atividades" backgroundColor="blue" />
      
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
      
      <div className="p-3 space-y-3">
        <AppButton 
          variant="gray" 
          fullWidth 
          onClick={handleGoBack}
          className="flex items-center justify-center gap-2"
        >
          <ArrowLeft size={18} />
          <span>Voltar</span>
        </AppButton>
      </div>
    </div>
  );
};

export default Index;
