
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface OrderSummaryCardProps {
  pendingCount: number;
  transmittedCount: number;
}

const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({ 
  pendingCount, 
  transmittedCount 
}) => {
  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
            <p className="text-sm text-gray-600">Pedidos Pendentes</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{transmittedCount}</p>
            <p className="text-sm text-gray-600">Pedidos Transmitidos</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderSummaryCard;
