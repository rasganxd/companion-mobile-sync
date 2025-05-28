
import React from 'react';
import { Eye, Trash2, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LocalOrder } from '@/types/order';
import { useAppNavigation } from '@/hooks/useAppNavigation';

interface OrderCardProps {
  order: LocalOrder;
  showDeleteButton?: boolean;
  showRetryButton?: boolean;
  onDelete?: (orderId: string) => void;
  onRetry?: (orderId: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  showDeleteButton = false,
  showRetryButton = false,
  onDelete,
  onRetry
}) => {
  const { navigateTo } = useAppNavigation();

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number): string => {
    return `R$ ${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSyncStatusColor = (syncStatus: string): string => {
    switch (syncStatus) {
      case 'pending_sync': return 'bg-orange-100 text-orange-800';
      case 'transmitted': return 'bg-blue-100 text-blue-800';
      case 'synced': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSyncStatusLabel = (syncStatus: string): string => {
    switch (syncStatus) {
      case 'pending_sync': return 'Pendente';
      case 'transmitted': return 'Transmitido';
      case 'synced': return 'Sincronizado';
      case 'error': return 'Erro';
      default: return syncStatus;
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-2">
          <div className="min-w-0 flex-1">
            <h4 className="font-medium truncate">{order.customer_name}</h4>
            <p className="text-sm text-gray-500">
              Pedido #{order.id?.substring(0, 8)} • {formatDate(order.date)}
            </p>
          </div>
          <div className="text-right flex-shrink-0 ml-2">
            <div className="flex flex-wrap gap-1 mb-1 justify-end">
              <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                {order.status}
              </Badge>
              <Badge className={`text-xs ${getSyncStatusColor(order.sync_status)}`}>
                {getSyncStatusLabel(order.sync_status)}
              </Badge>
            </div>
            <p className="font-bold">{formatCurrency(order.total)}</p>
          </div>
        </div>
        
        {order.reason && (
          <p className="text-sm text-red-600 mb-2 italic">
            Motivo: {order.reason}
          </p>
        )}
        
        {order.notes && (
          <p className="text-sm text-gray-600 mb-2 italic">
            "{order.notes}"
          </p>
        )}
        
        {order.items && order.items.length > 0 && (
          <p className="text-xs text-gray-500 mb-2">
            {order.items.length} produto(s)
          </p>
        )}
        
        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateTo(`/order-details/${order.id}`)}
            className="text-xs"
          >
            <Eye size={14} className="mr-1" />
            Ver Detalhes
          </Button>
          
          {showRetryButton && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRetry(order.id)}
              className="text-xs"
            >
              <RotateCcw size={14} className="mr-1" />
              Tentar Novamente
            </Button>
          )}
          
          {showDeleteButton && onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(order.id)}
              className="text-xs"
            >
              <Trash2 size={14} className="mr-1" />
              Excluir
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCard;
