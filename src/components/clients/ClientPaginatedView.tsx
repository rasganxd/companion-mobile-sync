import React from 'react';
import { ChevronLeft, ChevronRight, List, User } from 'lucide-react';
import AppButton from '@/components/AppButton';
import ClientPageCard from './ClientPageCard';
import ClientPageNavigation from './ClientPageNavigation';
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
    return <div className="space-y-4">
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
      </div>;
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
  return <div className="space-y-4">
      {/* Header com alternância de visualização */}
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-base">
          Cliente {currentPage + 1} de {clients.length}
        </h3>
        <AppButton variant="gray" onClick={onToggleView} className="flex items-center gap-2 py-0">
          <List size={16} />
          <span className="text-sm">Ver Lista</span>
        </AppButton>
      </div>

      {/* Card do Cliente */}
      <ClientPageCard client={currentClient} onSelect={onClientSelect} />

      {/* Navegação */}
      <ClientPageNavigation currentPage={currentPage} totalPages={clients.length} onPrevious={handlePrevious} onNext={handleNext} clientName={currentClient.company_name || currentClient.name} />
    </div>;
};
export default ClientPaginatedView;