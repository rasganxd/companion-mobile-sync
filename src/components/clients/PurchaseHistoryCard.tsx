
import React from 'react';
import { Package, Calendar, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppButton from '@/components/AppButton';

interface PurchaseHistoryItem {
  id: string;
  code: number;
  date: string;
  total: number;
  status: string;
  itemsCount: number;
  source: 'orders' | 'mobile_orders';
}

interface PurchaseHistoryCardProps {
  purchase: PurchaseHistoryItem;
  onViewDetails: (purchaseId: string) => void;
}

const PurchaseHistoryCard: React.FC<PurchaseHistoryCardProps> = ({
  purchase,
  onViewDetails
}) => {
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', text: 'Pendente' };
      case 'processed':
        return { color: 'bg-blue-100 text-blue-800', text: 'Processado' };
      case 'delivered':
        return { color: 'bg-green-100 text-green-800', text: 'Entregue' };
      case 'cancelled':
        return { color: 'bg-red-100 text-red-800', text: 'Cancelado' };
      default:
        return { color: 'bg-gray-100 text-gray-800', text: status };
    }
  };

  const statusInfo = getStatusInfo(purchase.status);

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Package size={16} className="text-gray-500" />
              <span className="font-medium text-sm">
                Pedido #{purchase.code}
              </span>
              <Badge className={`text-xs ${statusInfo.color}`}>
                {statusInfo.text}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
              <Calendar size={12} />
              <span>{formatDate(purchase.date)}</span>
            </div>

            {purchase.itemsCount > 0 && (
              <div className="text-xs text-gray-500">
                {purchase.itemsCount} produto(s)
              </div>
            )}
          </div>

          <div className="text-right">
            <div className="font-bold text-green-600 mb-2">
              {formatCurrency(purchase.total)}
            </div>
            
            <AppButton 
              variant="blue"
              onClick={() => onViewDetails(purchase.id)}
              className="text-xs py-1 px-2 flex items-center gap-1"
            >
              <Eye size={12} />
              Ver Detalhes
            </AppButton>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PurchaseHistoryCard;
