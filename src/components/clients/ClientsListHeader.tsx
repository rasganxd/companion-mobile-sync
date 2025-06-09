
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
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">
            Lista de Clientes
          </h2>
        </div>
        <div className="text-sm text-gray-600">
          {clientsCount} de {totalClients} clientes
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Calendar size={16} />
          <span>Dia: {day}</span>
        </div>
        <div>
          <span>Vendedor: {salesRep.name}</span>
        </div>
      </div>
    </div>
  );
};

export default ClientsListHeader;
