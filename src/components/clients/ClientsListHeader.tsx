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
  return <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-app-blue text-white p-2 rounded-full">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-base">
              {clientsCount === totalClients ? `${clientsCount} Cliente${clientsCount !== 1 ? 's' : ''}` : `${clientsCount} de ${totalClients} Cliente${totalClients !== 1 ? 's' : ''}`}
            </h2>
            <p className="text-sm text-gray-600">
              {salesRep.name} - {day}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="bg-blue-100 text-app-blue px-3 py-1 rounded-full text-sm font-medium">
            <Calendar className="h-4 w-4 inline mr-1" />
            {day}
          </div>
        </div>
      </div>
    </div>;
};
export default ClientsListHeader;