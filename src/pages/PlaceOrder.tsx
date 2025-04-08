
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, ShoppingCart, ArrowLeft, Search } from 'lucide-react';
import AppButton from '@/components/AppButton';

// Mock product data
const mockProducts = [
  { id: 1, name: 'Produto 1', price: 10.50, code: 'P001' },
  { id: 2, name: 'Produto 2', price: 25.75, code: 'P002' },
  { id: 3, name: 'Produto 3', price: 15.30, code: 'P003' },
  { id: 4, name: 'Produto 4', price: 5.99, code: 'P004' },
  { id: 5, name: 'Produto 5', price: 8.25, code: 'P005' },
];

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

const PlaceOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  
  // Filter products by search term
  const filteredProducts = mockProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleAddItem = () => {
    if (!selectedProduct) return;
    
    const product = mockProducts.find(p => p.id === selectedProduct);
    if (!product) return;
    
    // Check if product is already in the order
    const existingItem = orderItems.find(item => item.productId === product.id);
    
    if (existingItem) {
      // Update quantity of existing item
      setOrderItems(orderItems.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + quantity } 
          : item
      ));
    } else {
      // Add new item
      const newItem: OrderItem = {
        id: Date.now(), // Generate a temporary id
        productId: product.id,
        productName: product.name,
        quantity: quantity,
        price: product.price
      };
      
      setOrderItems([...orderItems, newItem]);
    }
    
    // Reset selection
    setSelectedProduct(null);
    setQuantity(1);
  };
  
  const handleRemoveItem = (id: number) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };
  
  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  };
  
  const handleSaveOrder = () => {
    // Here you would typically save the order to a database
    // For now, just show a success message and go back
    alert("Pedido salvo com sucesso!");
    navigate('/menu');
  };
  
  const handleGoBack = () => {
    navigate('/menu');
  };
  
  const handleSelectProduct = (id: number) => {
    setSelectedProduct(id);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="Fazer Pedidos" backgroundColor="blue" />
      
      <div className="p-3 flex-1 overflow-auto">
        {/* Search Bar */}
        <div className="mb-4 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
            <Input 
              placeholder="Buscar produto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        {/* Products */}
        <Card className="mb-4">
          <CardContent className="p-2">
            <div className="text-sm font-semibold p-2">Produtos</div>
            <div className="max-h-48 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow 
                      key={product.id} 
                      className={selectedProduct === product.id ? "bg-blue-100" : ""}
                      onClick={() => handleSelectProduct(product.id)}
                    >
                      <TableCell>{product.code}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>R$ {product.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleSelectProduct(product.id)}
                          className="p-1 h-auto"
                        >
                          <Plus size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                        Nenhum produto encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        {/* Add Product Form */}
        {selectedProduct && (
          <Card className="mb-4">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="text-sm font-medium mb-1">
                    {mockProducts.find(p => p.id === selectedProduct)?.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    R$ {mockProducts.find(p => p.id === selectedProduct)?.price.toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  <Button onClick={handleAddItem} size="sm">
                    Adicionar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Order Items */}
        <Card className="mb-4">
          <CardContent className="p-2">
            <div className="flex justify-between items-center p-2">
              <div className="text-sm font-semibold">Itens do Pedido</div>
              <div className="text-sm font-medium">Total: R$ {calculateTotal()}</div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>R$ {item.price.toFixed(2)}</TableCell>
                      <TableCell>R$ {(item.price * item.quantity).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 h-auto text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {orderItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                        Nenhum item adicionado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="p-3 bg-white border-t space-y-2">
        <button 
          onClick={handleSaveOrder}
          className="w-full py-3 bg-app-blue text-white rounded-lg flex items-center justify-center gap-2"
          disabled={orderItems.length === 0}
        >
          <ShoppingCart size={18} />
          <span>Finalizar Pedido</span>
        </button>
        
        <AppButton 
          fullWidth
          onClick={handleGoBack}
          variant="gray"
          className="flex justify-center items-center gap-2"
        >
          <ArrowLeft size={18} />
          <span>Voltar</span>
        </AppButton>
      </div>
    </div>
  );
};

export default PlaceOrder;
