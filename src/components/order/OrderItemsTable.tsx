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
    <div className="bg-white border-t-2 border-gray-200">
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            <Package size={18} className="mr-2 text-app-blue" />
            <h3 className="text-base font-semibold text-app-blue">
              Itens do Pedido ({orderItems.length})
            </h3>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Total:</div>
            <div className="text-lg font-bold text-green-600">
              R$ {calculateTotal()}
            </div>
          </div>
        </div>
        
        <div className="h-32">
          <ScrollArea className="h-full">
            {orderItems.length > 0 ? (
              <div className="space-y-2">
                {orderItems.map((item) => (
                  <div key={item.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 mr-2">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {item.productName}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Código: {item.code} | Qtd: {item.quantity} {item.unit}
                        </div>
                        <div className="text-sm font-medium text-app-blue mt-1">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => onRemoveItem(item.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package size={24} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Nenhum item adicionado</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default OrderItemsTable;
