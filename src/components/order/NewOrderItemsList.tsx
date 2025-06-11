import React from 'react';
import { Button } from '@/components/ui/button';
interface OrderItem {
  id: number;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  code: string;
  unit: string;
}
interface NewOrderItemsListProps {
  orderItems: OrderItem[];
  onRemoveItem: (itemId: number) => void;
}
const NewOrderItemsList: React.FC<NewOrderItemsListProps> = ({
  orderItems,
  onRemoveItem
}) => {
  if (orderItems.length === 0) return null;
  return <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b py-[9px]">
        <h3 className="font-semibold text-gray-900 text-sm">Itens do Pedido ({orderItems.length})</h3>
      </div>
      <div className="p-4">
        <div className="space-y-2">
          {orderItems.map(item => <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded border">
              <div className="flex-1">
                <div className="font-semibold text-sm">{item.code} - {item.productName}</div>
                <div className="text-sm text-gray-600">
                  {item.quantity} {item.unit} × R$ {item.price.toFixed(2)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-green-600">
                  R$ {(item.quantity * item.price).toFixed(2)}
                </span>
                <Button variant="destructive" size="sm" onClick={() => onRemoveItem(item.id)}>
                  ×
                </Button>
              </div>
            </div>)}
        </div>
      </div>
    </div>;
};
export default NewOrderItemsList;