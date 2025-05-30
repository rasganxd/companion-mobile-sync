import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2, ShoppingCart } from 'lucide-react';

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
  onFinishOrder: () => void;
}

const OrderItemsSection: React.FC<OrderItemsSectionProps> = ({
  orderItems,
  onRemoveItem,
  onFinishOrder
}) => {
  const getTotalValue = () => {
    return orderItems.reduce((total, item) => total + (item.quantity * item.price), 0);
  };

  if (orderItems.length === 0) return null;

  return (
    <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300 animate-scale-in">
      <CardContent className="p-4">
        <Label className="text-sm font-semibold text-gray-700 block mb-3 flex items-center gap-2">
          <ShoppingCart size={16} className="text-blue-600" />
          Itens do Pedido ({orderItems.length}):
        </Label>
        <div className="space-y-3 mb-4">
          {orderItems.map((item, index) => (
            <div 
              key={item.id} 
              className="flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 transform hover:scale-[1.02] animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-900 mb-1">{item.productName}</p>
                <p className="text-gray-600 text-xs flex items-center gap-1">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    {item.quantity} {item.unit}
                  </span>
                  <span className="text-gray-400">×</span>
                  <span className="font-medium">R$ {item.price.toFixed(2)}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-green-600 text-sm bg-green-50 px-3 py-1 rounded-full">
                  R$ {(item.quantity * item.price).toFixed(2)}
                </span>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => onRemoveItem(item.id)} 
                  className="text-sm h-8 w-8 p-0 hover:scale-110 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-200 pt-4 bg-gradient-to-r from-blue-50 to-indigo-50 -mx-4 -mb-4 p-4 rounded-b-lg">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-lg text-gray-800">Total do Pedido:</span>
            <span className="font-bold text-blue-600 text-xl bg-white px-4 py-2 rounded-full shadow-md">
              R$ {getTotalValue().toFixed(2)}
            </span>
          </div>
          
          <Button 
            onClick={onFinishOrder}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
            disabled={orderItems.length === 0}
          >
            <ShoppingCart size={18} className="mr-2" />
            Finalizar Pedido
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderItemsSection;
