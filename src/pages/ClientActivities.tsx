
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package2, ThumbsDown, Box, Mail } from 'lucide-react';
import Header from '@/components/Header';
import MenuCard from '@/components/MenuCard';
import AppButton from '@/components/AppButton';
import { toast } from 'sonner';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { useAuth } from '@/hooks/useAuth';

const ClientActivities = () => {
  const { goBack } = useAppNavigation();
  const navigate = useNavigate();
  const location = useLocation();
  const { salesRep } = useAuth();
  
  const { clientName, clientId, day } = location.state || {};
  const [loading, setLoading] = useState(false);

  if (!clientId || !clientName) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header title="Atividades do Cliente" showBackButton backgroundColor="blue" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-lg">Dados do cliente não encontrados</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title={clientName} showBackButton backgroundColor="blue" />
      
      <div className="flex-1 p-4">
        <div className="grid grid-cols-2 gap-4">
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
        </div>
      </div>
      
      <div className="p-3 bg-white border-t">
        <AppButton 
          variant="gray"
          fullWidth
          onClick={goBack}
          className="flex items-center justify-center gap-2"
        >
          <ArrowLeft size={18} />
          <span>Voltar</span>
        </AppButton>
      </div>
    </div>
  );
};

export default ClientActivities;
