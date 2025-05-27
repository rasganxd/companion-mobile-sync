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
import ProductSearchDialog from '@/components/order/ProductSearchDialog';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';

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
  const [paymentMethod, setPaymentMethod] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client>({ id: '', name: '', company_name: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Novos estados para busca de produtos
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  // Load client data and products from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log('🛒 PlaceOrder - received state:', location.state);
        
        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name, price, code, stock, unit, cost')
          .order('name');
        
        if (productsError) throw productsError;
        
        setProducts(productsData || []);
        
        // Fetch payment tables to set default paymentMethod
        const { data: paymentTablesData, error: paymentTablesError } = await supabase
          .from('payment_tables')
          .select('name')
          .eq('active', true)
          .order('name')
          .limit(1);
        
        if (!paymentTablesError && paymentTablesData && paymentTablesData.length > 0) {
          setPaymentMethod(paymentTablesData[0].name);
        }
        
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
          const clientName = location.state.clientName;
          
          console.log('🎯 Auto-selecting client:', { clientId, clientName });
          
          // Try to find the client in the fetched data first
          const client = clientsData?.find(c => c.id === clientId);
          
          if (client) {
            console.log('✅ Client found in database:', client);
            setSelectedClient(client);
            toast.success(`Cliente ${client.company_name || client.name} selecionado automaticamente`);
          } else {
            // If not found in database, create a temporary client object with the passed data
            console.log('⚠️ Client not found in database, using passed data');
            const tempClient = {
              id: clientId,
              name: clientName,
              company_name: clientName
            };
            setSelectedClient(tempClient);
            toast.success(`Cliente ${clientName} selecionado automaticamente`);
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
  
  // Nova função para filtrar produtos
  const handleProductSearchChange = (value: string) => {
    setProductSearchQuery(value);
    
    if (!value.trim()) {
      setFilteredProducts(products);
      return;
    }
    
    const lowercasedValue = value.toLowerCase();
    const filtered = products.filter(
      product => 
        product.name.toLowerCase().includes(lowercasedValue) || 
        (product.code && product.code.toString().includes(value))
    );
    
    setFilteredProducts(filtered);
  };
  
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

  const handleClientSearch = () => {
    setSearchQuery('');
    setFilteredClients(clients);
    setSearchOpen(true);
  };

  const handleProductSearch = () => {
    setProductSearchQuery('');
    setFilteredProducts(products);
    setProductSearchOpen(true);
  };

  const handleSelectProduct = (product: Product) => {
    const productIndex = products.findIndex(p => p.id === product.id);
    if (productIndex !== -1) {
      setCurrentProductIndex(productIndex);
    }
    setProductSearchOpen(false);
    toast.success(`Produto ${product.name} selecionado`);
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
      const db = getDatabaseAdapter();
      
      // Create order locally with offline status
      const orderData = {
        id: `local_${Date.now()}`, // Local ID prefix
        customer_id: selectedClient.id,
        customer_name: selectedClient.company_name || selectedClient.name,
        total: parseFloat(calculateTotal()),
        status: 'pending',
        payment_method: paymentMethod,
        date: new Date().toISOString(),
        sync_status: 'pending_sync', // Offline status
        source_project: 'mobile',
        items: orderItems.map(item => ({
          product_name: item.productName,
          product_code: parseInt(item.code) || null,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        }))
      };

      // Save order locally
      await db.saveOrder(orderData);
      
      console.log('📱 Order saved locally:', orderData);
      toast.success("Pedido salvo localmente! Use 'Transmitir Pedidos' para enviar ao servidor.");
      
      // Clear form
      setOrderItems([]);
      setSelectedClient({ id: '', name: '', company_name: '' });
      
      navigate('/clientes-lista');
    } catch (error) {
      console.error("Error saving order locally:", error);
      toast.error("Erro ao salvar pedido localmente");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleGoBack = () => {
    // Navigate back to activities list with client data
    if (location.state && location.state.clientId) {
      navigate('/', { 
        state: { 
          clientId: location.state.clientId, 
          clientName: location.state.clientName,
          day: location.state.day
        } 
      });
    } else {
      navigate('/clientes-lista');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
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
      <div className="min-h-screen flex flex-col bg-gray-50">
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header 
        title="Digitação de Pedidos"
        backgroundColor="blue"
        showBackButton
      />
      
      {/* Client Info Bar */}
      <div className="bg-app-blue text-white px-4 py-3 text-sm">
        {selectedClient.id ? (
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <span className="font-semibold">{selectedClient.code || 'S/N'}</span> - {selectedClient.name}
              {selectedClient.company_name && selectedClient.company_name !== selectedClient.name && (
                <div className="text-xs text-blue-100 mt-1">{selectedClient.company_name}</div>
              )}
            </div>
            <AppButton 
              variant="outline" 
              className="text-xs px-2 py-1 h-auto border-white text-white hover:bg-white hover:text-app-blue"
              onClick={handleClientSearch}
            >
              Alterar
            </AppButton>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-yellow-200">Nenhum cliente selecionado</span>
            <AppButton 
              variant="outline" 
              className="text-xs px-3 py-1 h-auto border-yellow-200 text-yellow-200 hover:bg-yellow-200 hover:text-app-blue"
              onClick={handleClientSearch}
            >
              Selecionar Cliente
            </AppButton>
          </div>
        )}
      </div>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Product Section */}
        <div className="flex-1 p-4 overflow-y-auto">
          <Card className="h-full">
            <CardContent className="p-4">
              {/* Product Header */}
              <div className="bg-gradient-to-r from-app-purple to-app-blue p-4 rounded-lg mb-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-white bg-opacity-20 h-10 w-10 flex items-center justify-center mr-3 text-white rounded-full">
                      <span className="text-sm font-bold">{currentProductIndex + 1}</span>
                    </div>
                    <div>
                      <div className="font-bold text-lg truncate">
                        {currentProduct?.name || 'Nenhum produto'}
                      </div>
                      <div className="text-sm text-blue-100">
                        Código: {currentProduct?.code || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      R$ {currentProduct?.price.toFixed(2) || '0,00'}
                    </div>
                    <div className="text-xs text-blue-100">
                      Estoque: {currentProduct?.stock || 0}
                    </div>
                  </div>
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
                  onProductSearch={handleProductSearch}
                  onAddItem={handleAddItem}
                />
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Order Items Table */}
        <OrderItemsTable 
          orderItems={orderItems}
          onRemoveItem={handleRemoveItem}
          calculateTotal={calculateTotal}
        />
        
        {/* Action Buttons */}
        <div className="p-4 bg-white border-t shadow-lg">
          <div className="grid grid-cols-3 gap-3">
            <AppButton 
              variant="outline" 
              className="flex items-center justify-center h-12 text-sm border-gray-300"
              onClick={handleGoBack}
            >
              <ArrowLeft size={16} className="mr-2" />
              Voltar
            </AppButton>
            
            <AppButton 
              variant="blue" 
              className="flex items-center justify-center h-12 text-sm"
              onClick={handleViewOrder}
              disabled={orderItems.length === 0}
            >
              <Eye size={16} className="mr-2" />
              Gravar
            </AppButton>
            
            <AppButton 
              variant="blue" 
              className="flex items-center justify-center h-12 text-sm bg-green-600 hover:bg-green-700"
              onClick={handleFinishOrder}
              disabled={orderItems.length === 0 || !selectedClient.id || isSubmitting}
            >
              <ShoppingCart size={16} className="mr-2" />
              {isSubmitting ? 'Salvando...' : 'Finalizar'}
            </AppButton>
          </div>
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

      <ProductSearchDialog 
        open={productSearchOpen}
        onOpenChange={setProductSearchOpen}
        searchQuery={productSearchQuery}
        onSearchChange={handleProductSearchChange}
        filteredProducts={filteredProducts}
        onSelectProduct={handleSelectProduct}
      />
    </div>
  );
};

export default PlaceOrder;
