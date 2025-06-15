
import React from 'react';
import { User, Building, Phone, MapPin, Hash, ArrowRight, Store, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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

interface ClientPageCardProps {
  client: Client;
  onSelect: (client: Client) => void;
}

const ClientPageCard: React.FC<ClientPageCardProps> = ({
  client,
  onSelect
}) => {
  const getStatusInfo = (client: Client) => {
    const localInfo = client.hasLocalOrders ? ` (${client.localOrdersCount} local)` : '';
    const transmittedInfo = client.hasTransmittedOrders ? ` (${client.transmittedOrdersCount} transmitido)` : '';
    
    switch (client.status) {
      case 'positivado':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          text: `Positivado${localInfo}${transmittedInfo}`,
          bgColor: 'bg-green-50',
          icon: null
        };
      case 'negativado':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          text: `Negativado${localInfo}${transmittedInfo}`,
          bgColor: 'bg-red-50',
          icon: null
        };
      case 'pendente':
      default:
        return {
          color: client.hasLocalOrders || client.hasTransmittedOrders ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200',
          text: `Pendente${localInfo}${transmittedInfo}`,
          bgColor: 'bg-yellow-25',
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
    <Card className={`${statusInfo.bgColor} border-2 shadow-lg hover:shadow-xl transition-all duration-300`}>
      <CardContent className="p-5">
        {/* Header com código e status - mais elegante */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-2">
            {client.code && (
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border shadow-sm">
                <Hash className="h-4 w-4 text-gray-600" />
                <span className="font-bold text-sm">{client.code}</span>
              </div>
            )}
          </div>
          <div className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-xs font-medium shadow-sm ${statusInfo.color}`}>
            {statusInfo.icon}
            <span>{statusInfo.text}</span>
          </div>
        </div>

        {/* Ícone e nome da empresa - destaque visual */}
        <div className="text-center mb-5">
          <div className="flex justify-center mb-3">
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-full shadow-md">
              <Store className="h-8 w-8 text-app-blue" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {client.company_name || client.name}
          </h2>
          {client.company_name && client.name && (
            <p className="text-sm text-gray-600">
              Razão Social: {client.name}
            </p>
          )}
        </div>

        {/* Valor do pedido se positivado */}
        {client.status === 'positivado' && client.orderTotal && client.orderTotal > 0 && (
          <div className="text-center mb-5">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(client.orderTotal)}
            </div>
            <div className="text-sm text-gray-600">Valor total dos pedidos</div>
          </div>
        )}

        {/* Informações de contato e endereço - lista com ícones alinhados */}
        <div className="space-y-3 mb-6">
          {client.phone && (
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border shadow-sm">
              <Phone className="h-5 w-5 text-gray-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Telefone</p>
                <p className="font-medium text-sm">{client.phone}</p>
              </div>
            </div>
          )}
          
          {(client.address || client.city || client.state) && (
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border shadow-sm">
              <MapPin className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Endereço</p>
                <div className="text-sm font-medium">
                  {client.address && <p className="text-sm">{client.address}</p>}
                  {(client.city || client.state) && (
                    <p className="text-sm">
                      {client.city}
                      {client.city && client.state && ', '}
                      {client.state}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botão de ação - largura total com gradiente */}
        <AppButton 
          variant="blue" 
          fullWidth 
          onClick={() => onSelect(client)} 
          className="text-sm py-4 bg-gradient-to-r from-app-blue to-app-blue-dark hover:from-app-blue-dark hover:to-app-blue shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
        >
          <span>Iniciar Atividades</span>
          <ArrowRight size={18} />
        </AppButton>
      </CardContent>
    </Card>
  );
};

export default ClientPageCard;
