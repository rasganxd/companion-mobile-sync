
import React from 'react';
import { User } from 'lucide-react';

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

interface ClientCardProps {
  client: Client;
  onSelect: (client: Client) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onSelect }) => {
  const getStatusInfo = (client: Client) => {
    const localInfo = client.hasLocalOrders ? ` (${client.localOrdersCount} local)` : '';
    const transmittedInfo = client.hasTransmittedOrders ? ` (${client.transmittedOrdersCount} transmitido)` : '';
    
    switch (client.status) {
      case 'positivado':
        return {
          color: 'bg-green-100 text-green-800',
          text: `Positivado${localInfo}${transmittedInfo}`
        };
      case 'negativado':
        return {
          color: 'bg-red-100 text-red-800',
          text: `Negativado${localInfo}${transmittedInfo}`
        };
      case 'pendente':
      default:
        return {
          color: (client.hasLocalOrders || client.hasTransmittedOrders) ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800',
          text: `Pendente${localInfo}${transmittedInfo}`
        };
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const statusInfo = getStatusInfo(client);

  return (
    <div 
      className="bg-white rounded-lg shadow p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => onSelect(client)}
    >
      <div className="bg-blue-100 p-2 rounded-full">
        <User className="h-5 w-5 text-app-blue" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div className="font-medium">{client.company_name || client.name}</div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
        </div>
        {client.company_name && client.name && (
          <div className="text-sm text-gray-500">Razão Social: {client.name}</div>
        )}
        <div className="text-xs text-gray-400 mt-1">
          Código: {client.code || 'N/A'}
          {client.address && (
            <span className="ml-2">• {client.address}</span>
          )}
          {(client.status === 'positivado' && client.orderTotal && client.orderTotal > 0) && (
            <span className="ml-2 text-green-600 font-medium">
              • {formatCurrency(client.orderTotal)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientCard;
