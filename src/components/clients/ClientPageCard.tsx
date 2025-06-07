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
  return <Card className={`${statusInfo.bgColor} border-2`}>
      <CardContent className="p-4">
        {/* Header com código e status - mais compacto */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            {client.code && <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border">
                <Hash className="h-3 w-3 text-gray-600" />
                <span className="font-bold text-base">{client.code}</span>
              </div>}
          </div>
          <div className={`px-3 py-1 rounded border text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.text}
          </div>
        </div>

        {/* Nome da empresa/cliente - mais compacto */}
        <div className="text-center mb-4">
          <h2 className="font-bold text-gray-900 mb-1 text-sm">
            {client.company_name || client.name}
          </h2>
          {client.company_name && client.name && <p className="text-xs text-gray-600">
              Razão Social: {client.name}
            </p>}
        </div>

        {/* Valor do pedido se positivado - mais compacto */}
        {client.status === 'positivado' && client.orderTotal && client.orderTotal > 0 && <div className="text-center mb-4">
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(client.orderTotal)}
            </div>
            <div className="text-xs text-gray-600">Valor total dos pedidos</div>
          </div>}

        {/* Informações de contato e endereço - layout otimizado */}
        <div className="space-y-2 mb-4">
          {client.phone && <div className="flex items-center gap-2 p-2 bg-white rounded border">
              <Phone className="h-4 w-4 text-gray-600" />
              <div>
                <p className="text-xs text-gray-500">Telefone</p>
                <p className="font-medium text-sm">{client.phone}</p>
              </div>
            </div>}
          
          {(client.address || client.city || client.state) && <div className="flex items-start gap-2 p-2 bg-white rounded border">
              <MapPin className="h-4 w-4 text-gray-600 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Endereço</p>
                <div className="text-sm font-medium">
                  {client.address && <p className="text-sm">{client.address}</p>}
                  {(client.city || client.state) && <p className="text-sm">
                      {client.city}
                      {client.city && client.state && ', '}
                      {client.state}
                    </p>}
                </div>
              </div>
            </div>}
        </div>

        {/* Botão de ação - mais compacto */}
        <AppButton variant="blue" fullWidth onClick={() => onSelect(client)} className="text-sm py-2 flex items-center justify-center gap-2">
          <span>Iniciar Atividades</span>
          <ArrowRight size={16} />
        </AppButton>
      </CardContent>
    </Card>;
};
export default ClientPageCard;