
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Search, RefreshCcw, ArrowLeft, ArrowRight, ShoppingCart } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import AppButton from '@/components/AppButton';

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        title="Digitação de Pedidos"
        backgroundColor="blue"
        showBackButton
      />
      
      <div className="bg-app-blue text-white p-2">
        <span className="font-semibold">{mockClient.id}</span> - {mockClient.name}
      </div>
      
      <div className="flex-1 overflow-auto p-0">
        {/* Current Product */}
        <div className="bg-gray-100 p-3 flex items-center border-b">
          <div className="bg-app-purple h-10 w-10 flex items-center justify-center mr-2 text-white rounded-full">
            <span className="text-lg font-bold">1</span>
          </div>
          <div className="flex-1 font-bold text-app-blue">
            {currentProduct.name}
          </div>
        </div>
        
        {/* Unit Selection */}
        <div className="p-3 bg-white border-b">
          <Select defaultValue={currentProduct.unit}>
            <SelectTrigger className="w-60 bg-gray-50 border border-gray-200">
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
        <div className="flex p-2 gap-1 bg-white border-b">
          <Button 
            variant="outline" 
            className="flex-1 bg-gray-50 h-12 border border-gray-200"
            onClick={() => handleProductChange('first')}
          >
            &lt;&lt;
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 bg-gray-50 h-12 border border-gray-200"
            onClick={() => handleProductChange('prev')}
          >
            &lt;
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 bg-gray-50 h-12 border border-gray-200"
          >
            <Search size={16} className="mr-1" /> Consultar
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 bg-gray-50 h-12 border border-gray-200"
            onClick={() => handleProductChange('next')}
          >
            &gt;
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 bg-gray-50 h-12 border border-gray-200"
            onClick={() => handleProductChange('last')}
          >
            &gt;&gt;
          </Button>
        </div>
        
        {/* Payment and Quantity */}
        <div className="p-3 bg-white border-b">
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <Label className="block mb-1 text-sm font-medium text-gray-700">Tabela:</Label>
              <Select defaultValue={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full bg-gray-50 border border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="01 A VISTA">01 A VISTA</SelectItem>
                  <SelectItem value="02 PRAZO">02 PRAZO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-16">
              <Label className="block mb-1 text-sm font-medium text-gray-700">L</Label>
              <div className="bg-gray-50 h-10 flex items-center justify-center border rounded-md border-gray-200">L</div>
            </div>
            <div className="w-20">
              <Label className="block mb-1 text-sm font-medium text-gray-700">Viagem:</Label>
              <Input type="text" className="bg-white border border-gray-200" value="1" readOnly />
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="block mb-1 text-sm font-medium text-gray-700">Quantidade:</Label>
              <div className="flex">
                <Input 
                  type="number"
                  className="flex-1 border border-gray-200"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                <Button 
                  variant="default"
                  className="ml-1 w-10 bg-app-blue"
                  onClick={handleAddItem}
                >
                  E
                </Button>
              </div>
            </div>
            <div className="flex-1">
              <Label className="block mb-1 text-sm font-medium text-gray-700">Valor:</Label>
              <Input 
                type="text" 
                className="bg-gray-50 border border-gray-200" 
                value={currentProduct.price.toFixed(2)}
                readOnly 
              />
            </div>
          </div>
        </div>
        
        {/* Product Details */}
        <div className="bg-blue-50 p-3 border-b">
          <h3 className="text-center text-app-blue font-medium mb-2">Detalhes do Produto</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-sm text-gray-600">Preço unitário:</Label>
              <span className="ml-2 font-medium">{currentProduct.unitPrice.toFixed(2)}</span>
            </div>
            <div>
              <Label className="text-sm text-gray-600">% Neg:</Label>
              <span className="ml-2 font-medium">15.39</span>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Preço mínimo:</Label>
              <span className="ml-2 font-medium">{currentProduct.minPrice.toFixed(2)}</span>
            </div>
            <div>
              <Label className="text-sm text-gray-600">% MKP:</Label>
              <span className="ml-2 font-medium">15.39</span>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Preço + AF:</Label>
              <span className="ml-2 font-medium">0.00</span>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 p-3 border-b">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-sm text-gray-600">Vol. Emb.:</Label>
              <span className="ml-2 font-medium">1</span>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Últ. compra:</Label>
              <span className="ml-2 font-medium">-</span>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Estoque:</Label>
              <span className="ml-2 font-medium">{currentProduct.stock} {currentProduct.unit}</span>
            </div>
          </div>
        </div>
        
        {/* Order Items */}
        <div className="bg-white p-3 border-b">
          <h3 className="text-center text-app-blue font-medium mb-2">Itens do Pedido</h3>
          <div className="overflow-x-auto border rounded">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="py-2 text-xs font-medium text-gray-700">Código</TableHead>
                  <TableHead className="py-2 text-xs font-medium text-gray-700">Descrição</TableHead>
                  <TableHead className="py-2 text-xs font-medium text-gray-700">Qtd</TableHead>
                  <TableHead className="py-2 text-xs font-medium text-gray-700">Un</TableHead>
                  <TableHead className="py-2 text-xs font-medium text-gray-700">Valor</TableHead>
                  <TableHead className="py-2 text-xs font-medium text-gray-700">Tab</TableHead>
                  <TableHead className="py-2 text-xs font-medium text-gray-700">Vg</TableHead>
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
                    <TableCell className="py-1 text-xs">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 text-red-500"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {orderItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                      Nenhum item adicionado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {/* Order Totals */}
        <div className="bg-white p-3 border-b">
          <h3 className="text-center text-app-blue font-medium mb-2">Totais</h3>
          <div className="flex justify-between">
            <div className="text-sm">
              <span className="font-semibold">T. Bruto: </span>
              <span className="text-app-blue font-bold">{calculateTotal()}</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold">T. Líqu: </span>
              <span className="text-app-blue font-bold">{calculateTotal()}</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold">% OP: </span>
              <span className="text-app-blue font-bold">0.00</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-3 grid grid-cols-3 gap-2 shadow-inner">
        <AppButton 
          variant="blue" 
          className="flex flex-col items-center justify-center h-16"
          onClick={handleGoBack}
        >
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mb-1">
            <ArrowLeft size={18} className="text-app-blue" />
          </div>
          <span className="text-xs">Voltar</span>
        </AppButton>
        
        <AppButton 
          variant="blue" 
          className="flex flex-col items-center justify-center h-16"
        >
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mb-1">
            <RefreshCcw size={18} className="text-app-blue" />
          </div>
          <span className="text-xs">Gravar</span>
        </AppButton>
        
        <AppButton 
          variant="blue" 
          className="flex flex-col items-center justify-center h-16"
          onClick={handleFinishOrder}
          disabled={orderItems.length === 0}
        >
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mb-1">
            <ShoppingCart size={18} className="text-app-blue" />
          </div>
          <span className="text-xs">Finalizar</span>
        </AppButton>
      </div>
    </div>
  );
};

export default PlaceOrder;
