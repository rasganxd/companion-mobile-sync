import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Search, RefreshCcw, ArrowLeft, ShoppingCart } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import AppButton from '@/components/AppButton';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock product data
const mockProducts = [
  { id: 1, name: 'VINHO COLONIAL BORDO SECO 2L', price: 65.00, code: 'P001', unitPrice: 10.83, minPrice: 55.00, stock: 0, unit: 'PT' },
  { id: 2, name: 'CERVEJA LATA 350ML', price: 4.50, code: 'P002', unitPrice: 3.75, minPrice: 4.00, stock: 24, unit: 'UN' },
  { id: 3, name: 'ÁGUA MINERAL COM GÁS 500ML', price: 2.50, code: 'P003', unitPrice: 1.95, minPrice: 2.20, stock: 36, unit: 'UN' },
  { id: 4, name: 'REFRIGERANTE COLA 2L', price: 8.90, code: 'P004', unitPrice: 7.50, minPrice: 8.00, stock: 12, unit: 'UN' },
  { id: 5, name: 'SUCO DE LARANJA 1L', price: 6.75, code: 'P005', unitPrice: 5.50, minPrice: 6.00, stock: 8, unit: 'UN' },
];

// Mock client
const mockClient = {
  id: 1223,
  name: 'NILSO ALVES FERREIRA',
};

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  code: string;
  unit: string;
}

const PlaceOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentProduct, setCurrentProduct] = useState(mockProducts[0]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [quantity, setQuantity] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('01 A VISTA');
  
  const handleProductChange = (direction: 'prev' | 'next' | 'first' | 'last') => {
    const currentIndex = mockProducts.findIndex(p => p.id === currentProduct.id);
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
    } else if (direction === 'next') {
      newIndex = currentIndex < mockProducts.length - 1 ? currentIndex + 1 : currentIndex;
    } else if (direction === 'first') {
      newIndex = 0;
    } else if (direction === 'last') {
      newIndex = mockProducts.length - 1;
    }
    
    setCurrentProduct(mockProducts[newIndex]);
  };
  
  const handleAddItem = () => {
    if (!currentProduct || !quantity || parseFloat(quantity) <= 0) return;
    
    // Check if product is already in the order
    const existingItem = orderItems.find(item => item.productId === currentProduct.id);
    
    if (existingItem) {
      // Update quantity of existing item
      setOrderItems(orderItems.map(item => 
        item.productId === currentProduct.id 
          ? { ...item, quantity: item.quantity + parseFloat(quantity) } 
          : item
      ));
    } else {
      // Add new item
      const newItem: OrderItem = {
        id: Date.now(),
        productId: currentProduct.id,
        productName: currentProduct.name,
        quantity: parseFloat(quantity),
        price: currentProduct.price,
        code: currentProduct.code,
        unit: currentProduct.unit
      };
      
      setOrderItems([...orderItems, newItem]);
    }
    
    // Reset quantity
    setQuantity('');
  };
  
  const handleRemoveItem = (id: number) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };
  
  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  };
  
  const handleFinishOrder = () => {
    // Here you would typically save the order to a database
    // For now, just show a success message and go back
    alert("Pedido finalizado com sucesso!");
    navigate('/menu');
  };
  
  const handleGoBack = () => {
    navigate('/menu');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header 
        title="Digitação de Pedidos"
        backgroundColor="blue"
        showBackButton
      />
      
      <div className="bg-app-blue text-white px-3 py-1 text-sm">
        <span className="font-semibold">{mockClient.id}</span> - {mockClient.name}
      </div>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="grid grid-cols-12 gap-1 flex-1 overflow-hidden">
          {/* Left column - Product selection and details */}
          <div className="col-span-5 flex flex-col overflow-hidden">
            {/* Current Product */}
            <div className="bg-gray-100 p-2 flex items-center">
              <div className="bg-app-purple h-8 w-8 flex items-center justify-center mr-2 text-white rounded-full">
                <span className="text-sm font-bold">1</span>
              </div>
              <div className="flex-1 font-bold text-app-blue text-sm truncate">
                {currentProduct.name}
              </div>
            </div>
            
            {/* Unit Selection */}
            <div className="px-2 py-1 bg-white">
              <Select defaultValue={currentProduct.unit}>
                <SelectTrigger className="h-8 w-full bg-gray-50 border border-gray-200 text-xs">
                  <SelectValue placeholder="Unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PT">PT - {currentProduct.unit}</SelectItem>
                  <SelectItem value="CX">CX - Caixa</SelectItem>
                  <SelectItem value="UN">UN - Unidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex p-1 gap-1 bg-white">
              <Button 
                variant="outline" 
                className="flex-1 bg-gray-50 h-8 border border-gray-200 text-xs px-1"
                onClick={() => handleProductChange('first')}
              >
                &lt;&lt;
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 bg-gray-50 h-8 border border-gray-200 text-xs px-1"
                onClick={() => handleProductChange('prev')}
              >
                &lt;
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 bg-gray-50 h-8 border border-gray-200 text-xs px-1"
              >
                <Search size={12} className="mr-1" /> Con
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 bg-gray-50 h-8 border border-gray-200 text-xs px-1"
                onClick={() => handleProductChange('next')}
              >
                &gt;
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 bg-gray-50 h-8 border border-gray-200 text-xs px-1"
                onClick={() => handleProductChange('last')}
              >
                &gt;&gt;
              </Button>
            </div>
            
            {/* Payment and Quantity */}
            <div className="p-2 bg-white grid grid-cols-12 gap-1">
              <div className="col-span-6">
                <Label className="block mb-1 text-xs font-medium text-gray-700">Tabela:</Label>
                <Select defaultValue={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-8 w-full bg-gray-50 border border-gray-200 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="01 A VISTA">01 A VISTA</SelectItem>
                    <SelectItem value="02 PRAZO">02 PRAZO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="block mb-1 text-xs font-medium text-gray-700">L</Label>
                <div className="bg-gray-50 h-8 flex items-center justify-center border rounded-md border-gray-200 text-xs">L</div>
              </div>
              <div className="col-span-4">
                <Label className="block mb-1 text-xs font-medium text-gray-700">Viagem:</Label>
                <Input type="text" className="h-8 bg-white border border-gray-200 text-xs" value="1" readOnly />
              </div>
            </div>
            
            <div className="grid grid-cols-12 gap-2 p-2 bg-white">
              <div className="col-span-7">
                <Label className="block mb-1 text-xs font-medium text-gray-700">Quantidade:</Label>
                <div className="flex">
                  <Input 
                    type="number"
                    className="h-8 flex-1 border border-gray-200 text-xs"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                  <Button 
                    variant="default"
                    className="ml-1 w-8 h-8 bg-app-blue text-xs p-0"
                    onClick={handleAddItem}
                  >
                    E
                  </Button>
                </div>
              </div>
              <div className="col-span-5">
                <Label className="block mb-1 text-xs font-medium text-gray-700">Valor:</Label>
                <Input 
                  type="text" 
                  className="h-8 bg-gray-50 border border-gray-200 text-xs" 
                  value={currentProduct.price.toFixed(2)}
                  readOnly 
                />
              </div>
            </div>
            
            {/* Product Details */}
            <div className="bg-blue-50 p-2">
              <h3 className="text-center text-app-blue text-xs font-medium mb-1">Detalhes do Produto</h3>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div>
                  <Label className="text-xs text-gray-600">Preço unitário:</Label>
                  <span className="ml-1 font-medium">{currentProduct.unitPrice.toFixed(2)}</span>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">% Neg:</Label>
                  <span className="ml-1 font-medium">15.39</span>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Preço mínimo:</Label>
                  <span className="ml-1 font-medium">{currentProduct.minPrice.toFixed(2)}</span>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">% MKP:</Label>
                  <span className="ml-1 font-medium">15.39</span>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Preço + AF:</Label>
                  <span className="ml-1 font-medium">0.00</span>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Estoque:</Label>
                  <span className="ml-1 font-medium">{currentProduct.stock} {currentProduct.unit}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column - Order items */}
          <div className="col-span-7 flex flex-col overflow-hidden">
            <Card className="flex flex-col h-full overflow-hidden border">
              <div className="bg-app-blue text-white py-1 px-2">
                <h3 className="text-center text-white text-sm font-medium">Itens do Pedido</h3>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-1">
                  <Table>
                    <TableHeader className="bg-gray-50 sticky top-0">
                      <TableRow>
                        <TableHead className="py-1 text-xs font-medium text-gray-700">Código</TableHead>
                        <TableHead className="py-1 text-xs font-medium text-gray-700">Descrição</TableHead>
                        <TableHead className="py-1 text-xs font-medium text-gray-700">Qtd</TableHead>
                        <TableHead className="py-1 text-xs font-medium text-gray-700">Un</TableHead>
                        <TableHead className="py-1 text-xs font-medium text-gray-700">Valor</TableHead>
                        <TableHead className="py-1 text-xs font-medium text-gray-700">Tab</TableHead>
                        <TableHead className="py-1 text-xs w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((item) => (
                        <TableRow key={item.id} className="hover:bg-gray-50">
                          <TableCell className="py-1 text-xs">{item.code}</TableCell>
                          <TableCell className="py-1 text-xs">{item.productName}</TableCell>
                          <TableCell className="py-1 text-xs">{item.quantity}</TableCell>
                          <TableCell className="py-1 text-xs">{item.unit}</TableCell>
                          <TableCell className="py-1 text-xs">{(item.price * item.quantity).toFixed(2)}</TableCell>
                          <TableCell className="py-1 text-xs">1</TableCell>
                          <TableCell className="py-1 p-0 text-xs">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 text-red-500"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <Trash2 size={12} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {orderItems.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-2 text-gray-500 text-xs">
                            Nenhum item adicionado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            
              {/* Order Totals */}
              <div className="bg-gray-50 p-2 border-t mt-auto">
                <div className="flex justify-between text-xs">
                  <div>
                    <span className="font-semibold">T. Bruto: </span>
                    <span className="text-app-blue font-bold">{calculateTotal()}</span>
                  </div>
                  <div>
                    <span className="font-semibold">T. Líqu: </span>
                    <span className="text-app-blue font-bold">{calculateTotal()}</span>
                  </div>
                  <div>
                    <span className="font-semibold">% OP: </span>
                    <span className="text-app-blue font-bold">0.00</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
        
        {/* Footer Buttons */}
        <div className="bg-white p-2 grid grid-cols-3 gap-2 border-t">
          <AppButton 
            variant="blue" 
            className="flex items-center justify-center h-10 text-xs"
            onClick={handleGoBack}
          >
            <ArrowLeft size={14} className="mr-1" />
            Voltar
          </AppButton>
          
          <AppButton 
            variant="blue" 
            className="flex items-center justify-center h-10 text-xs"
          >
            <RefreshCcw size={14} className="mr-1" />
            Gravar
          </AppButton>
          
          <AppButton 
            variant="blue" 
            className="flex items-center justify-center h-10 text-xs"
            onClick={handleFinishOrder}
            disabled={orderItems.length === 0}
          >
            <ShoppingCart size={14} className="mr-1" />
            Finalizar
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default PlaceOrder;
