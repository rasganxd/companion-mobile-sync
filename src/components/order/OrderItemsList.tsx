
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
    <div className="bg-gradient-to-r from-white to-gray-50 border-t-2 border-gray-200 flex-shrink-0 shadow-lg">
      <div className="p-2">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <Package size={14} className="mr-2 text-app-blue" />
            <h3 className="text-sm font-bold text-app-blue">
              Itens ({orderItems.length})
            </h3>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-600 font-medium">Total:</div>
            <div className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-200">
              R$ {calculateTotal()}
            </div>
          </div>
        </div>
        
        <div className="h-16">
          <ScrollArea className="h-full">
            {orderItems.length > 0 ? (
              <div className="space-y-2">
                {orderItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-gradient-to-r from-gray-50 to-white p-2 rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.01]"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 mr-2">
                        <div className="font-semibold text-sm text-gray-900 truncate">
                          {item.productName}
                        </div>
                        <div className="text-xs text-gray-600 font-medium">
                          Qtd: {item.quantity} {item.unit} • R$ {(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full transition-all duration-200 transform hover:scale-110"
                        onClick={() => onRemoveItem(item.id)}
                      >
                        <Trash2 size={10} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Package size={20} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-medium">Nenhum item adicionado</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default OrderItemsList;
