
import React from 'react';
import { User, Building, Phone, MapPin, Hash, ArrowRight } from 'lucide-react';
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

const ClientPageCard: React.FC<ClientPageCardProps> = ({ client, onSelect }) => {
  const getStatusInfo = (client: Client) => {
    const localInfo = client.hasLocalOrders ? ` (${client.localOrdersCount} local)` : '';
    const transmittedInfo = client.hasTransmittedOrders ? ` (${client.transmittedOrdersCount} transmitido)` : '';
    
    switch (client.status) {
      case 'positivado':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          text: `Positivado${localInfo}${transmittedInfo}`,
          bgColor: 'bg-green-50'
        };
      case 'negativado':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          text: `Negativado${localInfo}${transmittedInfo}`,
          bgColor: 'bg-red-50'
        };
      case 'pendente':
      default:
        return {
          color: client.hasLocalOrders || client.hasTransmittedOrders ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-100 text-gray-800 border-gray-200',
          text: `Em andamento${localInfo}${transmittedInfo}`,
          bgColor: 'bg-blue-50'
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
    <Card className={`${statusInfo.bgColor} border-2`}>
      <CardContent className="p-6">
        {/* Header com código e status */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            {client.code && (
              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border">
                <Hash className="h-4 w-4 text-gray-600" />
                <span className="font-bold text-lg">{client.code}</span>
              </div>
            )}
          </div>
          <div className={`px-4 py-2 rounded-lg border text-sm font-medium ${statusInfo.color}`}>
            {statusInfo.text}
          </div>
        </div>

        {/* Nome da empresa/cliente */}
        <div className="text-center mb-6">
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
          <div className="text-center mb-6">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(client.orderTotal)}
            </div>
            <div className="text-sm text-gray-600">Valor total dos pedidos</div>
          </div>
        )}

        {/* Informações de contato e endereço */}
        <div className="space-y-4 mb-6">
          {client.phone && (
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <Phone className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-xs text-gray-500">Telefone</p>
                <p className="font-medium">{client.phone}</p>
              </div>
            </div>
          )}
          
          {(client.address || client.city || client.state) && (
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border">
              <MapPin className="h-5 w-5 text-gray-600 mt-1" />
              <div>
                <p className="text-xs text-gray-500">Endereço</p>
                <div className="font-medium">
                  {client.address && <p>{client.address}</p>}
                  {(client.city || client.state) && (
                    <p>
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

        {/* Botão de ação */}
        <AppButton 
          variant="blue"
          fullWidth 
          onClick={() => onSelect(client)}
          className="text-base py-3 flex items-center justify-center gap-2"
        >
          <span>Iniciar Atividades</span>
          <ArrowRight size={18} />
        </AppButton>
      </CardContent>
    </Card>
  );
};

export default ClientPageCard;
