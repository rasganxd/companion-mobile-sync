
import React from 'react';
import { Users, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">{day}</h2>
        </div>
        <Badge variant="outline" className="text-sm">
          {clientsCount} de {totalClients}
        </Badge>
      </div>
      
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Users className="h-4 w-4" />
        <span>Vendedor: {salesRep.name}</span>
      </div>
    </div>
  );
};

export default ClientsListHeader;
