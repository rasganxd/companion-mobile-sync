
import React from 'react';
import { ChevronLeft, ChevronRight, List, User } from 'lucide-react';
import AppButton from '@/components/AppButton';
import ClientPageCard from './ClientPageCard';

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

interface ClientPaginatedViewProps {
  clients: Client[];
  currentPage: number;
  onPageChange: (page: number) => void;
  onClientSelect: (client: Client) => void;
  onToggleView: () => void;
}

const ClientPaginatedView: React.FC<ClientPaginatedViewProps> = ({
  clients,
  currentPage,
  onPageChange,
  onClientSelect,
  onToggleView
}) => {
  if (clients.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Nenhum cliente encontrado</h3>
            <AppButton variant="gray" onClick={onToggleView} className="flex items-center gap-2">
              <List size={16} />
              <span className="text-sm">Ver Lista</span>
            </AppButton>
          </div>
          <div className="text-center text-gray-500 py-8">
            <div className="text-sm">Nenhum cliente corresponde à busca</div>
          </div>
        </div>
      </div>
    );
  }

  const currentClient = clients[currentPage];

  // Encontrar próximo cliente pendente
  const findNextPendingClient = () => {
    for (let i = currentPage + 1; i < clients.length; i++) {
      if (clients[i].status === 'pendente') {
        return i;
      }
    }
    return null;
  };

  // Navegação inteligente
  const handlePrevious = () => {
    // Navegação anterior normal (permite ver visitados)
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    // Smart navigation: pular para próximo pendente
    const nextPendingIndex = findNextPendingClient();
    
    if (nextPendingIndex !== null) {
      onPageChange(nextPendingIndex);
    } else if (currentPage < clients.length - 1) {
      // Se não há mais pendentes, ir para o próximo normalmente
      onPageChange(currentPage + 1);
    }
  };

  // Verificar se existe próximo pendente
  const hasNextPending = findNextPendingClient() !== null;
  const hasNext = hasNextPending || currentPage < clients.length - 1;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Conteúdo principal */}
      <div className="flex-1 pb-24 space-y-4">
        {/* Header com alternância de visualização */}
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-sm">
            Cliente {currentPage + 1} de {clients.length}
            {currentClient.status !== 'pendente' && (
              <span className="ml-2 text-xs text-gray-500">
                ({currentClient.status === 'positivado' ? 'Positivado' : 'Negativado'})
              </span>
            )}
          </h3>
          <AppButton variant="gray" onClick={onToggleView} className="flex items-center gap-2 py-2">
            <List size={16} />
            <span className="text-sm">Ver Lista</span>
          </AppButton>
        </div>

        {/* Card do Cliente com animação */}
        <div className="animate-fade-in">
          <ClientPageCard client={currentClient} onSelect={onClientSelect} />
        </div>
      </div>

      {/* Navegação fixa na parte inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between gap-4">
            <AppButton 
              variant="gray" 
              onClick={handlePrevious} 
              disabled={currentPage === 0} 
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
              <span className="text-sm font-medium">Anterior</span>
            </AppButton>
            
            <div className="text-center flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {currentPage + 1} de {clients.length}
              </p>
              <p className="text-xs text-gray-600 truncate">
                {currentClient.company_name || currentClient.name}
              </p>
            </div>
            
            <AppButton 
              variant="blue" 
              onClick={handleNext} 
              disabled={!hasNext} 
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-app-blue to-app-blue-dark hover:from-app-blue-dark hover:to-app-blue shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-sm font-medium">Próximo</span>
              <ChevronRight size={18} />
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientPaginatedView;
