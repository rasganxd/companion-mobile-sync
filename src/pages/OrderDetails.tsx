
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import AppButton from '@/components/AppButton';
import { ArrowLeft, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  code: string;
  unit: string;
}

interface Client {
  id: number;
  name: string;
}

const OrderDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [redirecting, setRedirecting] = useState(false);
  
  // Create default state values
  const defaultState = {
    orderItems: [] as OrderItem[],
    client: { id: 0, name: 'Cliente não selecionado' } as Client,
    paymentMethod: 'Não definido'
  };
  
  // Use the state from location or default if not available
  const orderState = location.state || defaultState;
  
  // Safely destructure values with fallbacks
  const orderItems = orderState.orderItems || [];
  const client = orderState.client || defaultState.client;
  const paymentMethod = orderState.paymentMethod || defaultState.paymentMethod;
  
  // If there's no state, redirect to the order creation page
  useEffect(() => {
    if (!location.state && !redirecting) {
      setRedirecting(true);
      toast.error("Informações do pedido não encontradas");
      navigate('/fazer-pedidos');
    }
  }, [location.state, navigate, redirecting]);

  // If we're redirecting, don't render the full component
  if (redirecting) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <Header 
          title="Redirecionando..." 
          backgroundColor="blue"
          showBackButton
        />
        <div className="flex flex-col items-center justify-center flex-1">
          <p className="text-gray-500 mb-4">Informações do pedido não encontradas</p>
        </div>
      </div>
    );
  }

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  };

  const handleCancel = () => {
    // Go back to order entry screen
    navigate(-1);
  };

  const handleConfirm = () => {
    // Save the order and redirect to clients list
    // In a real app, this would send data to the server
    toast.success("Pedido salvo com sucesso!");
    navigate('/clientes-lista');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header 
        title="Confirmar Pedido" 
        backgroundColor="blue"
        showBackButton
      />
      
      <div className="bg-app-blue text-white px-3 py-1 text-xs">
        <span className="font-semibold">{client.id}</span> - {client.name}
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
                  {orderItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                        Nenhum item no pedido
                      </TableCell>
                    </TableRow>
                  )}
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
