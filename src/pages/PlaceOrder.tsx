
import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Search, RefreshCcw, ArrowLeft, ShoppingCart, Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import AppButton from '@/components/AppButton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";

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
  fantasyName: 'BAR DO NILSON',
};

// Mock clients data for search
const mockClients = [
  { id: 1223, name: 'NILSO ALVES FERREIRA', fantasyName: 'BAR DO NILSON' },
  { id: 1224, name: 'MARIA SILVA SOUZA', fantasyName: 'MERCADO CENTRAL' },
  { id: 1225, name: 'JOÃO CARLOS FERREIRA', fantasyName: 'RESTAURANTE BOM GOSTO' },
  { id: 1226, name: 'ANTONIO JOSE SANTOS', fantasyName: 'LANCHONETE DELICIA' },
  { id: 1227, name: 'CLARA OLIVEIRA ALMEIDA', fantasyName: 'SORVETERIA GELATO' },
];

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
  fantasyName: string;
}

const PlaceOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentProduct, setCurrentProduct] = useState(mockProducts[0]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [quantity, setQuantity] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('01 A VISTA');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client>(mockClient);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredClients, setFilteredClients] = useState<Client[]>(mockClients);
  
  // Filter clients based on search query
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    
    if (!value.trim()) {
      setFilteredClients(mockClients);
      return;
    }
    
    const lowercasedValue = value.toLowerCase();
    const filtered = mockClients.filter(
      client => 
        client.name.toLowerCase().includes(lowercasedValue) || 
        (client.fantasyName && client.fantasyName.toLowerCase().includes(lowercasedValue))
    );
    
    setFilteredClients(filtered);
  }, []);
  
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
    if (!currentProduct || !quantity || parseFloat(quantity) <= 0) {
      toast.error("Por favor, insira uma quantidade válida");
      return;
    }
    
    const existingItem = orderItems.find(item => item.productId === currentProduct.id);
    
    if (existingItem) {
      setOrderItems(orderItems.map(item => 
        item.productId === currentProduct.id 
          ? { ...item, quantity: item.quantity + parseFloat(quantity) } 
          : item
      ));
    } else {
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
    
    toast.success(`${quantity} ${currentProduct.unit} de ${currentProduct.name} adicionado`);
    setQuantity('');
  };
  
  const handleRemoveItem = (id: number) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
    toast.info("Item removido do pedido");
  };
  
  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  };
  
  const handleViewOrder = () => {
    if (orderItems.length === 0) {
      toast.error("Adicione pelo menos um item ao pedido");
      return;
    }
    navigate('/detalhes-pedido', { state: { orderItems, client: selectedClient, paymentMethod } });
  };
  
  const handleGoBack = () => {
    navigate('/clientes-lista');
  };

  const handleClientSearch = () => {
    setSearchQuery('');
    setFilteredClients(mockClients);
    setSearchOpen(true);
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setSearchOpen(false);
    toast.success(`Cliente ${client.name} selecionado`);
  };

  const handleFinishOrder = () => {
    if (orderItems.length === 0) {
      toast.error("Adicione pelo menos um item ao pedido");
      return;
    }
    
    // Here you would typically save the order to a database
    toast.success("Pedido finalizado com sucesso!");
    navigate('/clientes-lista');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header 
        title="Digitação de Pedidos"
        backgroundColor="blue"
        showBackButton
      />
      
      <div className="bg-app-blue text-white px-3 py-1 text-xs">
        <span className="font-semibold">{selectedClient.id}</span> - {selectedClient.name}
        {selectedClient.fantasyName && <span className="ml-1">({selectedClient.fantasyName})</span>}
      </div>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 p-3">
          <Card className="h-full">
            <CardContent className="p-3 flex flex-col h-full">
              <div className="bg-gray-100 p-2 rounded-md mb-3 flex items-center">
                <div className="bg-app-purple h-7 w-7 flex items-center justify-center mr-2 text-white rounded-full">
                  <span className="text-sm font-bold">1</span>
                </div>
                <div className="flex-1 font-bold text-app-blue text-sm truncate">
                  {currentProduct.name}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="bg-white">
                    <Label className="block mb-1 text-sm font-medium text-gray-700">Unidade:</Label>
                    <Select defaultValue={currentProduct.unit}>
                      <SelectTrigger className="h-9 w-full bg-white border border-gray-300 text-sm">
                        <SelectValue placeholder="Unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PT">PT - {currentProduct.unit}</SelectItem>
                        <SelectItem value="CX">CX - Caixa</SelectItem>
                        <SelectItem value="UN">UN - Unidade</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="block mb-1 text-sm font-medium text-gray-700">Tabela:</Label>
                    <Select defaultValue={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="h-9 w-full bg-white border border-gray-300 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="01 A VISTA">01 A VISTA</SelectItem>
                        <SelectItem value="02 PRAZO">02 PRAZO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="block mb-1 text-sm font-medium text-gray-700">Quantidade:</Label>
                      <div className="flex">
                        <Input 
                          type="number"
                          className="h-9 flex-1 border border-gray-300 text-sm"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                        />
                        <Button 
                          variant="default"
                          className="ml-2 w-9 h-9 bg-app-blue text-sm p-0"
                          onClick={handleAddItem}
                        >
                          E
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="block mb-1 text-sm font-medium text-gray-700">Valor:</Label>
                      <Input 
                        type="text" 
                        className="h-9 bg-white border border-gray-300 text-sm" 
                        value={currentProduct.price.toFixed(2)}
                        readOnly 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="block mb-1 text-sm font-medium text-gray-700">Navegação:</Label>
                    <div className="flex gap-1">
                      <Button 
                        variant="outline" 
                        className="flex-1 bg-gray-50 h-9 border border-gray-300 text-sm"
                        onClick={() => handleProductChange('first')}
                      >
                        &lt;&lt;
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 bg-gray-50 h-9 border border-gray-300 text-sm"
                        onClick={() => handleProductChange('prev')}
                      >
                        &lt;
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 bg-gray-50 h-9 border border-gray-300 text-sm"
                        onClick={handleClientSearch}
                      >
                        <Search size={14} className="mr-1" /> Con
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 bg-gray-50 h-9 border border-gray-300 text-sm"
                        onClick={() => handleProductChange('next')}
                      >
                        &gt;
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 bg-gray-50 h-9 border border-gray-300 text-sm"
                        onClick={() => handleProductChange('last')}
                      >
                        &gt;&gt;
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-3">
                      <Label className="block mb-1 text-sm font-medium text-gray-700">L</Label>
                      <div className="bg-gray-50 h-9 flex items-center justify-center border rounded-md border-gray-300 text-sm">L</div>
                    </div>
                    <div className="col-span-9">
                      <Label className="block mb-1 text-sm font-medium text-gray-700">Viagem:</Label>
                      <Input type="text" className="h-9 bg-white border border-gray-300 text-sm" value="1" readOnly />
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-800">
                      <div>
                        <span className="text-gray-600 font-medium">P. unit:</span>
                        <span className="ml-1">{currentProduct.unitPrice.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">Estq:</span>
                        <span className="ml-1">{currentProduct.stock}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">P. mín:</span>
                        <span className="ml-1">{currentProduct.minPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-white border-t">
          <div className="p-2">
            <div className="flex justify-between items-center mb-2 px-1">
              <h3 className="text-sm font-medium text-app-blue">Itens do Pedido ({orderItems.length})</h3>
              <div className="text-sm font-medium">
                Total: <span className="text-app-blue">{calculateTotal()}</span>
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
                        <TableCell className="py-0 text-xs p-1">{(item.price * item.quantity).toFixed(2)}</TableCell>
                        <TableCell className="py-0 p-0 text-xs">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-5 w-5 p-0 text-red-500"
                            onClick={() => handleRemoveItem(item.id)}
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
          
          <div className="p-2 grid grid-cols-3 gap-2 border-t">
            <AppButton 
              variant="blue" 
              className="flex items-center justify-center h-9 text-xs"
              onClick={handleGoBack}
            >
              <ArrowLeft size={14} className="mr-1" />
              Voltar
            </AppButton>
            
            <AppButton 
              variant="blue" 
              className="flex items-center justify-center h-9 text-xs"
              onClick={handleViewOrder}
              disabled={orderItems.length === 0}
            >
              <Eye size={14} className="mr-1" />
              Gravar
            </AppButton>
            
            <AppButton 
              variant="blue" 
              className="flex items-center justify-center h-9 text-xs"
              onClick={handleFinishOrder}
              disabled={orderItems.length === 0}
            >
              <ShoppingCart size={14} className="mr-1" />
              Finalizar
            </AppButton>
          </div>
        </div>
      </div>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Consultar Clientes</DialogTitle>
          </DialogHeader>
          <Command className="rounded-lg border shadow-md">
            <CommandInput 
              placeholder="Digite o nome do cliente..." 
              value={searchQuery}
              onValueChange={handleSearchChange}
            />
            <CommandList>
              <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
              <CommandGroup heading="Clientes">
                {filteredClients.map((client) => (
                  <CommandItem
                    key={client.id}
                    onSelect={() => handleSelectClient(client)}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{client.name}</span>
                      <span className="text-sm text-gray-500">{client.fantasyName}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlaceOrder;
