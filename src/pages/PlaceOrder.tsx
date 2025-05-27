
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ShoppingCart, Eye } from 'lucide-react';
import AppButton from '@/components/AppButton';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import ProductForm from '@/components/order/ProductForm';
import OrderItemsTable from '@/components/order/OrderItemsTable';
import ClientSearchDialog from '@/components/order/ClientSearchDialog';

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
      // Get next order code
      const { data: codeData, error: codeError } = await supabase
        .rpc('get_next_order_code');

      if (codeError) {
        console.error("Error getting order code:", codeError);
        throw new Error("Erro ao gerar código do pedido");
      }

      // Create order with code
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          code: codeData,
          customer_id: selectedClient.id,
          customer_name: selectedClient.company_name || selectedClient.name,
          total: parseFloat(calculateTotal()),
          status: 'pending',
          payment_method: paymentMethod,
          source_project: 'mobile'
        })
        .select()
        .single();

      if (orderError) {
        console.error("Error creating order:", orderError);
        throw new Error("Erro ao criar pedido");
      }

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

      if (itemsError) {
        console.error("Error creating order items:", itemsError);
        throw new Error("Erro ao criar itens do pedido");
      }

      toast.success("Pedido criado com sucesso!");
      navigate('/clientes-lista');
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao criar pedido");
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
                <ProductForm 
                  product={currentProduct}
                  quantity={quantity}
                  onQuantityChange={setQuantity}
                  paymentMethod={paymentMethod}
                  onPaymentMethodChange={setPaymentMethod}
                  onProductChange={handleProductChange}
                  onClientSearch={handleClientSearch}
                  onAddItem={handleAddItem}
                />
              )}
            </CardContent>
          </Card>
        </div>
        
        <OrderItemsTable 
          orderItems={orderItems}
          onRemoveItem={handleRemoveItem}
          calculateTotal={calculateTotal}
        />
        
        <div className="p-2 grid grid-cols-3 gap-2 border-t bg-white">
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

      <ClientSearchDialog 
        open={searchOpen}
        onOpenChange={setSearchOpen}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        filteredClients={filteredClients}
        onSelectClient={handleSelectClient}
      />
    </div>
  );
};

export default PlaceOrder;
