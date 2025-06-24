
import React from 'react';
import { ChevronLeft, ChevronRight, List, User, Eye } from 'lucide-react';
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
  neighborhood?: string;
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
  onViewOrder?: (client: Client) => void;
}

const ClientPaginatedView: React.FC<ClientPaginatedViewProps> = ({
  clients,
  currentPage,
  onPageChange,
  onClientSelect,
  onToggleView,
  onViewOrder
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

  const handlePrevious = () => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < clients.length - 1) {
      onPageChange(currentPage + 1);
    }
  };

  if (!currentClient) {
    return (
      <div className="text-center text-gray-500 py-8">
        <div className="text-lg">Nenhum cliente disponível</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Botão Ver Lista - separado */}
      <div className="flex justify-start">
        <AppButton
          variant="gray"
          onClick={onToggleView}
          className="flex items-center gap-2 px-[5px] py-[5px]"
        >
          <List size={16} />
          <span className="text-sm">Ver Lista</span>
        </AppButton>
      </div>

      {/* Card do cliente atual */}
      <ClientPageCard
        client={currentClient}
        onSelect={onClientSelect}
        onViewOrder={onViewOrder}
      />

      {/* Navegação entre clientes - agora embaixo */}
      <div className="flex items-center justify-center bg-white rounded-lg shadow p-3">
        <div className="flex items-center gap-3">
          <AppButton
            variant="gray"
            onClick={handlePrevious}
            disabled={currentPage === 0}
            className="p-2"
          >
            <ChevronLeft size={16} />
          </AppButton>
          
          <span className="text-sm font-medium text-gray-600">
            {currentPage + 1} de {clients.length}
          </span>
          
          <AppButton
            variant="gray"
            onClick={handleNext}
            disabled={currentPage === clients.length - 1}
            className="p-2"
          >
            <ChevronRight size={16} />
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default ClientPaginatedView;
