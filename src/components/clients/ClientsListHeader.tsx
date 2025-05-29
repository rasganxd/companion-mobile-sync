
import React from 'react';

interface SalesRep {
  id: string;
  name: string;
}

interface ClientsListHeaderProps {
  clientsCount: number;
  day: string;
  salesRep: SalesRep;
}

const ClientsListHeader: React.FC<ClientsListHeaderProps> = ({ 
  clientsCount, 
  day, 
  salesRep 
}) => {
  return (
    <div className="text-sm text-gray-600 mb-3">
      {clientsCount} cliente{clientsCount !== 1 ? 's' : ''} encontrado{clientsCount !== 1 ? 's' : ''} para {day} - {salesRep.name}
    </div>
  );
};

export default ClientsListHeader;
