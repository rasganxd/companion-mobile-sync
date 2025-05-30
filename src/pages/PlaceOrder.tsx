import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Plus, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProductPricing } from '@/hooks/useProductPricing';
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
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [quantity, setQuantity] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<'main' | 'sub'>('sub');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showClientSelection, setShowClientSelection] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  
  const locationState = location.state as any;
  const currentProduct = products[currentProductIndex];
  const { unitPrice, displayUnit } = useProductPricing(currentProduct, selectedUnit);

  // Carregar dados iniciais
  useEffect(() => {
    if (salesRep?.id) {
      loadData();
    }
  }, [salesRep?.id]);
  useEffect(() => {
    if (locationState?.clientId && clients.length > 0) {
      const preSelectedClient = clients.find(c => c.id === locationState.clientId);
      if (preSelectedClient) {
        setSelectedClient(preSelectedClient);
      }
    }
  }, [locationState?.clientId, clients]);
  useEffect(() => {
    if (locationState?.existingOrderItems) {
      setOrderItems(locationState.existingOrderItems);
    }
  }, [locationState]);
  useEffect(() => {
    if (currentProduct && unitPrice) {
      setCustomPrice(unitPrice.toFixed(2));
    }
  }, [currentProduct?.id, selectedUnit, unitPrice]);
  const loadData = async () => {
    setIsLoading(true);
    try {
      const db = getDatabaseAdapter();

      // Carregar clientes
      let localClients = await db.getClients();
      const salesRepClients = localClients.filter(client => client.sales_rep_id === salesRep?.id);
      if (salesRepClients.length === 0) {
        const {
          data: supabaseClients,
          error
        } = await supabase.from('customers').select('*').eq('sales_rep_id', salesRep.id).eq('active', true);
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
        const {
          data: supabaseProducts,
          error
        } = await supabase.from('products').select('*').order('name');
        if (supabaseProducts && !error) {
          // Garantir que todos os produtos tenham stock definido
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
      const {
        data: paymentTablesData,
        error: paymentError
      } = await supabase.from('payment_tables').select('*').eq('active', true).order('name');
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
  const navigateProduct = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentProductIndex > 0) {
      setCurrentProductIndex(currentProductIndex - 1);
    } else if (direction === 'next' && currentProductIndex < products.length - 1) {
      setCurrentProductIndex(currentProductIndex + 1);
    }

    // Reset form mas manter unidade se o produto tem subunidade
    setQuantity('');
    if (products[currentProductIndex]?.has_subunit) {
      setSelectedUnit('sub');
    } else {
      setSelectedUnit('main');
    }
  };
  const handleProductSearch = () => {
    setShowProductSearch(!showProductSearch);
    setProductSearchTerm('');
  };
  const selectProduct = (product: Product) => {
    const productIndex = products.findIndex(p => p.id === product.id);
    if (productIndex !== -1) {
      setCurrentProductIndex(productIndex);
      setShowProductSearch(false);
      setProductSearchTerm('');
      // Reset form and set appropriate default unit
      setQuantity('');
      if (product.has_subunit) {
        setSelectedUnit('sub');
      } else {
        setSelectedUnit('main');
      }
    }
  };
  const handleQuantityChange = (value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setQuantity(value);
    }
  };
  const handlePaymentTableChange = (value: string) => {
    if (value === 'none') {
      setSelectedPaymentTable(null);
    } else {
      const table = paymentTables.find(t => t.id === value);
      setSelectedPaymentTable(table || null);
    }
  };
  const handlePriceChange = (value: string) => {
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setCustomPrice(value);
    }
  };
  const getPriceValidation = () => {
    if (!currentProduct || !customPrice) return {
      isValid: true,
      message: ''
    };
    const price = parseFloat(customPrice);
    if (isNaN(price)) return {
      isValid: false,
      message: 'Preço inválido'
    };
    if (currentProduct.min_price && price < currentProduct.min_price) {
      return {
        isValid: false,
        message: `Preço mínimo: R$ ${currentProduct.min_price.toFixed(2)}`
      };
    }
    if (currentProduct.max_price && price > currentProduct.max_price) {
      return {
        isValid: false,
        message: `Preço máximo: R$ ${currentProduct.max_price.toFixed(2)}`
      };
    }
    return {
      isValid: true,
      message: ''
    };
  };
  const calculateItemTotal = () => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(customPrice) || 0;
    return (qty * price).toFixed(2);
  };
  const addItem = () => {
    if (!selectedClient) {
      toast.error('Selecione um cliente');
      return;
    }
    if (!currentProduct) {
      toast.error('Nenhum produto selecionado');
      return;
    }
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      toast.error('Informe uma quantidade válida');
      return;
    }
    const price = parseFloat(customPrice);
    if (!price || price <= 0) {
      toast.error('Informe um preço válido');
      return;
    }
    const priceValidation = getPriceValidation();
    if (!priceValidation.isValid) {
      toast.error(priceValidation.message);
      return;
    }
    const newItem: OrderItem = {
      id: Date.now(),
      productId: currentProduct.id,
      productName: currentProduct.name,
      code: currentProduct.code,
      quantity: qty,
      price: price,
      unit: displayUnit
    };
    setOrderItems([...orderItems, newItem]);

    // Reset form mas manter unidade selecionada
    setQuantity('');
    toast.success('Item adicionado ao pedido');
  };
  const removeItem = (itemId: number) => {
    setOrderItems(orderItems.filter(item => item.id !== itemId));
    toast.success('Item removido');
  };
  const getTotalValue = () => {
    return orderItems.reduce((total, item) => total + item.quantity * item.price, 0);
  };
  const finishOrder = () => {
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
          onNavigateProduct={navigateProduct}
          onProductSearch={handleProductSearch}
          onProductSearchChange={setProductSearchTerm}
          onSelectProduct={selectProduct}
          onQuantityChange={handleQuantityChange}
          onUnitChange={setSelectedUnit}
          onAddItem={addItem}
        />

        {/* Botão Gravar Item */}
        <Button 
          onClick={addItem} 
          className="w-full bg-green-600 hover:bg-green-700 h-9 text-base font-semibold" 
          disabled={!selectedClient || !currentProduct || !quantity || parseFloat(quantity) <= 0 || !customPrice || parseFloat(customPrice) <= 0 || !getPriceValidation().isValid}
        >
          <Plus size={18} className="mr-2" />
          Gravar Item
        </Button>

        <OrderItemsSection 
          orderItems={orderItems}
          onRemoveItem={removeItem}
          getTotalValue={getTotalValue}
        />

        {/* Botão Finalizar */}
        {orderItems.length > 0 && (
          <Button 
            onClick={finishOrder} 
            className="w-full bg-blue-600 hover:bg-blue-700 h-9 text-base font-semibold" 
            size="lg"
          >
            <ShoppingCart size={18} className="mr-2" />
            Finalizar Pedido
          </Button>
        )}

        <div className="h-20"></div>
      </div>

      <ClientSelectionModal 
        showClientSelection={showClientSelection}
        clientSearchTerm={clientSearchTerm}
        filteredClients={filteredClients}
        onClose={() => setShowClientSelection(false)}
        onSearchChange={setClientSearchTerm}
        onSelectClient={handleSelectClient}
      />
    </div>
  );
};

export default PlaceOrder;
