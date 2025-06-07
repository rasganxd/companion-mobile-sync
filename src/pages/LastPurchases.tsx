
import React from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowLeft, Package } from 'lucide-react';
import Header from '@/components/Header';
import AppButton from '@/components/AppButton';
import { useAppNavigation } from '@/hooks/useAppNavigation';

const LastPurchases = () => {
  const { goBack } = useAppNavigation();
  const location = useLocation();
  
  const { clientName, clientId, day } = location.state || {};

  if (!clientId || !clientName) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header title="Últimas Compras" showBackButton backgroundColor="blue" />
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
      <Header title={`Últimas Compras - ${clientName}`} showBackButton backgroundColor="blue" />
      
      <div className="flex-1 p-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center text-gray-500">
            <Package size={48} className="mx-auto mb-4 text-gray-400" />
            <h2 className="text-lg font-semibold mb-2">Últimas Compras</h2>
            <p className="text-sm">Funcionalidade em desenvolvimento</p>
            <p className="text-xs mt-2 text-gray-400">
              Aqui será exibido o histórico de compras do cliente {clientName}
            </p>
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

export default LastPurchases;
