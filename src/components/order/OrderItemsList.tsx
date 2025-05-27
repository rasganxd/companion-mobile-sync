
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Trash2, Package } from 'lucide-react';

interface OrderItem {
  id: number;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  code: string;
  unit: string;
}

interface OrderItemsListProps {
  orderItems: OrderItem[];
  onRemoveItem: (id: number) => void;
  calculateTotal: () => string;
}

const OrderItemsList: React.FC<OrderItemsListProps> = ({
  orderItems,
  onRemoveItem,
  calculateTotal
}) => {
  return (
    <div className="bg-white border-t border-gray-200 flex-shrink-0">
      <div className="p-1.5">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center">
            <Package size={12} className="mr-1 text-app-blue" />
            <h3 className="text-xs font-semibold text-app-blue">
              Itens ({orderItems.length})
            </h3>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-600">Total:</div>
            <div className="text-xs font-bold text-green-600">
              R$ {calculateTotal()}
            </div>
          </div>
        </div>
        
        <div className="h-16">
          <ScrollArea className="h-full">
            {orderItems.length > 0 ? (
              <div className="space-y-1">
                {orderItems.map((item) => (
                  <div key={item.id} className="bg-gray-50 p-1 rounded border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 mr-1">
                        <div className="font-medium text-xs text-gray-900 truncate">
                          {item.productName}
                        </div>
                        <div className="text-xs text-gray-500">
                          Qtd: {item.quantity} {item.unit}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-4 w-4 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => onRemoveItem(item.id)}
                      >
                        <Trash2 size={8} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2 text-gray-500">
                <Package size={14} className="mx-auto mb-1 text-gray-300" />
                <p className="text-xs">Nenhum item adicionado</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default OrderItemsList;
