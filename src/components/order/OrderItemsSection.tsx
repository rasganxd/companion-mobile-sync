
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface OrderItem {
  id: number;
  productId: string;
  productName: string;
  code: number;
  quantity: number;
  price: number;
  unit: string;
}

interface OrderItemsSectionProps {
  orderItems: OrderItem[];
  onRemoveItem: (itemId: number) => void;
  getTotalValue: () => number;
}

const OrderItemsSection: React.FC<OrderItemsSectionProps> = ({
  orderItems,
  onRemoveItem,
  getTotalValue
}) => {
  if (orderItems.length === 0) return null;

  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-4">
        <Label className="text-sm font-medium text-gray-600 block mb-3">
          Itens do Pedido ({orderItems.length}):
        </Label>
        <div className="space-y-2 mb-4">
          {orderItems.map(item => (
            <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded border">
              <div className="flex-1">
                <p className="font-medium text-sm">{item.productName}</p>
                <p className="text-gray-600 text-xs">
                  {item.quantity} {item.unit} × R$ {item.price.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-green-600 text-sm">
                  R$ {(item.quantity * item.price).toFixed(2)}
                </span>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => onRemoveItem(item.id)} 
                  className="text-sm"
                >
                  ×
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t pt-3">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-base">Total do Pedido:</span>
            <span className="font-bold text-blue-600 text-base">
              R$ {getTotalValue().toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderItemsSection;
