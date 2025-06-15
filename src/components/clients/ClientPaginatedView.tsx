import React from 'react';
import { ChevronLeft, ChevronRight, List, User } from 'lucide-react';
import AppButton from '@/components/AppButton';
import ClientPageCard from './ClientPageCard';
import ClientPageNavigation from './ClientPageNavigation';
import { Client } from '@/types/visit-routes';

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
      <div className="space-y-4">
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
    <div className="space-y-4">
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
        <AppButton variant="gray" onClick={onToggleView} className="flex items-center gap-2 py-0">
          <List size={16} />
          <span className="text-sm">Ver Lista</span>
        </AppButton>
      </div>

      {/* Card do Cliente */}
      <ClientPageCard client={currentClient} onSelect={onClientSelect} />

      {/* Navegação */}
      <ClientPageNavigation 
        currentPage={currentPage} 
        totalPages={clients.length} 
        onPrevious={handlePrevious} 
        onNext={handleNext}
        clientName={currentClient.company_name || currentClient.name}
        hasNext={hasNext}
        hasPrevious={currentPage > 0}
      />
    </div>
  );
};

export default ClientPaginatedView;
