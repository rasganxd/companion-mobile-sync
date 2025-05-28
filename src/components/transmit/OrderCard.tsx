
import React from 'react';
import { Eye, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LocalOrder } from '@/types/order';
import { useAppNavigation } from '@/hooks/useAppNavigation';

interface OrderCardProps {
  order: LocalOrder;
  showDeleteButton?: boolean;
  onDelete?: (orderId: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  showDeleteButton = false, 
  onDelete 
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

  const getStatusColor = (status: string): "orange" | "gray" | "blue" | "purple" => {
    switch (status) {
      case 'pending': return 'orange';
      case 'processed': return 'blue';
      case 'cancelled': return 'gray';
      case 'delivered': return 'blue';
      default: return 'gray';
    }
  };

  const getSyncStatusColor = (syncStatus: string): "orange" | "gray" | "blue" | "purple" => {
    switch (syncStatus) {
      case 'pending_sync': return 'orange';
      case 'transmitted': return 'blue';
      case 'synced': return 'blue';
      case 'error': return 'gray';
      default: return 'gray';
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-medium">{order.customer_name}</h4>
            <p className="text-sm text-gray-500">
              Pedido #{order.id?.substring(0, 8)} • {formatDate(order.date)}
            </p>
            <p className="text-xs text-blue-600">
              Sync: {order.sync_status}
            </p>
          </div>
          <div className="text-right">
            <div className="flex gap-1 mb-1">
              <Badge variant="secondary" className={`bg-${getStatusColor(order.status)}-100 text-${getStatusColor(order.status)}-800`}>
                {order.status}
              </Badge>
              <Badge variant="secondary" className={`bg-${getSyncStatusColor(order.sync_status)}-100 text-${getSyncStatusColor(order.sync_status)}-800`}>
                {order.sync_status}
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
        
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateTo(`/order-details/${order.id}`)}
          >
            <Eye size={14} className="mr-1" />
            Ver Detalhes
          </Button>
          
          {showDeleteButton && onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(order.id)}
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
