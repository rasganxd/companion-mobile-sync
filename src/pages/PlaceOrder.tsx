
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Header from '@/components/Header';
import ClientSection from '@/components/order/ClientSection';
import ProductSection from '@/components/order/ProductSection';
import OrderItemsList from '@/components/order/OrderItemsList';
import ActionButtons from '@/components/order/ActionButtons';
import ClientSelectionModal from '@/components/order/ClientSelectionModal';
import OrderChoiceModal from '@/components/order/OrderChoiceModal';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';

interface Client {
  id: string;
  name: string;
  company_name?: string;
  sales_rep_id?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  code: number;
  stock: number;
  unit?: string;
  cost?: number;
}

interface OrderItem {
  id: number;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  code: string;
  unit: string;
}

const PlaceOrder = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { salesRep } = useAuth();
  
  // Estado do cliente passado via navegação
  const { clientId, clientName } = location.state || {};
  
  // Estados principais
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados de modais e busca
  const [showClientSelection, setShowClientSelection] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showOrderChoice, setShowOrderChoice] = useState(false);
  const [existingOrder, setExistingOrder] = useState<any>(null);
  
  // Estados de produtos
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);

  useEffect(() => {
    loadInitialData();
    
    // Se veio com cliente específico, configurar automaticamente
    if (clientId && clientName) {
      setSelectedClient({
        id: clientId,
        name: clientName
      });
      checkExistingOrder(clientId);
    }
  }, [clientId, clientName]);

  const loadInitialData = async () => {
    try {
      const db = getDatabaseAdapter();
      
      // Carregar produtos
      const productsData = await db.getProducts();
      console.log('📦 Produtos carregados:', productsData);
      setProducts(productsData || []);
      
      // Carregar clientes
      const clientsData = await db.getClients();
      console.log('👥 Clientes carregados:', clientsData);
      setClients(clientsData || []);
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    }
  };

  const checkExistingOrder = async (customerId: string) => {
    try {
      const db = getDatabaseAdapter();
      const orders = await db.getOrdersByCustomer(customerId);
      
      const pendingOrder = orders?.find((order: any) => 
        order.status === 'pending' || order.sync_status === 'pending_sync'
      );
      
      if (pendingOrder) {
        setExistingOrder(pendingOrder);
        setShowOrderChoice(true);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar pedidos existentes:', error);
    }
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setShowClientSelection(false);
    setClientSearchTerm('');
    checkExistingOrder(client.id);
  };

  const handleAddProduct = () => {
    if (!selectedProduct || quantity <= 0) {
      toast.error('Selecione um produto e quantidade válida');
      return;
    }

    const newItem: OrderItem = {
      id: Date.now(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity,
      price: unitPrice || selectedProduct.price,
      code: selectedProduct.code.toString(),
      unit: selectedProduct.unit || 'UN'
    };

    setOrderItems(prev => [...prev, newItem]);
    
    // Limpar seleção
    setSelectedProduct(null);
    setQuantity(1);
    setUnitPrice(0);
    
    toast.success('Produto adicionado ao pedido');
  };

  const handleRemoveItem = (itemId: number) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
    toast.success('Item removido do pedido');
  };

  const handleClearCart = () => {
    setOrderItems([]);
    toast.success('Carrinho limpo');
  };

  const calculateTotal = () => {
    const total = orderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    return total.toFixed(2);
  };

  const handleFinishOrder = async () => {
    if (!selectedClient || orderItems.length === 0) {
      toast.error('Selecione um cliente e adicione produtos');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const db = getDatabaseAdapter();
      
      const orderData = {
        id: uuidv4(),
        customer_id: selectedClient.id,
        customer_name: selectedClient.name,
        total: parseFloat(calculateTotal()),
        date: new Date().toISOString(),
        status: 'pending' as const,
        sync_status: 'pending_sync' as const,
        items: orderItems,
        sales_rep_id: salesRep?.id
      };

      await db.saveOrder(orderData);
      
      toast.success('Pedido criado com sucesso!');
      
      // Navegar de volta
      navigate('/my-orders', {
        state: { 
          clientId: selectedClient.id,
          clientName: selectedClient.name,
          newOrderCreated: true
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao salvar pedido:', error);
      toast.error('Erro ao criar pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewOrder = () => {
    if (orderItems.length === 0) {
      toast.warning('Adicione produtos ao pedido');
      return;
    }
    
    // Salvar como rascunho
    toast.success('Pedido salvo como rascunho');
  };

  const handleGoBack = () => {
    if (orderItems.length > 0) {
      if (confirm('Você tem itens no carrinho. Deseja realmente sair?')) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  const handleEditOrder = () => {
    // Implementar edição de pedido existente
    setShowOrderChoice(false);
    toast.info('Editando pedido existente');
  };

  const handleCreateNew = () => {
    // Criar novo pedido (substitui o atual)
    setShowOrderChoice(false);
    setExistingOrder(null);
    toast.info('Criando novo pedido');
  };

  const handleDeleteOrder = async () => {
    if (!existingOrder) return;
    
    try {
      const db = getDatabaseAdapter();
      await db.deleteOrder(existingOrder.id);
      setShowOrderChoice(false);
      setExistingOrder(null);
      toast.success('Pedido existente excluído');
    } catch (error) {
      console.error('❌ Erro ao excluir pedido:', error);
      toast.error('Erro ao excluir pedido');
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    (client.company_name && client.company_name.toLowerCase().includes(clientSearchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Novo Pedido" 
        showBackButton 
        backgroundColor="blue" 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Área principal */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Seção do Cliente */}
          <ClientSection
            selectedClient={selectedClient}
            onShowClientSelection={() => setShowClientSelection(true)}
          />
          
          {/* Seção de Produtos */}
          <ProductSection
            products={products}
            selectedProduct={selectedProduct}
            quantity={quantity}
            unitPrice={unitPrice}
            onSelectProduct={setSelectedProduct}
            onQuantityChange={setQuantity}
            onUnitPriceChange={setUnitPrice}
            onAddProduct={handleAddProduct}
          />
        </div>
        
        {/* Lista de Itens do Pedido */}
        <OrderItemsList
          orderItems={orderItems}
          onRemoveItem={handleRemoveItem}
          calculateTotal={calculateTotal}
        />
        
        {/* Botões de Ação */}
        <ActionButtons
          orderItems={orderItems}
          onClearCart={handleClearCart}
          onGoBack={handleGoBack}
          onViewOrder={handleViewOrder}
          onFinishOrder={handleFinishOrder}
          selectedClient={selectedClient || { id: '' }}
          isSubmitting={isSubmitting}
        />
      </div>

      {/* Modal de Seleção de Cliente */}
      <ClientSelectionModal
        showClientSelection={showClientSelection}
        clientSearchTerm={clientSearchTerm}
        filteredClients={filteredClients}
        onClose={() => setShowClientSelection(false)}
        onSearchChange={setClientSearchTerm}
        onSelectClient={handleSelectClient}
      />

      {/* Modal de Pedido Existente */}
      {existingOrder && (
        <OrderChoiceModal
          isOpen={showOrderChoice}
          onClose={() => setShowOrderChoice(false)}
          onEditOrder={handleEditOrder}
          onCreateNew={handleCreateNew}
          onDeleteOrder={handleDeleteOrder}
          clientName={selectedClient?.name || ''}
          orderTotal={existingOrder.total || 0}
          orderItemsCount={existingOrder.items?.length || 0}
        />
      )}
    </div>
  );
};

export default PlaceOrder;
