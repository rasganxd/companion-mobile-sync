
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

interface OrderItemsTableProps {
  orderItems: OrderItem[];
  onRemoveItem: (id: number) => void;
  calculateTotal: () => string;
}

const OrderItemsTable: React.FC<OrderItemsTableProps> = ({
  orderItems,
  onRemoveItem,
  calculateTotal
}) => {
  return (
    <div className="bg-white border-t border-gray-200">
      <div className="p-3">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <Package size={16} className="mr-1 text-app-blue" />
            <h3 className="text-sm font-semibold text-app-blue">
              Itens ({orderItems.length})
            </h3>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-600">Total:</div>
            <div className="text-sm font-bold text-green-600">
              R$ {calculateTotal()}
            </div>
          </div>
        </div>
        
        <div className="h-24">
          <ScrollArea className="h-full">
            {orderItems.length > 0 ? (
              <div className="space-y-1">
                {orderItems.map((item) => (
                  <div key={item.id} className="bg-gray-50 p-2 rounded border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 mr-1">
                        <div className="font-medium text-xs text-gray-900 truncate">
                          {item.productName}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Qtd: {item.quantity} {item.unit} | R$ {(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => onRemoveItem(item.id)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Package size={20} className="mx-auto mb-1 text-gray-300" />
                <p className="text-xs">Nenhum item adicionado</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default OrderItemsTable;
