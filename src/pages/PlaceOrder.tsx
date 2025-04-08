
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="w-full bg-orange-500 py-4 px-4 flex items-center justify-center shadow-md">
        <h1 className="text-white text-xl font-semibold">
          Digitação de Pedidos
        </h1>
      </div>
      
      <div className="bg-gray-800 text-white p-2">
        {mockClient.id} - {mockClient.name}
      </div>
      
      <div className="flex-1 overflow-auto p-0">
        {/* Current Product */}
        <div className="bg-gray-200 p-2 flex items-center">
          <div className="bg-gray-300 h-10 w-10 flex items-center justify-center mr-2">
            <span className="text-lg font-bold">1</span>
          </div>
          <div className="flex-1 font-bold text-black">
            {currentProduct.name}
          </div>
        </div>
        
        {/* Unit Selection */}
        <div className="p-2 bg-gray-100">
          <Select defaultValue={currentProduct.unit}>
            <SelectTrigger className="w-60 bg-gray-200">
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
        <div className="flex p-1 gap-1 bg-gray-100">
          <Button 
            variant="outline" 
            className="flex-1 bg-gray-200 h-12"
            onClick={() => handleProductChange('first')}
          >
            &lt;&lt;
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 bg-gray-200 h-12"
            onClick={() => handleProductChange('prev')}
          >
            &lt;
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 bg-gray-200 h-12"
          >
            Consultar
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 bg-gray-200 h-12"
            onClick={() => handleProductChange('next')}
          >
            &gt;
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 bg-gray-200 h-12"
            onClick={() => handleProductChange('last')}
          >
            &gt;&gt;
          </Button>
        </div>
        
        {/* Payment and Quantity */}
        <div className="p-2 bg-gray-100">
          <div className="flex gap-2 mb-2">
            <div className="flex-1">
              <Label className="block mb-1 text-sm">Tabela:</Label>
              <Select defaultValue={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full bg-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="01 A VISTA">01 A VISTA</SelectItem>
                  <SelectItem value="02 PRAZO">02 PRAZO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-16">
              <Label className="block mb-1 text-sm">L</Label>
              <div className="bg-gray-200 h-10 flex items-center justify-center border rounded-md">L</div>
            </div>
            <div className="w-20">
              <Label className="block mb-1 text-sm">Viagem:</Label>
              <Input type="text" className="bg-white" value="1" readOnly />
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="block mb-1 text-sm">Quantidade:</Label>
              <div className="flex">
                <Input 
                  type="number"
                  className="flex-1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                <Button 
                  variant="outline" 
                  className="ml-1 w-10 bg-gray-300"
                  onClick={handleAddItem}
                >
                  E
                </Button>
              </div>
            </div>
            <div className="flex-1">
              <Label className="block mb-1 text-sm">Valor:</Label>
              <Input 
                type="text" 
                className="bg-white" 
                value={currentProduct.price.toFixed(2)}
                readOnly 
              />
            </div>
          </div>
        </div>
        
        {/* Product Details */}
        <div className="bg-green-100 p-2">
          <h3 className="text-center text-green-800 font-medium mb-2">Detalhes do Produto</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-sm">Preço unitário:</Label>
              <span className="ml-2">{currentProduct.unitPrice.toFixed(2)}</span>
            </div>
            <div>
              <Label className="text-sm">% Neg:</Label>
              <span className="ml-2">15.39</span>
            </div>
            <div>
              <Label className="text-sm">Preço mínimo:</Label>
              <span className="ml-2">{currentProduct.minPrice.toFixed(2)}</span>
            </div>
            <div>
              <Label className="text-sm">% MKP:</Label>
              <span className="ml-2">15.39</span>
            </div>
            <div>
              <Label className="text-sm">Preço + AF:</Label>
              <span className="ml-2">0.00</span>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-100 p-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-sm">Vol. Emb.:</Label>
              <span className="ml-2">1</span>
            </div>
            <div>
              <Label className="text-sm">Últ. compra:</Label>
              <span className="ml-2">-</span>
            </div>
            <div>
              <Label className="text-sm">Estoque:</Label>
              <span className="ml-2">{currentProduct.stock} {currentProduct.unit}</span>
            </div>
          </div>
        </div>
        
        {/* Order Items */}
        <div className="bg-blue-100 p-2">
          <h3 className="text-center text-blue-800 font-medium mb-2">Itens do Pedido</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-1 text-xs">Código</TableHead>
                  <TableHead className="py-1 text-xs">Descrição</TableHead>
                  <TableHead className="py-1 text-xs">Qtd</TableHead>
                  <TableHead className="py-1 text-xs">Un</TableHead>
                  <TableHead className="py-1 text-xs">Valor</TableHead>
                  <TableHead className="py-1 text-xs">Tab</TableHead>
                  <TableHead className="py-1 text-xs">Vg</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-blue-50">
                    <TableCell className="py-1 text-xs">{item.code}</TableCell>
                    <TableCell className="py-1 text-xs">{item.productName}</TableCell>
                    <TableCell className="py-1 text-xs">{item.quantity}</TableCell>
                    <TableCell className="py-1 text-xs">{item.unit}</TableCell>
                    <TableCell className="py-1 text-xs">{(item.price * item.quantity).toFixed(2)}</TableCell>
                    <TableCell className="py-1 text-xs">1</TableCell>
                    <TableCell className="py-1 text-xs">1</TableCell>
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
        <div className="bg-blue-100 p-2 border-t border-blue-200">
          <h3 className="text-center text-blue-800 font-medium mb-2">Totais</h3>
          <div className="flex justify-between">
            <div className="text-sm">
              <span className="font-semibold">T. Bruto: </span>
              {calculateTotal()}
            </div>
            <div className="text-sm">
              <span className="font-semibold">T. Líqu: </span>
              {calculateTotal()}
            </div>
            <div className="text-sm">
              <span className="font-semibold">% OP: </span>
              0.00
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-100 p-2 grid grid-cols-3 gap-2">
        <Button 
          variant="outline" 
          className="bg-gray-200 h-16 flex flex-col items-center justify-center"
          onClick={handleGoBack}
        >
          <div className="w-8 h-8 bg-blue-400 flex items-center justify-center mb-1">
            <span className="text-white text-xl">⚙️</span>
          </div>
          <span className="text-xs">Opções</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="bg-gray-200 h-16 flex flex-col items-center justify-center"
        >
          <div className="w-8 h-8 bg-green-500 flex items-center justify-center mb-1">
            <span className="text-white text-xl">🛒</span>
          </div>
          <span className="text-xs">Gravar</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="bg-gray-200 h-16 flex flex-col items-center justify-center"
          onClick={handleFinishOrder}
          disabled={orderItems.length === 0}
        >
          <div className="w-8 h-8 bg-orange-500 flex items-center justify-center mb-1">
            <ShoppingCart size={18} className="text-white" />
          </div>
          <span className="text-xs">Fin. Pedido</span>
        </Button>
      </div>
    </div>
  );
};

export default PlaceOrder;
