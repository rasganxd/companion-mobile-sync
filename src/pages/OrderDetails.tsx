
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import AppButton from '@/components/AppButton';
import { ArrowLeft, Check, X, WifiOff } from 'lucide-react';
import { OrderRepository } from '@/lib/sync';
import { toast } from 'sonner';

interface OrderItem {
  id: number;
  productId: number | string;
  productName: string;
  quantity: number;
  price: number;
  code: string;
  unit: string;
}

interface Client {
  id: number | string;
  name: string;
  fantasyName?: string;
}

const OrderDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderItems, client, paymentMethod, offline } = location.state as {
    orderItems: OrderItem[];
    client: Client;
    paymentMethod: string;
    offline?: boolean;
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  };

  const handleCancel = () => {
    // Go back to order entry screen
    navigate(-1);
  };

  const handleConfirm = async () => {
    try {
      // Save order to local database
      const orderData = {
        client_id: client.id.toString(),
        sales_rep_id: "1", // Mock sales rep ID
        order_date: new Date().toISOString(),
        payment_method: paymentMethod,
        total: parseFloat(calculateTotal()),
        status: 'Pendente'
      };
      
      const orderItems_ = orderItems.map(item => ({
        product_id: item.productId.toString(),
        product_name: item.productName,
        quantity: item.quantity,
        price: item.price,
        code: item.code,
        unit: item.unit
      }));
      
      await OrderRepository.createOrder(orderData, orderItems_);
      
      if (offline) {
        toast.success("Pedido salvo localmente. Será sincronizado quando online.");
      } else {
        toast.success("Pedido salvo com sucesso!");
      }
      
      navigate('/clientes-lista');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error("Erro ao salvar pedido: " + error.message);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header 
        title="Confirmar Pedido" 
        backgroundColor="blue"
        showBackButton
      />
      
      <div className="bg-app-blue text-white px-3 py-1 text-xs flex justify-between items-center">
        <div>
          <span className="font-semibold">{client.id}</span> - {client.name}
        </div>
        
        {offline && (
          <div className="flex items-center text-orange-300 text-xs">
            <WifiOff size={12} className="mr-1" /> Offline
          </div>
        )}
      </div>
      
      <div className="flex flex-col flex-1 p-3 gap-3 overflow-hidden">
        <Card className="flex-1 overflow-hidden">
          <CardContent className="p-0 h-full flex flex-col">
            <div className="bg-app-blue text-white p-2">
              <h3 className="text-sm font-medium text-center">Detalhes do Pedido</h3>
            </div>
            
            <div className="p-2 border-b">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-medium text-gray-600">Forma de Pagamento:</span>
                  <span className="ml-1">{paymentMethod}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Data:</span>
                  <span className="ml-1">{new Date().toLocaleDateString('pt-BR')}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Total:</span>
                  <span className="ml-1 text-app-blue font-bold">R$ {calculateTotal()}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Itens:</span>
                  <span className="ml-1">{orderItems.length}</span>
                </div>
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              <Table>
                <TableHeader className="bg-gray-50 sticky top-0">
                  <TableRow>
                    <TableHead className="py-1 text-xs font-medium text-gray-700 p-2">Código</TableHead>
                    <TableHead className="py-1 text-xs font-medium text-gray-700 p-2">Produto</TableHead>
                    <TableHead className="py-1 text-xs font-medium text-gray-700 p-2">Qtd</TableHead>
                    <TableHead className="py-1 text-xs font-medium text-gray-700 p-2">Un</TableHead>
                    <TableHead className="py-1 text-xs font-medium text-gray-700 p-2">Valor</TableHead>
                    <TableHead className="py-1 text-xs font-medium text-gray-700 p-2">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="py-2 text-xs">{item.code}</TableCell>
                      <TableCell className="py-2 text-xs">{item.productName}</TableCell>
                      <TableCell className="py-2 text-xs">{item.quantity}</TableCell>
                      <TableCell className="py-2 text-xs">{item.unit}</TableCell>
                      <TableCell className="py-2 text-xs">R$ {item.price.toFixed(2)}</TableCell>
                      <TableCell className="py-2 text-xs">R$ {(item.price * item.quantity).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            
            <div className="bg-gray-50 p-3 border-t">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium">Total do Pedido:</div>
                <div className="text-app-blue font-bold text-xl">R$ {calculateTotal()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-2 gap-3">
          <AppButton 
            variant="gray" 
            className="flex items-center justify-center h-10"
            onClick={handleCancel}
          >
            <X size={16} className="mr-2" />
            Cancelar
          </AppButton>
          
          <AppButton 
            variant="blue" 
            className="flex items-center justify-center h-10"
            onClick={handleConfirm}
          >
            <Check size={16} className="mr-2" />
            Confirmar
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
