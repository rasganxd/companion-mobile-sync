
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronLeft, User, Building, Phone, MapPin, Hash } from 'lucide-react';
import Header from '@/components/Header';
import AppButton from '@/components/AppButton';
import { Card, CardContent } from '@/components/ui/card';
import { useAppNavigation } from '@/hooks/useAppNavigation';

interface Client {
  id: string;
  name: string;
  company_name?: string;
  code?: number;
  active: boolean;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  visit_days?: string[];
  status?: 'positivado' | 'negativado' | 'pendente';
  orderTotal?: number;
  hasLocalOrders?: boolean;
  localOrdersCount?: number;
  hasTransmittedOrders?: boolean;
  transmittedOrdersCount?: number;
}

const ClientFullScreenView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { goBack } = useAppNavigation();
  
  const { clients, initialIndex = 0, day } = location.state || { clients: [], initialIndex: 0, day: 'Segunda' };
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  useEffect(() => {
    if (!clients || clients.length === 0) {
      goBack();
    }
  }, [clients, goBack]);

  if (!clients || clients.length === 0) {
    return null;
  }

  const currentClient = clients[currentIndex];
  
  const handlePrevious = () => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : clients.length - 1);
  };
  
  const handleNext = () => {
    setCurrentIndex(prev => prev < clients.length - 1 ? prev + 1 : 0);
  };
  
  const handleStartActivity = () => {
    navigate('/client-activities', {
      state: {
        clientName: currentClient.company_name || currentClient.name,
        clientId: currentClient.id,
        day: day
      }
    });
  };

  const getStatusInfo = (client: Client) => {
    const localInfo = client.hasLocalOrders ? ` (${client.localOrdersCount} local)` : '';
    const transmittedInfo = client.hasTransmittedOrders ? ` (${client.transmittedOrdersCount} transmitido)` : '';
    
    switch (client.status) {
      case 'positivado':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          text: `Positivado${localInfo}${transmittedInfo}`
        };
      case 'negativado':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          text: `Negativado${localInfo}${transmittedInfo}`
        };
      case 'pendente':
      default:
        return {
          color: (client.hasLocalOrders || client.hasTransmittedOrders) ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-100 text-gray-800 border-gray-200',
          text: `Pendente${localInfo}${transmittedInfo}`
        };
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const statusInfo = getStatusInfo(currentClient);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title={`Cliente ${currentIndex + 1} de ${clients.length}`}
        showBackButton 
        backgroundColor="blue" 
      />
      
      <div className="bg-app-blue text-white px-3 py-1 text-xs">
        <span className="font-semibold">{day}</span> - Visualização Detalhada
      </div>
      
      <div className="flex-1 p-4 flex flex-col">
        {/* Card Principal do Cliente */}
        <Card className="flex-1 mb-4">
          <CardContent className="p-6 h-full flex flex-col">
            {/* Header do Cliente */}
            <div className="text-center mb-6">
              <div className="bg-blue-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                {currentClient.company_name ? (
                  <Building className="h-10 w-10 text-app-blue" />
                ) : (
                  <User className="h-10 w-10 text-app-blue" />
                )}
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentClient.company_name || currentClient.name}
              </h2>
              
              {currentClient.company_name && currentClient.name && (
                <p className="text-lg text-gray-600 mb-3">
                  Razão Social: {currentClient.name}
                </p>
              )}
              
              <div className={`inline-block px-4 py-2 rounded-lg border ${statusInfo.color}`}>
                <span className="font-medium">{statusInfo.text}</span>
              </div>
              
              {currentClient.status === 'positivado' && currentClient.orderTotal && currentClient.orderTotal > 0 && (
                <div className="mt-3 text-2xl font-bold text-green-600">
                  {formatCurrency(currentClient.orderTotal)}
                </div>
              )}
            </div>
            
            {/* Informações Detalhadas */}
            <div className="space-y-4 flex-1">
              {currentClient.code && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Hash className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Código</p>
                    <p className="font-medium">{currentClient.code}</p>
                  </div>
                </div>
              )}
              
              {currentClient.phone && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Telefone</p>
                    <p className="font-medium">{currentClient.phone}</p>
                  </div>
                </div>
              )}
              
              {(currentClient.address || currentClient.city || currentClient.state) && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Endereço</p>
                    <div className="font-medium">
                      {currentClient.address && (
                        <p>{currentClient.address}</p>
                      )}
                      {(currentClient.city || currentClient.state) && (
                        <p>
                          {currentClient.city}
                          {currentClient.city && currentClient.state && ', '}
                          {currentClient.state}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Botão de Ação Principal */}
            <div className="mt-6">
              <AppButton 
                variant="blue"
                fullWidth
                onClick={handleStartActivity}
                className="text-lg py-4"
              >
                Iniciar Atividades
              </AppButton>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Navegação Inferior */}
      <div className="p-4 bg-white border-t">
        <div className="flex items-center justify-between">
          {/* Botão Anterior */}
          <AppButton 
            variant="gray"
            onClick={handlePrevious}
            disabled={clients.length <= 1}
            className="flex items-center gap-2 px-6"
          >
            <ArrowLeft size={18} />
            Anterior
          </AppButton>
          
          {/* Indicador Central */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {currentIndex + 1} de {clients.length}
            </p>
            <p className="text-xs text-gray-400">
              {currentClient.company_name || currentClient.name}
            </p>
          </div>
          
          {/* Botão Próximo */}
          <AppButton 
            variant="gray"
            onClick={handleNext}
            disabled={clients.length <= 1}
            className="flex items-center gap-2 px-6"
          >
            Próximo
            <ArrowRight size={18} />
          </AppButton>
        </div>
        
        {/* Botão Voltar */}
        <div className="mt-3">
          <AppButton 
            variant="gray"
            fullWidth
            onClick={goBack}
            className="flex items-center justify-center gap-2"
          >
            <ChevronLeft size={18} />
            Voltar para Lista
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default ClientFullScreenView;
