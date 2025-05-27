
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

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
    <div className="bg-white border-t">
      <div className="p-2">
        <div className="flex justify-between items-center mb-2 px-1">
          <h3 className="text-sm font-medium text-app-blue">Itens do Pedido ({orderItems.length})</h3>
          <div className="text-sm font-medium">
            Total: <span className="text-app-blue">R$ {calculateTotal()}</span>
          </div>
        </div>
        
        <div className="h-24">
          <ScrollArea className="h-full">
            <Table>
              <TableHeader className="bg-gray-50 sticky top-0">
                <TableRow>
                  <TableHead className="py-1 text-xs font-medium text-gray-700 p-1">Código</TableHead>
                  <TableHead className="py-1 text-xs font-medium text-gray-700 p-1">Descrição</TableHead>
                  <TableHead className="py-1 text-xs font-medium text-gray-700 p-1">Qtd</TableHead>
                  <TableHead className="py-1 text-xs font-medium text-gray-700 p-1">Valor</TableHead>
                  <TableHead className="py-1 text-xs w-6 p-0"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell className="py-0 text-xs p-1">{item.code}</TableCell>
                    <TableCell className="py-0 text-xs p-1 max-w-[120px] truncate">{item.productName}</TableCell>
                    <TableCell className="py-0 text-xs p-1">{item.quantity}</TableCell>
                    <TableCell className="py-0 text-xs p-1">R$ {(item.price * item.quantity).toFixed(2)}</TableCell>
                    <TableCell className="py-0 p-0 text-xs">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-5 w-5 p-0 text-red-500"
                        onClick={() => onRemoveItem(item.id)}
                      >
                        <Trash2 size={10} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {orderItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-2 text-gray-500 text-xs">
                      Nenhum item adicionado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default OrderItemsTable;
