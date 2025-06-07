
import React, { useState } from 'react';
import { Search } from 'lucide-react';
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
  onClientViewDetails: (clients: Client[], initialIndex: number) => void;
}

const ClientsListContent: React.FC<ClientsListContentProps> = ({
  loading,
  clients,
  day,
  salesRep,
  onClientSelect,
  onClientViewDetails
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.name.toLowerCase().includes(searchLower) ||
      (client.company_name && client.company_name.toLowerCase().includes(searchLower)) ||
      (client.phone && client.phone.includes(searchTerm)) ||
      (client.address && client.address.toLowerCase().includes(searchLower)) ||
      (client.city && client.city.toLowerCase().includes(searchLower)) ||
      (client.code && client.code.toString().includes(searchTerm))
    );
  });

  const handleViewDetails = (client: Client) => {
    const clientIndex = filteredClients.findIndex(c => c.id === client.id);
    onClientViewDetails(filteredClients, clientIndex);
  };

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
      <div className="space-y-4">
        <ClientsListHeader 
          clientsCount={filteredClients.length}
          totalClients={clients.length}
          day={day}
          salesRep={salesRep}
        />
        
        {/* Search bar */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, empresa, telefone, endereço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-app-blue focus:border-transparent"
            />
          </div>
        </div>
        
        {filteredClients.length > 0 ? (
          <div className="space-y-3">
            {filteredClients.map(client => (
              <ClientCard
                key={client.id}
                client={client}
                onSelect={onClientSelect}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <div className="text-lg mb-2">Nenhum cliente encontrado</div>
            <div className="text-sm">
              Nenhum cliente corresponde à busca "{searchTerm}"
            </div>
          </div>
        )}
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
