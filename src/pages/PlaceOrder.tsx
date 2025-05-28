import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import ProductForm from '@/components/order/ProductForm';
import ClientSearchDialog from '@/components/order/ClientSearchDialog';
import ProductSearchDialog from '@/components/order/ProductSearchDialog';
import ClientInfoBar from '@/components/order/ClientInfoBar';
import ProductHeader from '@/components/order/ProductHeader';
import OrderItemsList from '@/components/order/OrderItemsList';
import ActionButtons from '@/components/order/ActionButtons';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [existingOrderId, setExistingOrderId] = useState<string | null>(null);
  
  // Novos estados para busca de produtos
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  // Novo estado para controlar o dialog de descarte
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  
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
        
        // Initialize order items with existing items if coming from OrderReview
        if (location.state?.existingOrderItems) {
          console.log('🔄 Restoring existing order items:', location.state.existingOrderItems);
          setOrderItems(location.state.existingOrderItems);
        }
        
        // Set payment method if provided
        if (location.state?.paymentMethod) {
          setPaymentMethod(location.state.paymentMethod);
        }
        
        // Set selected client if passed via location state
        if (location.state && location.state.clientId) {
          const clientId = location.state.clientId;
          const clientName = location.state.clientName;
          
          console.log('🎯 Auto-selecting client:', { clientId, clientName });
          
          // Try to find the client in the fetched data first
          const client = clientsData?.find(c => c.id === clientId);
          
          if (client) {
            console.log('✅ Client found in database:', client);
            await loadClientExistingOrder(client);
            toast.success(`Cliente ${client.company_name || client.name} selecionado automaticamente`);
          } else {
            // If not found in database, create a temporary client object with the passed data
            console.log('⚠️ Client not found in database, using passed data');
            const tempClient = {
              id: clientId,
              name: clientName,
              company_name: clientName
            };
            await loadClientExistingOrder(tempClient);
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

  const loadClientExistingOrder = async (client: Client) => {
    try {
      setSelectedClient(client);
      
      // Verificar se há pedido existente para este cliente
      const db = getDatabaseAdapter();
      const clientOrders = await db.getClientOrders(client.id);
      
      console.log('📋 Client orders found:', clientOrders);
      
      if (clientOrders.length > 0) {
        // Pegar o pedido mais recente (último)
        const latestOrder = clientOrders.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];
        
        console.log('📄 Loading latest order:', latestOrder);
        
        // Carregar itens do pedido existente
        if (latestOrder.items && latestOrder.items.length > 0) {
          const existingItems = latestOrder.items.map((item: any, index: number) => ({
            id: Date.now() + index, // Gerar IDs únicos
            productId: item.product_id || `temp_${index}`,
            productName: item.product_name,
            quantity: item.quantity,
            price: item.price || item.unit_price || 0,
            code: item.product_code?.toString() || '',
            unit: item.unit || 'UN'
          }));
          
          setOrderItems(existingItems);
          setExistingOrderId(latestOrder.id);
          
          // Carregar método de pagamento se disponível
          if (latestOrder.payment_method) {
            setPaymentMethod(latestOrder.payment_method);
          }
          
          toast.success(`Pedido existente carregado com ${existingItems.length} item(s)`);
        }
      }
    } catch (error) {
      console.error('Error loading client existing order:', error);
      toast.error('Erro ao carregar pedido existente do cliente');
    }
  };
  
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
    navigate('/order-review', { 
      state: { 
        orderItems, 
        client: selectedClient, 
        paymentMethod,
        clientId: location.state?.clientId,
        clientName: location.state?.clientName,
        day: location.state?.day,
        existingOrderId
      } 
    });
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

  const handleSelectClient = async (client: Client) => {
    await loadClientExistingOrder(client);
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
      
      // Create or update order locally with offline status
      const orderId = existingOrderId || `local_${Date.now()}`;
      const orderData = {
        id: orderId,
        customer_id: selectedClient.id,
        customer_name: selectedClient.company_name || selectedClient.name,
        total: parseFloat(calculateTotal()),
        status: 'pending',
        payment_method: paymentMethod,
        date: new Date().toISOString(),
        sync_status: 'pending_sync', // Sempre pendente para nova transmissão
        source_project: 'mobile',
        items: orderItems.map(item => ({
          product_name: item.productName,
          product_code: parseInt(item.code) || null,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        }))
      };

      // Save order locally (will update if existing)
      await db.saveOrder(orderData);
      
      console.log('📱 Order saved locally:', orderData);
      
      if (existingOrderId) {
        toast.success("Pedido atualizado e salvo localmente!");
      } else {
        toast.success("Pedido salvo localmente!");
      }
      
      // Clear form
      setOrderItems([]);
      setExistingOrderId(null);
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
    // Se há itens no carrinho, mostrar dialog de confirmação
    if (orderItems.length > 0) {
      setShowDiscardDialog(true);
      return;
    }
    
    // Se não há itens, navegar normalmente
    navigateBack();
  };

  const navigateBack = () => {
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

  const handleDiscardAndGoBack = () => {
    setOrderItems([]);
    setExistingOrderId(null);
    setShowDiscardDialog(false);
    toast.info("Itens do carrinho descartados");
    navigateBack();
  };

  const handleClearCart = () => {
    setOrderItems([]);
    setExistingOrderId(null);
    toast.info("Carrinho limpo");
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
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <Header 
        title={existingOrderId ? "Editar Pedido" : "Digitação de Pedidos"}
        backgroundColor="blue"
        showBackButton
      />
      
      {/* Client Info Bar */}
      <ClientInfoBar 
        selectedClient={selectedClient}
        onClientSearch={handleClientSearch}
      />
      
      {existingOrderId && (
        <div className="bg-yellow-100 border-b border-yellow-200 px-3 py-2">
          <p className="text-yellow-800 text-sm">
            ✏️ Editando pedido existente - As alterações serão salvas automaticamente
          </p>
        </div>
      )}
      
      <div className="flex flex-col flex-1 min-h-0">
        {/* Product Section */}
        <div className="flex-1 p-1.5 min-h-0">
          <Card className="h-full">
            <CardContent className="p-1.5">
              {/* Product Header */}
              <ProductHeader 
                product={currentProduct}
                currentProductIndex={currentProductIndex}
              />
              
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
        
        {/* Order Items List */}
        <OrderItemsList 
          orderItems={orderItems}
          onRemoveItem={handleRemoveItem}
          calculateTotal={calculateTotal}
        />
        
        {/* Action Buttons */}
        <ActionButtons 
          orderItems={orderItems}
          onClearCart={handleClearCart}
          onGoBack={handleGoBack}
          onViewOrder={handleViewOrder}
          onFinishOrder={handleFinishOrder}
          selectedClient={selectedClient}
          isSubmitting={isSubmitting}
        />
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

      {/* Dialog de Confirmação para Descartar Carrinho */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar itens do carrinho?</AlertDialogTitle>
            <AlertDialogDescription>
              Você possui {orderItems.length} {orderItems.length === 1 ? 'item' : 'itens'} no carrinho. 
              Se voltar agora, todos os itens serão perdidos. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDiscardAndGoBack}
              className="bg-red-600 hover:bg-red-700"
            >
              Descartar e Voltar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PlaceOrder;
