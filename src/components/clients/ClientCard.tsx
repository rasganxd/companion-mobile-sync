
import React from 'react';
import { User, Phone, MapPin, Eye } from 'lucide-react';
import AppButton from '@/components/AppButton';

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
  onViewDetails: (client: Client) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onSelect, onViewDetails }) => {
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
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-start gap-3">
        <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
          <User className="h-5 w-5 text-app-blue" />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Header with name and status */}
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {client.company_name || client.name}
              </h3>
              {client.company_name && client.name && (
                <p className="text-sm text-gray-600 truncate">
                  Razão Social: {client.name}
                </p>
              )}
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0 ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
          </div>

          {/* Code and financial info */}
          <div className="flex items-center gap-4 mb-2">
            <span className="text-xs text-gray-500">
              Código: {client.code || 'N/A'}
            </span>
            {(client.status === 'positivado' && client.orderTotal && client.orderTotal > 0) && (
              <span className="text-xs text-green-600 font-medium">
                {formatCurrency(client.orderTotal)}
              </span>
            )}
          </div>

          {/* Contact and address */}
          <div className="space-y-1 mb-3">
            {client.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-3 w-3" />
                <span className="truncate">{client.phone}</span>
              </div>
            )}
            
            {(client.address || client.city || client.state) && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  {client.address && (
                    <p className="truncate">{client.address}</p>
                  )}
                  {(client.city || client.state) && (
                    <p className="truncate">
                      {client.city}
                      {client.city && client.state && ', '}
                      {client.state}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <AppButton 
              variant="blue"
              onClick={() => onSelect(client)}
              className="flex-1 text-sm py-2"
            >
              Iniciar Atividades
            </AppButton>
            <AppButton 
              variant="gray"
              onClick={() => onViewDetails(client)}
              className="px-3 py-2"
            >
              <Eye className="h-4 w-4" />
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientCard;
