import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
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
import ExistingOrderModal from '@/components/order/ExistingOrderModal';
import UnnegateClientModal from '@/components/clients/UnnegateClientModal';
import OrderChoiceModal from '@/components/order/OrderChoiceModal';

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
  
  // New states for existing order management
  const [showExistingOrderModal, setShowExistingOrderModal] = useState(false);
  const [existingOrder, setExistingOrder] = useState<any>(null);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  
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
          // Transform Supabase product data to match Product interface
          const productsWithStock = supabaseProducts.map(product => ({
            id: product.id,
            name: product.name,
            code: product.code,
            price: product.sale_price || 0, // Map sale_price to price
            unit: 'UN', // Default unit
            stock: product.stock || 0,
            has_subunit: false, // Default values for optional properties
            subunit: undefined,
            subunit_ratio: undefined,
            min_price: undefined,
            max_price: undefined
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
    if (locationState?.isEditingOrder && locationState?.editingOrderId) {
      setIsEditingOrder(true);
      setEditingOrderId(locationState.editingOrderId);
    }
  }, [locationState]);

  // Simplified client selection - no complex validation since it's done before
  const handleSelectClient = async (client: Client) => {
    setSelectedClient(client);
    setShowClientSelection(false);
    setClientSearchTerm('');
    console.log('✅ Cliente selecionado:', client.name);
  };

  const loadExistingOrder = async (order: any) => {
    try {
      console.log('📝 Loading existing order for editing:', order);
      
      // Set basic order info
      setIsEditingOrder(true);
      setEditingOrderId(order.id);
      
      // Load order items if they exist
      if (order.items && Array.isArray(order.items)) {
        const formattedItems = order.items.map((item: any, index: number) => ({
          id: item.id || Date.now() + index,
          productId: item.product_id || item.productId,
          productName: item.product_name || item.productName,
          code: item.product_code || item.code,
          quantity: item.quantity,
          price: item.unit_price || item.price,
          unit: item.unit || 'UN'
        }));
        
        setOrderItems(formattedItems);
        console.log('✅ Loaded order items:', formattedItems);
      }
      
      // Set payment method if exists
      if (order.payment_table_id) {
        const paymentTable = paymentTables.find(table => table.id === order.payment_table_id);
        if (paymentTable) {
          setSelectedPaymentTable(paymentTable);
        }
      }
      
      toast.success('Pedido carregado para edição');
    } catch (error) {
      console.error('Error loading existing order:', error);
      toast.error('Erro ao carregar pedido existente');
    }
  };

  const handleDeleteExistingOrder = async () => {
    if (!existingOrder) return;
    
    try {
      const db = getDatabaseAdapter();
      await db.deleteOrder(existingOrder.id);
      
      // Reset states
      setOrderItems([]);
      setSelectedPaymentTable(null);
      setIsEditingOrder(false);
      setEditingOrderId(null);
      setExistingOrder(null);
      
      toast.success('Pedido existente removido. Você pode criar um novo pedido.');
      console.log(`🗑️ Pedido ${existingOrder.id} removido para cliente ${selectedClient?.name}`);
    } catch (error) {
      console.error('Error deleting existing order:', error);
      toast.error('Erro ao excluir pedido existente');
    }
  };

  const handleEditExistingOrder = () => {
    if (existingOrder) {
      loadExistingOrder(existingOrder);
    }
    setShowExistingOrderModal(false);
  };

  const handleCreateNewOrder = () => {
    // Reset everything for new order
    setOrderItems([]);
    setSelectedPaymentTable(null);
    setIsEditingOrder(false);
    setEditingOrderId(null);
    setQuantity('1');
    setShowExistingOrderModal(false);
    
    toast.success('Novo pedido iniciado');
  };

  const handleCancelExistingOrder = () => {
    // Reset client selection
    setSelectedClient(null);
    setExistingOrder(null);
    setShowExistingOrderModal(false);
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

  const handleFinishOrder = async () => {
    if (!selectedClient) {
      toast.error('Selecione um cliente');
      return;
    }
    
    if (orderItems.length === 0) {
      toast.error('Adicione pelo menos um item ao pedido');
      return;
    }

    // If editing, save changes to existing order
    if (isEditingOrder && editingOrderId) {
      try {
        const db = getDatabaseAdapter();
        const updatedOrder = {
          id: editingOrderId,
          customer_id: selectedClient.id,
          customer_name: selectedClient.name,
          items: orderItems.map(item => ({
            id: item.id,
            product_id: item.productId,
            product_name: item.productName,
            product_code: item.code,
            quantity: item.quantity,
            unit_price: item.price,
            price: item.price,
            unit: item.unit,
            total: item.quantity * item.price
          })),
          total: orderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0),
          payment_table_id: selectedPaymentTable?.id || null,
          payment_table: selectedPaymentTable?.name || 'A definir',
          updated_at: new Date().toISOString(),
          sync_status: 'pending_sync'
        };

        await db.saveOrder(updatedOrder);
        toast.success('Pedido atualizado com sucesso');
        
        navigate('/order-review', {
          state: {
            orderItems,
            client: selectedClient,
            paymentMethod: selectedPaymentTable?.name || 'A definir',
            paymentTable: selectedPaymentTable?.name || 'A definir',
            paymentTableId: selectedPaymentTable?.id || null,
            clientId: selectedClient.id,
            clientName: selectedClient.name,
            isEditing: true,
            orderId: editingOrderId
          }
        });
        
      } catch (error) {
        console.error('Error updating order:', error);
        toast.error('Erro ao atualizar pedido');
      }
    } else {
      // Create new order (existing logic)
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
    }
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

  // Custom close handler that navigates back to client-fullscreen
  const handleClose = () => {
    console.log('🔄 Closing PlaceOrder, navigating back to client-fullscreen');
    
    // Get client info from current state or selected client
    const clientInfo = selectedClient || {
      id: locationState?.clientId,
      name: locationState?.clientName
    };
    
    if (clientInfo?.id) {
      // Navigate back to client-fullscreen with proper state
      navigate('/client-fullscreen', {
        state: {
          clients: [clientInfo], // Pass current client as array
          initialIndex: 0,
          day: locationState?.day || 'Segunda'
        }
      });
    } else {
      // Fallback to routes if no client info
      navigate('/rotas');
    }
  };

  // Custom header component with close button
  const CustomHeader = () => (
    <div className="w-full bg-gradient-to-r from-app-blue to-app-blue-dark py-4 px-4 flex items-center shadow-md">
      <button 
        className="mr-2 bg-white bg-opacity-20 rounded-full p-1 transition-all hover:bg-opacity-30"
        onClick={handleClose}
      >
        <X size={24} color="white" />
      </button>
      <h1 className="text-white text-xl font-semibold flex-1 text-center">
        {isEditingOrder ? "Editar Pedido" : "Novo Pedido"}
      </h1>
    </div>
  );

  const pageTitle = isEditingOrder ? "Editar Pedido" : "Novo Pedido";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <CustomHeader />
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
      <CustomHeader />
      
      <div className="p-2 flex-1 space-y-4">
        {isEditingOrder && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm font-medium">
              ✏️ Editando pedido existente - ID: {editingOrderId?.slice(0, 8)}...
            </p>
          </div>
        )}

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

        {/* Remove the complex validation modals since validation is done before */}
      </div>
    </div>
  );
};

export default PlaceOrder;
