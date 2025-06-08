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
  return;
};
export default ClientsListHeader;