
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import AppButton from '@/components/AppButton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { Client } from '@/types/visit-routes';
import ClientsListContent from '@/components/clients/ClientsListContent';
import { useClientsForDay } from '@/hooks/useClientsForDay';
import ClientsAuthLoading from '@/components/clients/ClientsAuthLoading';
import ClientsNoSalesRep from '@/components/clients/ClientsNoSalesRep';

const getDayFromState = (state: any): string => {
  if (state?.day) {
    if (state.day === 'Domingo') {
      console.log('⚠️ State continha "Domingo", redirecionando para Segunda-feira.');
      return 'Segunda';
    }
    return state.day;
  }
  
  const today = new Date();
  const dayIndex = today.getDay();
  
  if (dayIndex === 0) {
    console.log('⚠️ Nenhum dia especificado no state e hoje é Domingo, usando Segunda-feira como padrão.');
    return 'Segunda';
  }

  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const currentDay = dayNames[dayIndex];
  
  console.log('⚠️ Nenhum dia especificado no state, usando dia atual:', currentDay);
  return currentDay;
};

const ClientsList = () => {
  const { goBack, navigateToClientFullScreen } = useAppNavigation();
  const location = useLocation();
  
  const [day] = useState(getDayFromState(location.state));
  const { clients, loading, salesRep, authLoading } = useClientsForDay(day);
  
  const handleClientSelect = (client: Client) => {
    console.log('👤 Selected client:', client);
    console.log('📅 Day:', day);
    
    navigateToClientFullScreen([client], 0, day);
  };

  const handleClientViewDetails = (filteredClients: Client[], initialIndex: number) => {
    console.log('👁️ Opening client full screen view:', {
      clientsCount: filteredClients.length,
      initialIndex,
      day
    });
    
    navigateToClientFullScreen(filteredClients, initialIndex, day);
  };
  
  const handleGoBack = () => {
    console.log('🔙 Going back to visit routes');
    goBack();
  };

  if (authLoading) {
    return <ClientsAuthLoading day={day} />;
  }

  if (!salesRep) {
    return <ClientsNoSalesRep day={day} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title={`Clientes de ${day}`} showBackButton backgroundColor="blue" />
      
      <div className="flex-1 p-4">
        <ScrollArea className="h-full">
          <ClientsListContent
            loading={loading}
            clients={clients}
            day={day}
            salesRep={salesRep}
            onClientSelect={handleClientSelect}
            onClientViewDetails={handleClientViewDetails}
          />
        </ScrollArea>
      </div>
      
      <div className="p-3 bg-white border-t">
        <AppButton 
          variant="gray"
          fullWidth
          onClick={handleGoBack}
          className="flex items-center justify-center gap-2"
        >
          <ArrowLeft size={18} />
          <span>Voltar para Rotas</span>
        </AppButton>
      </div>
    </div>
  );
};

export default ClientsList;
