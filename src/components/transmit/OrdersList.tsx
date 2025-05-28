
import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LocalOrder } from '@/types/order';
import OrderCard from './OrderCard';
import EmptyOrdersState from './EmptyOrdersState';

interface OrdersListProps {
  orders: LocalOrder[];
  isLoading: boolean;
  showDeleteButton: boolean;
  onDeleteOrder?: (orderId: string) => void;
  emptyStateType: 'pending' | 'transmitted';
}

const OrdersList: React.FC<OrdersListProps> = ({
  orders,
  isLoading,
  showDeleteButton,
  onDeleteOrder,
  emptyStateType
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
          <p>Carregando pedidos...</p>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return <EmptyOrdersState type={emptyStateType} />;
  }

  return (
    <div className="space-y-4">
      {orders.map(order => (
        <OrderCard
          key={order.id}
          order={order}
          showDeleteButton={showDeleteButton}
          onDelete={onDeleteOrder}
        />
      ))}
    </div>
  );
};

export default OrdersList;
