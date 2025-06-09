
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
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Lista de Clientes
            </h1>
            <p className="text-sm text-gray-600">
              {clientsCount} de {totalClients} clientes
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span className="capitalize">{day}</span>
          <span>•</span>
          <span>{salesRep.name}</span>
        </div>
      </div>
    </div>
  );
};

export default ClientsListHeader;
