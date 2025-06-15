
import React from 'react';
import { User, Phone, MapPin, Eye, Store, ArrowRight, Clock } from 'lucide-react';
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
          color: 'bg-green-100 text-green-800 border-green-200',
          text: `Positivado${localInfo}${transmittedInfo}`,
          icon: null
        };
      case 'negativado':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          text: `Negativado${localInfo}${transmittedInfo}`,
          icon: null
        };
      case 'pendente':
      default:
        return {
          color: (client.hasLocalOrders || client.hasTransmittedOrders) ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200',
          text: `Pendente${localInfo}${transmittedInfo}`,
          icon: <Clock className="h-3 w-3" />
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
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 hover:shadow-lg transition-all duration-300 hover:border-gray-300">
      <div className="flex items-start gap-4">
        <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-3 rounded-full flex-shrink-0 shadow-sm">
          <Store className="h-6 w-6 text-app-blue" />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Header com nome destacado e status */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 truncate mb-1">
                {client.company_name || client.name}
              </h3>
              {client.company_name && client.name && (
                <p className="text-sm text-gray-600 truncate">
                  Razão Social: {client.name}
                </p>
              )}
            </div>
            <div className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border ml-3 flex-shrink-0 ${statusInfo.color}`}>
              {statusInfo.icon}
              <span>{statusInfo.text}</span>
            </div>
          </div>

          {/* Code e informações financeiras */}
          <div className="flex items-center gap-4 mb-4">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
              Código: {client.code || 'N/A'}
            </span>
            {(client.status === 'positivado' && client.orderTotal && client.orderTotal > 0) && (
              <span className="text-sm text-green-600 font-semibold">
                {formatCurrency(client.orderTotal)}
              </span>
            )}
          </div>

          {/* Lista de contato e endereço com ícones alinhados */}
          <div className="space-y-3 mb-4">
            {client.phone && (
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="truncate">{client.phone}</span>
              </div>
            )}
            
            {(client.address || client.city || client.state) && (
              <div className="flex items-start gap-3 text-sm text-gray-700">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
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

          {/* Botões de ação */}
          <div className="flex gap-3">
            <AppButton 
              variant="blue"
              onClick={() => onSelect(client)}
              className="flex-1 text-sm py-3 bg-gradient-to-r from-app-blue to-app-blue-dark hover:from-app-blue-dark hover:to-app-blue shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              <span>Iniciar Atividades</span>
              <ArrowRight className="h-4 w-4" />
            </AppButton>
            <AppButton 
              variant="gray"
              onClick={() => onViewDetails(client)}
              className="px-4 py-3 hover:bg-gray-200 transition-colors duration-200"
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
