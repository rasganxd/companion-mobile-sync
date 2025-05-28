
import React from 'react';
import { Package2, ThumbsDown, Box, Mail, Compass } from 'lucide-react';
import Header from '@/components/Header';
import MenuCard from '@/components/MenuCard';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { logOrderAction } from '@/utils/orderAuditLogger';
import AppButton from '@/components/AppButton';

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { salesRep, isLoading } = useAuth();
  
  // Extrair as informações do cliente do estado de navegação
  const { clientName, clientId, day } = location.state || {};
  
  console.log('🏠 Index page - received state:', { clientName, clientId, day });
  console.log('👨‍💼 Current sales rep:', salesRep?.name);
  
  // Estado de loading da autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-2">Carregando...</div>
          <div className="text-sm text-gray-500">Verificando autenticação</div>
        </div>
      </div>
    );
  }
  
  // Se não há vendedor logado, mostrar estado informativo
  if (!salesRep?.id) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-2">Vendedor não identificado</div>
          <div className="text-sm text-gray-500 mb-4">Faça login para continuar</div>
          <AppButton onClick={() => navigate('/login')}>
            Fazer Login
          </AppButton>
        </div>
      </div>
    );
  }
  
  // Se não temos informações do cliente, redirecionar para clientes
  if (!clientId || !clientName) {
    console.log('❌ Missing client information, redirecting to clients list');
    navigate('/clientes-lista');
    return null;
  }

  // Log do acesso às atividades do cliente
  logOrderAction({
    action: 'CLIENT_ACTIVITIES_ACCESS',
    orderId: 'system',
    salesRepId: salesRep.id,
    salesRepName: salesRep.name,
    customerName: clientName,
    details: { clientId, day, accessType: 'activities_menu' }
  });
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title={`Lista de Atividades - ${clientName}`}
        showBackButton={true} 
        backgroundColor="blue" 
      />
      
      <div className="p-4 mb-2">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-800">
            <div className="font-medium">Vendedor: {salesRep.name}</div>
            <div>Cliente: {clientName}</div>
            {day && <div>Dia: {day}</div>}
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-4 grid grid-cols-2 gap-4">
        <MenuCard
          icon={<Package2 size={32} />}
          title="Fazer Pedidos"
          to="/place-order"
          state={{ clientName, clientId, day }}
        />
        <MenuCard
          icon={<ThumbsDown size={32} color="red" />}
          title="Negativar Venda"
          to="/negativar-venda"
          state={{ clientName, clientId, day }}
        />
        <MenuCard
          icon={<Box size={32} color="orange" />}
          title="Últimas Compras"
          to="/ultimas-compras"
          state={{ clientName, clientId, day }}
        />
        <MenuCard
          icon={<Mail size={32} color="gold" />}
          title="Mensagem"
          to="/mensagem"
          state={{ clientName, clientId, day }}
        />
        <MenuCard
          icon={<Compass size={32} color="blue" />}
          title="Capturar Posição"
          to="/capturar-posicao"
          state={{ clientName, clientId, day }}
        />
      </div>
    </div>
  );
};

export default Index;
