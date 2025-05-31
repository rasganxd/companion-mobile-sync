
import React from 'react';
import ClientCard from './ClientCard';
import ClientsListHeader from './ClientsListHeader';

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

interface SalesRep {
  id: string;
  name: string;
}

interface ClientsListContentProps {
  loading: boolean;
  clients: Client[];
  day: string;
  salesRep: SalesRep | null;
  onClientSelect: (client: Client) => void;
}

const ClientsListContent: React.FC<ClientsListContentProps> = ({
  loading,
  clients,
  day,
  salesRep,
  onClientSelect
}) => {
  if (loading) {
    return (
      <div className="text-center text-gray-500 py-8">
        <div className="text-lg">Carregando clientes...</div>
        <div className="text-sm mt-2">Buscando clientes para {day}</div>
      </div>
    );
  }

  if (clients.length > 0 && salesRep) {
    return (
      <div className="space-y-3">
        <ClientsListHeader 
          clientsCount={clients.length}
          day={day}
          salesRep={salesRep}
        />
        
        {clients.map(client => (
          <ClientCard
            key={client.id}
            client={client}
            onSelect={onClientSelect}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="text-center text-gray-500 py-8">
      <div className="text-lg mb-2">Nenhum cliente registrado</div>
      <div className="text-sm">
        Não há clientes cadastrados para {day} - {salesRep?.name || 'vendedor'}
      </div>
    </div>
  );
};

export default ClientsListContent;
