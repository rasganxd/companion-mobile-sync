import React from 'react';
import { User, Building, Phone, MapPin, Hash, ArrowRight, FileText } from 'lucide-react';
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
interface ClientPageCardProps {
  client: Client;
  onSelect: (client: Client) => void;
  onViewOrder?: (client: Client) => void;
  onExportPDF?: (client: Client) => void;
}
const ClientPageCard: React.FC<ClientPageCardProps> = ({
  client,
  onSelect,
  onViewOrder,
  onExportPDF
}) => {
  const getStatusInfo = (client: Client) => {
    switch (client.status) {
      case 'positivado':
        return {
          color: 'tab-success-bg tab-success-text tab-success-border',
          text: 'Positivado',
          bgColor: 'tab-success-light'
        };
      case 'negativado':
        return {
          color: 'tab-error-bg tab-error-text tab-error-border',
          text: 'Negativado',
          bgColor: 'tab-error-light'
        };
      case 'pendente':
      default:
        return {
          color: client.hasLocalOrders || client.hasTransmittedOrders ? 'bg-blue-100 text-blue-800 border-blue-200' : 'tab-pending-bg tab-pending-text tab-pending-border',
          text: 'Pendente',
          bgColor: 'tab-pending-light'
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
  return <Card className={`${statusInfo.bgColor} border-2 min-h-[400px]`}>
      <CardContent className="p-4 flex flex-col justify-between h-full">
        {/* Seção superior */}
        <div className="flex-1">
          {/* Header com código, botão PDF e status */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              {client.code && <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border">
                  <Hash className="h-3 w-3 text-gray-600" />
                  <span className="font-bold text-sm">{client.code}</span>
                </div>}
              {client.status === 'positivado' && onExportPDF && <button onClick={() => onExportPDF(client)} className="bg-white p-1.5 rounded border hover:bg-gray-50 transition-colors" title="Exportar PDF do pedido">
                  <FileText className="h-3 w-3 text-red-600" />
                </button>}
            </div>
            <div className={`px-3 py-1 rounded border text-xs font-medium ${statusInfo.color}`}>
              {statusInfo.text}
            </div>
          </div>

          {/* Nome da empresa/cliente - mais compacto */}
          <div className="text-center mb-4">
            <h2 className="text-xs text-gray-600">
              {client.company_name || client.name}
            </h2>
            {client.company_name && client.name && <p className="font-bold text-gray-900 mb-1 text-sm">
                Nome Fantasia: {client.name}
              </p>}
          </div>

          {/* Seção reservada para valor do pedido - sempre presente */}
          <div className="text-center mb-4 h-16 flex items-center justify-center">
            {client.status === 'positivado' && client.orderTotal && client.orderTotal > 0 ? <div>
                <div className="text-xl font-bold text-green-600">
                  {formatCurrency(client.orderTotal)}
                </div>
                <div className="text-xs text-gray-600">Valor total dos pedidos</div>
              </div> : <div className="h-full"></div>}
          </div>

          {/* Informações de contato e endereço - unificadas em uma única div */}
          {(client.address || client.neighborhood || client.city || client.phone) && <div className="p-2 bg-white rounded border mb-4 space-y-3">
              {/* Endereço */}
              {(client.address || client.neighborhood || client.city) && <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Endereço</p>
                    <div className="text-sm font-medium">
                      {client.address && <p className="text-xs">{client.address}</p>}
                      {(client.neighborhood || client.city) && <p className="text-xs">
                          {client.neighborhood}
                          {client.neighborhood && client.city && ', '}
                          {client.city}
                        </p>}
                    </div>
                  </div>
                </div>}
              
              {/* Telefone */}
              {client.phone && <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-500">Telefone</p>
                    <p className="font-medium text-xs">{client.phone}</p>
                  </div>
                </div>}
            </div>}
        </div>

        {/* Seção de botões - altura fixa no final */}
        <div className="space-y-2 h-20 flex flex-col justify-end">
          {client.status === 'positivado' ? <>
              {onViewOrder && <AppButton variant="blue" fullWidth onClick={() => onViewOrder(client)} className="text-sm py-2 flex items-center justify-center gap-2 bg-sky-700 hover:bg-sky-600">
                  Ver Pedido
                </AppButton>}
              <AppButton variant="blue" fullWidth onClick={() => onSelect(client)} className="text-sm py-2 flex items-center justify-center gap-2">
                <span>Mais Atividades</span>
                <ArrowRight size={16} />
              </AppButton>
            </> : <AppButton variant="blue" fullWidth onClick={() => onSelect(client)} className="text-sm py-2 flex items-center justify-center gap-2">
              <span>Iniciar Atividades</span>
              <ArrowRight size={16} />
            </AppButton>}
        </div>
      </CardContent>
    </Card>;
};
export default ClientPageCard;