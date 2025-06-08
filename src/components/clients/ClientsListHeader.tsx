
import React from 'react';
import { Users, Calendar } from 'lucide-react';

interface SalesRep {
  id: string;
  name: string;
}

interface ClientsListHeaderProps {
  clientsCount: number;
  totalClients: number;
  day: string;
  salesRep: SalesRep;
}

const ClientsListHeader: React.FC<ClientsListHeaderProps> = ({
  clientsCount,
  totalClients,
  day,
  salesRep
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="text-blue-600" size={24} />
          <div>
            <h2 className="font-semibold text-gray-900">
              {clientsCount} de {totalClients} clientes
            </h2>
            <p className="text-sm text-gray-600">{day}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="text-gray-500" size={20} />
          <span className="text-sm text-gray-700">{salesRep.name}</span>
        </div>
      </div>
    </div>
  );
};

export default ClientsListHeader;
