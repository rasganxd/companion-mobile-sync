
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
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

  const handleCreateOrder = () => {
    navigate('/my-orders', {
      state: {
        clientId,
        clientName,
        day
      }
    });
  };

  const handleNegateClient = () => {
    // Implementar negativação
    toast.success('Cliente negativado');
    goBack();
  };

  const handleViewOrders = () => {
    navigate('/my-orders', {
      state: {
        clientId,
        clientName,
        day,
        viewMode: true
      }
    });
  };

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
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Ações Disponíveis</h2>
            
            <div className="space-y-3">
              <AppButton 
                variant="blue"
                fullWidth
                onClick={handleCreateOrder}
                className="h-12"
              >
                Criar Novo Pedido
              </AppButton>
              
              <AppButton 
                variant="gray"
                fullWidth
                onClick={handleViewOrders}
                className="h-12"
              >
                Ver Pedidos Existentes
              </AppButton>
              
              <AppButton 
                variant="orange"
                fullWidth
                onClick={handleNegateClient}
                className="h-12"
              >
                Negativar Cliente
              </AppButton>
            </div>
          </div>
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
