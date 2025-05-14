import React, { useState, useCallback, useEffect } from 'react';
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
import { SyncStatus } from '@/lib/sync';
import { 
  ProductRepository, 
  ClientRepository, 
  OrderRepository,
  useConnectionStore,
  ConnectionStatus
} from '@/lib/sync';

// Temporary mock for sales rep ID
const MOCK_SALES_REP_ID = "1";
const MOCK_TOKEN = "mock-token";

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

const PlaceOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState<ProductRepository.Product[]>([]);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [currentProduct, setCurrentProduct] = useState<ProductRepository.Product | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [quantity, setQuantity] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('01 A VISTA');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredClients, setFilteredClients] = useState<ClientRepository.Client[]>([]);
  const connectionStatus = useConnectionStore(state => state.status);
  
  // Load products and initial client
  useEffect(() => {
    loadProducts();
    loadClients();
  }, []);
  
  // Load products from local database
  const loadProducts = async () => {
    try {
      const localProducts = await ProductRepository.getAllProducts();
      setProducts(localProducts);
      if (localProducts.length > 0) {
        setCurrentProduct(localProducts[0]);
        setCurrentProductIndex(0);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Erro ao carregar produtos');
    }
  };
  
  // Load clients from local database
  const loadClients = async () => {
    try {
      const localClients = await ClientRepository.getAllClients();
      setFilteredClients(localClients);
      
      // If client was passed through navigation, use it
      const clientFromNavigation = location.state?.client;
      if (clientFromNavigation) {
        setSelectedClient(clientFromNavigation);
      } else if (localClients.length > 0) {
        // Otherwise use the first client in the list
        setSelectedClient({
          id: localClients[0].id,
          name: localClients[0].name,
          fantasyName: localClients[0].fantasy_name
        });
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error('Erro ao carregar clientes');
    }
  };
  
  // Filter clients based on search query
  const handleSearchChange = useCallback(async (value: string) => {
    setSearchQuery(value);
    
    try {
      if (!value.trim()) {
        const allClients = await ClientRepository.getAllClients();
        setFilteredClients(allClients);
        return;
      }
      
      const results = await ClientRepository.searchClients(value);
      setFilteredClients(results);
    } catch (error) {
      console.error('Error searching clients:', error);
    }
  }, []);
  
  const handleProductChange = (direction: 'prev' | 'next' | 'first' | 'last') => {
    if (!products.length) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentProductIndex > 0 ? currentProductIndex - 1 : currentProductIndex;
    } else if (direction === 'next') {
      newIndex = currentProductIndex < products.length - 1 ? currentProductIndex + 1 : currentProductIndex;
    } else if (direction === 'first') {
      newIndex = 0;
    } else if (direction === 'last') {
      newIndex = products.length - 1;
    }
    
    setCurrentProductIndex(newIndex);
    setCurrentProduct(products[newIndex]);
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
    
    if (!selectedClient) {
      toast.error("Selecione um cliente");
      return;
    }
    
    navigate('/detalhes-pedido', { 
      state: { 
        orderItems, 
        client: selectedClient, 
        paymentMethod,
        offline: connectionStatus !== ConnectionStatus.ONLINE
      }
    });
  };
  
  const handleGoBack = () => {
    navigate('/clientes-lista');
  };

  const handleClientSearch = () => {
    setSearchQuery('');
    loadClients(); // Reload all clients when opening search
    setSearchOpen(true);
  };

  const handleSelectClient = (client: ClientRepository.Client) => {
    setSelectedClient({
      id: client.id,
      name: client.name,
      fantasyName: client.fantasy_name
    });
    setSearchOpen(false);
    toast.success(`Cliente ${client.name} selecionado`);
  };

  const handleFinishOrder = async () => {
    if (orderItems.length === 0) {
      toast.error("Adicione pelo menos um item ao pedido");
      return;
    }
    
    if (!selectedClient) {
      toast.error("Selecione um cliente");
      return;
    }
    
    try {
      // Save order to local database
      const orderData = {
        client_id: selectedClient.id.toString(),
        sales_rep_id: MOCK_SALES_REP_ID,
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
      
      toast.success("Pedido finalizado com sucesso!");
      
      // If online, attempt to sync immediately
      if (connectionStatus === ConnectionStatus.ONLINE) {
        try {
          const result = await OrderRepository.getUnsyncedOrders();
          if (result.length > 0) {
            toast.info("Sincronizando pedido...");
            // This would trigger a sync in a real app
          }
        } catch (error) {
          console.error('Error checking unsynced orders:', error);
        }
      } else {
        toast.info("Pedido salvo localmente e será sincronizado quando online");
      }
      
      navigate('/clientes-lista');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error("Erro ao finalizar pedido: " + error.message);
    }
  };
  
  // Show a message if no products or clients are loaded
  if (!currentProduct) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <Header 
          title="Digitação de Pedidos"
          backgroundColor="blue"
          showBackButton
        />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <p className="text-gray-500 mb-4">Carregando produtos...</p>
          <Button variant="outline" onClick={loadProducts}>
            <RefreshCcw size={16} className="mr-2" />
            Recarregar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header 
        title="Digitação de Pedidos"
        backgroundColor="blue"
        showBackButton
        rightContent={
          <SyncStatus 
            token={MOCK_TOKEN}
            salesRepId={MOCK_SALES_REP_ID}
          />
        }
      />
      
      <div className="bg-app-blue text-white px-3 py-1 text-xs flex justify-between items-center">
        <div>
          <span className="font-semibold">{selectedClient?.id}</span> - {selectedClient?.name}
          {selectedClient?.fantasyName && <span className="ml-1">({selectedClient.fantasyName})</span>}
        </div>
        
        <div className={`text-xs font-medium ${
          connectionStatus === ConnectionStatus.ONLINE 
            ? 'text-green-300' 
            : 'text-orange-300'
        }`}>
          {connectionStatus === ConnectionStatus.ONLINE ? 'Online' : 'Offline'}
        </div>
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
                        <SelectItem value={currentProduct.unit}>{currentProduct.unit}</SelectItem>
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
                        <span className="ml-1">{currentProduct.unit_price.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">Estq:</span>
                        <span className="ml-1">{currentProduct.stock}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">P. mín:</span>
                        <span className="ml-1">{currentProduct.min_price.toFixed(2)}</span>
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
                      <span className="text-sm text-gray-500">{client.fantasy_name}</span>
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
