import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronLeft, User, Building, Phone, MapPin, Hash } from 'lucide-react';
import Header from '@/components/Header';
import AppButton from '@/components/AppButton';
import { Card, CardContent } from '@/components/ui/card';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import UnnegateClientModal from '@/components/clients/UnnegateClientModal';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { toast } from 'sonner';

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
  const {
    goBack
  } = useAppNavigation();
  const {
    clients,
    initialIndex = 0,
    day
  } = location.state || {
    clients: [],
    initialIndex: 0,
    day: 'Segunda'
  };
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showUnnegateModal, setShowUnnegateModal] = useState(false);
  const [isUnnegating, setIsUnnegating] = useState(false);
  const [currentClients, setCurrentClients] = useState(clients);
  
  useEffect(() => {
    if (!clients || clients.length === 0) {
      goBack();
    }
  }, [clients, goBack]);
  
  if (!clients || clients.length === 0) {
    return null;
  }
  
  const currentClient = currentClients[currentIndex];
  
  const handlePrevious = () => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : clients.length - 1);
  };
  
  const handleNext = () => {
    setCurrentIndex(prev => prev < clients.length - 1 ? prev + 1 : 0);
  };
  
  const handleStartActivity = () => {
    // Se cliente está negativado, oferecer opção de desnegativar
    if (currentClient.status === 'negativado' || currentClient.status === 'Negativado') {
      setShowUnnegateModal(true);
      return;
    }
    
    navigate('/client-activities', {
      state: {
        clientName: currentClient.company_name || currentClient.name,
        clientId: currentClient.id,
        day: day
      }
    });
  };
  
  const handleUnnegateClient = async (reason: string) => {
    try {
      setIsUnnegating(true);
      const db = getDatabaseAdapter();
      
      await db.unnegateClient(currentClient.id, reason);
      
      // Atualizar cliente na lista local
      const updatedClients = [...currentClients];
      updatedClients[currentIndex] = {
        ...currentClient,
        status: 'pendente'
      };
      setCurrentClients(updatedClients);
      
      toast.success(`Cliente ${currentClient.name} foi reativado com sucesso!`);
      setShowUnnegateModal(false);
      
      // Agora proceder com atividades
      setTimeout(() => {
        navigate('/client-activities', {
          state: {
            clientName: currentClient.company_name || currentClient.name,
            clientId: currentClient.id,
            day: day
          }
        });
      }, 500);
      
    } catch (error) {
      console.error('Error unnegating client:', error);
      toast.error('Erro ao reativar cliente');
    } finally {
      setIsUnnegating(false);
    }
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
          color: client.hasLocalOrders || client.hasTransmittedOrders ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-100 text-gray-800 border-gray-200',
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
        title={`Cliente ${currentIndex + 1} de ${currentClients.length}`} 
        showBackButton 
        backgroundColor="blue" 
      />
      
      <div className="bg-app-blue text-white px-3 py-1 text-xs">
        <span className="font-semibold">{day}</span> - Visualização Detalhada
      </div>
      
      <div className="flex-1 p-4 flex flex-col overflow-y-auto">
        {/* Card Principal do Cliente - Redimensionado */}
        <Card className="max-h-[calc(100vh-280px)] overflow-y-auto">
          <CardContent className="p-4">
            {/* Header do Cliente - Compactado */}
            <div className="text-center mb-4">
              <h2 className="mb-1 text-sm font-medium text-zinc-700">
                {currentClient.company_name || currentClient.name}
              </h2>
              
              {currentClient.company_name && currentClient.name && (
                <p className="mb-2 text-sm font-bold text-zinc-950">
                  Razão Social: {currentClient.name}
                </p>
              )}
              
              <div className={`inline-block px-3 py-1 rounded-lg border text-sm ${statusInfo.color}`}>
                <span className="font-medium">{statusInfo.text}</span>
              </div>
              
              {currentClient.status === 'positivado' && currentClient.orderTotal && currentClient.orderTotal > 0 && (
                <div className="mt-2 text-xl font-bold text-green-600">
                  {formatCurrency(currentClient.orderTotal)}
                </div>
              )}
            </div>
            
            {/* Informações Detalhadas - Compactadas */}
            <div className="space-y-3">
              {currentClient.code && (
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <Hash className="h-4 w-4 text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-600">Código</p>
                    <p className="text-sm font-medium">{currentClient.code}</p>
                  </div>
                </div>
              )}
              
              {currentClient.phone && (
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <Phone className="h-4 w-4 text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-600">Telefone</p>
                    <p className="text-sm font-medium">{currentClient.phone}</p>
                  </div>
                </div>
              )}
              
              {(currentClient.address || currentClient.city || currentClient.state) && (
                <div className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                  <MapPin className="h-4 w-4 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-600">Endereço</p>
                    <div className="text-sm font-medium">
                      {currentClient.address && <p>{currentClient.address}</p>}
                      {(currentClient.city || currentClient.state) && <p>
                          {currentClient.city}
                          {currentClient.city && currentClient.state && ', '}
                          {currentClient.state}
                        </p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Botão de Ação Principal - Separado do card */}
        <div className="mt-4">
          <AppButton 
            variant={currentClient.status === 'negativado' || currentClient.status === 'Negativado' ? 'orange' : 'blue'} 
            fullWidth 
            onClick={handleStartActivity} 
            className="text-base py-3"
          >
            {(currentClient.status === 'negativado' || currentClient.status === 'Negativado') 
              ? 'Reativar Cliente' 
              : 'Iniciar Atividades'
            }
          </AppButton>
        </div>
      </div>
      
      {/* Navegação Inferior - Reorganizada */}
      <div className="p-4 bg-white border-t space-y-3">
        {/* Navegação Entre Clientes */}
        <div className="flex items-center justify-between">
          <AppButton variant="gray" onClick={handlePrevious} disabled={clients.length <= 1} className="flex items-center gap-1 px-4 py-2">
            <ArrowLeft size={16} />
            <span className="text-sm">Anterior</span>
          </AppButton>
          
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">
              {currentIndex + 1} de {currentClients.length}
            </p>
            <p className="text-xs text-gray-500 truncate max-w-32">
              {currentClient.company_name || currentClient.name}
            </p>
          </div>
          
          <AppButton variant="gray" onClick={handleNext} disabled={clients.length <= 1} className="flex items-center gap-1 px-4 py-2">
            <span className="text-sm">Próximo</span>
            <ArrowRight size={16} />
          </AppButton>
        </div>
        
        {/* Botão Voltar */}
        <AppButton variant="gray" fullWidth onClick={goBack} className="flex items-center justify-center gap-2 py-2">
          <ChevronLeft size={16} />
          <span className="text-sm">Voltar</span>
        </AppButton>
      </div>
      
      <UnnegateClientModal
        isOpen={showUnnegateModal}
        onClose={() => setShowUnnegateModal(false)}
        onConfirm={handleUnnegateClient}
        clientName={currentClient?.company_name || currentClient?.name || ''}
        isLoading={isUnnegating}
      />
    </div>
  );
};

export default ClientFullScreenView;
