
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Search, ArrowLeft, ShoppingCart, Eye } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';

interface OrderItem {
  id: number;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  code: string;
  unit: string;
}

interface Client {
  id: string;
  name: string;
  company_name?: string;
  code?: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  code?: number;
  stock: number;
  unit?: string;
  cost?: number;
}

const PlaceOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [quantity, setQuantity] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('01 A VISTA');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client>({ id: '', name: '', company_name: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load client data and products from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name, price, code, stock, unit, cost')
          .order('name');
        
        if (productsError) throw productsError;
        
        setProducts(productsData || []);
        
        // Fetch all clients for search
        const { data: clientsData, error: clientsError } = await supabase
          .from('customers')
          .select('id, name, company_name, code')
          .eq('active', true)
          .order('name');
        
        if (clientsError) throw clientsError;
        
        setClients(clientsData || []);
        setFilteredClients(clientsData || []);
        
        // Set selected client if passed via location state
        if (location.state && location.state.clientId) {
          const clientId = location.state.clientId;
          const client = clientsData?.find(c => c.id === clientId);
          
          if (client) {
            setSelectedClient(client);
          } else {
            console.error("Client not found:", clientId);
            toast.error("Cliente não encontrado");
          }
        }
        
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Erro ao carregar dados");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [location.state]);
  
  const currentProduct = products[currentProductIndex] || null;
  
  // Filter clients based on search query
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    
    if (!value.trim()) {
      setFilteredClients(clients);
      return;
    }
    
    const lowercasedValue = value.toLowerCase();
    const filtered = clients.filter(
      client => 
        client.name.toLowerCase().includes(lowercasedValue) || 
        (client.company_name && client.company_name.toLowerCase().includes(lowercasedValue))
    );
    
    setFilteredClients(filtered);
  }, [clients]);
  
  const handleProductChange = (direction: 'prev' | 'next' | 'first' | 'last') => {
    if (products.length === 0) return;
    
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
    
    setCurrentProductIndex(newIndex || 0);
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
        code: currentProduct.code?.toString() || '',
        unit: currentProduct.unit || 'UN'
      };
      
      setOrderItems([...orderItems, newItem]);
    }
    
    toast.success(`${quantity} ${currentProduct.unit || 'UN'} de ${currentProduct.name} adicionado`);
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
    if (location.state && location.state.clientId) {
      navigate('/client/' + location.state.clientId, { state: { clientId: location.state.clientId } });
    } else {
      navigate('/clientes-lista');
    }
  };

  const handleClientSearch = () => {
    setSearchQuery('');
    setFilteredClients(clients);
    setSearchOpen(true);
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setSearchOpen(false);
    toast.success(`Cliente ${client.name} selecionado`);
  };

  const handleFinishOrder = async () => {
    if (orderItems.length === 0) {
      toast.error("Adicione pelo menos um item ao pedido");
      return;
    }
    
    if (!selectedClient.id) {
      toast.error("Selecione um cliente");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_id: selectedClient.id,
          customer_name: selectedClient.company_name || selectedClient.name,
          total: parseFloat(calculateTotal()),
          status: 'pending',
          payment_method: paymentMethod,
          source_project: 'mobile'
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItemsData = orderItems.map(item => ({
        order_id: orderData.id,
        product_name: item.productName,
        product_code: parseInt(item.code) || null,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) throw itemsError;

      toast.success("Pedido criado com sucesso!");
      navigate('/clientes-lista');
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Erro ao criar pedido");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <Header 
          title="Digitação de Pedidos"
          backgroundColor="blue"
          showBackButton
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg text-gray-600">Carregando dados...</div>
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <Header 
          title="Digitação de Pedidos"
          backgroundColor="blue"
          showBackButton
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg text-gray-600">Nenhum produto encontrado</div>
            <div className="text-sm text-gray-500 mt-2">Cadastre produtos para fazer pedidos</div>
          </div>
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
      />
      
      <div className="bg-app-blue text-white px-3 py-1 text-xs">
        {selectedClient.id ? (
          <>
            <span className="font-semibold">{selectedClient.code || 'S/N'}</span> - {selectedClient.name}
            {selectedClient.company_name && <span className="ml-1">({selectedClient.company_name})</span>}
          </>
        ) : (
          <span className="text-yellow-200">Nenhum cliente selecionado - Use o botão "Con" para selecionar</span>
        )}
      </div>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 p-3">
          <Card className="h-full">
            <CardContent className="p-3 flex flex-col h-full">
              <div className="bg-gray-100 p-2 rounded-md mb-3 flex items-center">
                <div className="bg-app-purple h-7 w-7 flex items-center justify-center mr-2 text-white rounded-full">
                  <span className="text-sm font-bold">{currentProductIndex + 1}</span>
                </div>
                <div className="flex-1 font-bold text-app-blue text-sm truncate">
                  {currentProduct?.name || 'Nenhum produto'}
                </div>
              </div>
              
              {currentProduct && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="bg-white">
                      <Label className="block mb-1 text-sm font-medium text-gray-700">Unidade:</Label>
                      <Select defaultValue={currentProduct.unit || 'UN'}>
                        <SelectTrigger className="h-9 w-full bg-white border border-gray-300 text-sm">
                          <SelectValue placeholder="Unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UN">UN - Unidade</SelectItem>
                          <SelectItem value="PT">PT - Pacote</SelectItem>
                          <SelectItem value="CX">CX - Caixa</SelectItem>
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
                          <span className="ml-1">{(currentProduct.cost || 0).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 font-medium">Estq:</span>
                          <span className="ml-1">{currentProduct.stock || 0}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 font-medium">Código:</span>
                          <span className="ml-1">{currentProduct.code || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
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
              disabled={orderItems.length === 0 || !selectedClient.id || isSubmitting}
            >
              <ShoppingCart size={14} className="mr-1" />
              {isSubmitting ? 'Finalizando...' : 'Finalizar'}
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
                      <span className="text-sm text-gray-500">{client.company_name}</span>
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
