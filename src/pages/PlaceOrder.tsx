
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import { toast } from 'sonner';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ClientSection from '@/components/order/ClientSection';
import PaymentSection from '@/components/order/PaymentSection';
import ProductSection from '@/components/order/ProductSection';
import OrderItemsSection from '@/components/order/OrderItemsSection';
import ClientSelectionModal from '@/components/order/ClientSelectionModal';

interface Client {
  id: string;
  name: string;
  company_name?: string;
  sales_rep_id?: string;
}

interface Product {
  id: string;
  name: string;
  code: number;
  price: number;
  unit: string;
  stock: number;
  has_subunit?: boolean;
  subunit?: string;
  subunit_ratio?: number;
  min_price?: number;
  max_price?: number;
}

interface PaymentTable {
  id: string;
  name: string;
  description?: string;
  type?: string;
  payable_to?: string;
  payment_location?: string;
  active: boolean;
}

interface OrderItem {
  id: number;
  productId: string;
  productName: string;
  code: number;
  quantity: number;
  price: number;
  unit: string;
}

const PlaceOrder = () => {
  const { salesRep } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentTables, setPaymentTables] = useState<PaymentTable[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedPaymentTable, setSelectedPaymentTable] = useState<PaymentTable | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [quantity, setQuantity] = useState('1');
  const [selectedUnit, setSelectedUnit] = useState<'main' | 'sub'>('main');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showClientSelection, setShowClientSelection] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  
  const locationState = location.state as any;

  const loadData = async () => {
    setIsLoading(true);
    try {
      const db = getDatabaseAdapter();

      // Carregar clientes
      let localClients = await db.getClients();
      const salesRepClients = localClients.filter(client => client.sales_rep_id === salesRep?.id);
      
      if (salesRepClients.length === 0) {
        const { data: supabaseClients, error } = await supabase
          .from('customers')
          .select('*')
          .eq('sales_rep_id', salesRep.id)
          .eq('active', true);
          
        if (supabaseClients && !error) {
          await db.saveClients(supabaseClients);
          setClients(supabaseClients);
        }
      } else {
        setClients(salesRepClients);
      }

      // Carregar produtos
      let localProducts = await db.getProducts();
      if (localProducts.length === 0) {
        const { data: supabaseProducts, error } = await supabase
          .from('products')
          .select('*')
          .order('name');
          
        if (supabaseProducts && !error) {
          const productsWithStock = supabaseProducts.map(product => ({
            ...product,
            stock: product.stock || 0
          }));
          await db.saveProducts(productsWithStock);
          setProducts(productsWithStock);
        }
      } else {
        setProducts(localProducts);
      }

      // Carregar tabelas de pagamento
      const { data: paymentTablesData, error: paymentError } = await supabase
        .from('payment_tables')
        .select('*')
        .eq('active', true)
        .order('name');
        
      if (paymentTablesData && !paymentError) {
        setPaymentTables(paymentTablesData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (salesRep?.id) {
      loadData();
    }
  }, [salesRep?.id]);

  // Handle pre-selected client from navigation state
  useEffect(() => {
    if (locationState?.clientId && clients.length > 0) {
      const preSelectedClient = clients.find(c => c.id === locationState.clientId);
      if (preSelectedClient) {
        setSelectedClient(preSelectedClient);
      }
    }
  }, [locationState?.clientId, clients]);

  // Handle existing order items from navigation state
  useEffect(() => {
    if (locationState?.existingOrderItems) {
      setOrderItems(locationState.existingOrderItems);
    }
  }, [locationState]);

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setShowClientSelection(false);
    setClientSearchTerm('');
  };

  const handlePaymentTableChange = (value: string) => {
    if (value === 'none') {
      setSelectedPaymentTable(null);
    } else {
      const table = paymentTables.find(t => t.id === value);
      setSelectedPaymentTable(table || null);
    }
  };

  const handleAddItem = (item: OrderItem) => {
    setOrderItems([...orderItems, item]);
  };

  const handleRemoveItem = (itemId: number) => {
    setOrderItems(orderItems.filter(item => item.id !== itemId));
  };

  const handleFinishOrder = () => {
    if (!selectedClient) {
      toast.error('Selecione um cliente');
      return;
    }
    
    if (orderItems.length === 0) {
      toast.error('Adicione pelo menos um item ao pedido');
      return;
    }

    navigate('/order-review', {
      state: {
        orderItems,
        client: selectedClient,
        paymentMethod: selectedPaymentTable?.name || 'A definir',
        paymentTable: selectedPaymentTable?.name || 'A definir',
        paymentTableId: selectedPaymentTable?.id || null,
        clientId: selectedClient.id,
        clientName: selectedClient.name
      }
    });
  };

  const currentProduct = products[currentProductIndex] || null;

  const handleNavigateProduct = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentProductIndex > 0) {
      setCurrentProductIndex(currentProductIndex - 1);
    } else if (direction === 'next' && currentProductIndex < products.length - 1) {
      setCurrentProductIndex(currentProductIndex + 1);
    }
    setShowProductSearch(false);
    setProductSearchTerm('');
  };

  const handleSelectProduct = (product: Product) => {
    const index = products.findIndex(p => p.id === product.id);
    if (index !== -1) {
      setCurrentProductIndex(index);
    }
    setShowProductSearch(false);
    setProductSearchTerm('');
  };

  const handleAddOrderItem = () => {
    if (!currentProduct || !selectedClient) {
      toast.error('Selecione um cliente e produto');
      return;
    }

    const qty = parseFloat(quantity);
    if (qty <= 0) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }

    let finalQuantity = qty;
    let unitText = currentProduct.unit || 'UN';
    let unitPrice = currentProduct.price;

    // Handle subunit calculations
    if (selectedUnit === 'sub' && currentProduct.has_subunit && currentProduct.subunit_ratio) {
      finalQuantity = qty / currentProduct.subunit_ratio;
      unitText = currentProduct.subunit || 'UN';
    }

    const newItem: OrderItem = {
      id: Date.now(),
      productId: currentProduct.id,
      productName: currentProduct.name,
      code: currentProduct.code,
      quantity: finalQuantity,
      price: unitPrice,
      unit: unitText
    };

    handleAddItem(newItem);
    setQuantity('1');
    toast.success('Item adicionado ao pedido');
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header title="Novo Pedido" showBackButton={true} backgroundColor="blue" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="Novo Pedido" showBackButton={true} backgroundColor="blue" />
      
      <div className="p-2 flex-1 space-y-4">
        <ClientSection
          selectedClient={selectedClient}
          onShowClientSelection={() => setShowClientSelection(true)}
        />

        <PaymentSection
          paymentTables={paymentTables}
          selectedPaymentTable={selectedPaymentTable}
          onPaymentTableChange={handlePaymentTableChange}
        />

        <ProductSection
          products={products}
          currentProductIndex={currentProductIndex}
          currentProduct={currentProduct}
          quantity={quantity}
          selectedUnit={selectedUnit}
          showProductSearch={showProductSearch}
          productSearchTerm={productSearchTerm}
          onNavigateProduct={handleNavigateProduct}
          onProductSearch={() => setShowProductSearch(!showProductSearch)}
          onProductSearchChange={setProductSearchTerm}
          onSelectProduct={handleSelectProduct}
          onQuantityChange={setQuantity}
          onUnitChange={setSelectedUnit}
          onAddItem={handleAddOrderItem}
        />

        <OrderItemsSection
          orderItems={orderItems}
          onRemoveItem={handleRemoveItem}
          onFinishOrder={handleFinishOrder}
        />

        <ClientSelectionModal
          showClientSelection={showClientSelection}
          clientSearchTerm={clientSearchTerm}
          filteredClients={filteredClients}
          onClose={() => setShowClientSelection(false)}
          onSearchChange={setClientSearchTerm}
          onSelectClient={handleSelectClient}
        />
      </div>
    </div>
  );
};

export default PlaceOrder;
