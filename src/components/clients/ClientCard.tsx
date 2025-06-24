
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
  neighborhood?: string;
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
  onViewOrder?: (client: Client) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({
  client,
  onSelect,
  onViewDetails,
  onViewOrder
}) => {
  const getStatusInfo = (client: Client) => {
    switch (client.status) {
      case 'positivado':
        return {
          color: 'bg-green-100 text-green-800',
          text: 'Positivado'
        };
      case 'negativado':
        return {
          color: 'bg-red-100 text-red-800',
          text: 'Negativado'
        };
      case 'pendente':
      default:
        return {
          color: client.hasLocalOrders || client.hasTransmittedOrders ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800',
          text: 'Pendente'
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
    <div className="bg-white rounded-lg shadow p-4 py-[12px] px-[12px]">
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
            {client.status === 'positivado' && client.orderTotal && client.orderTotal > 0 && (
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
            
            {(client.address || client.neighborhood || client.city) && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  {client.address && <p className="truncate">{client.address}</p>}
                  {(client.neighborhood || client.city) && (
                    <p className="truncate">
                      {client.neighborhood}
                      {client.neighborhood && client.city && ', '}
                      {client.city}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {client.status === 'positivado' ? (
              <>
                <AppButton 
                  variant="green" 
                  onClick={() => onViewOrder && onViewOrder(client)} 
                  className="flex-1 text-sm py-[6px] text-center flex items-center justify-center gap-1"
                >
                  <Eye size={14} />
                  Ver Pedido
                </AppButton>
                <AppButton 
                  variant="blue" 
                  onClick={() => onSelect(client)} 
                  className="flex-1 text-sm py-[6px] text-center"
                >
                  Mais Atividades
                </AppButton>
              </>
            ) : (
              <AppButton 
                variant="blue" 
                onClick={() => onSelect(client)} 
                className="flex-1 text-sm py-[6px] text-center"
              >
                Iniciar Atividades
              </AppButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientCard;
