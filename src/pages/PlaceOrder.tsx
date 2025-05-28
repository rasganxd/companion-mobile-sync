import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, AlertTriangle, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { useClientDataValidation } from '@/hooks/useClientDataValidation';
import DataValidationPanel from '@/components/order/DataValidationPanel';
import ClientInfoBar from '@/components/order/ClientInfoBar';
import OrderItemsTable from '@/components/order/OrderItemsTable';
import OrderSummary from '@/components/order/OrderSummary';
import ClientSearchModal from '@/components/order/ClientSearchModal';
import ProductSearchModal from '@/components/order/ProductSearchModal';
import AppButton from '@/components/AppButton';

interface Product {
  id: string;
  name: string;
  price: number;
  stock?: number;
  code?: string;
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Client {
  id: string;
  name: string;
  company_name?: string;
  code?: number;
}

const PlaceOrder = () => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  
  const { 
    inconsistencies, 
    isValidating, 
    validateClientData, 
    fixClientAssociation, 
    syncDataFromServer 
  } = useClientDataValidation();

  const { salesRep, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const loadClients = useCallback(async () => {
    if (!salesRep?.id) {
      console.log('❌ loadClients - salesRep não disponível ainda');
      return;
    }

    console.log('🔄 loadClients - Iniciando carregamento de clientes...');
    console.log('🔍 loadClients - salesRep atual:', salesRep);
    
    setIsLoadingClients(true);
    try {
      const db = getDatabaseAdapter();
      const allClients = await db.getClients();
      
      console.log(`📊 loadClients - Total de clientes no banco: ${allClients.length}`);
      console.log('📋 loadClients - Todos os clientes:', allClients);
      
      // Filtrar clientes do vendedor logado
      const salesRepClients = allClients.filter(client => {
        const matches = client.sales_rep_id === salesRep.id;
        console.log(`🔍 Cliente ${client.name} (ID: ${client.id}) - sales_rep_id: ${client.sales_rep_id} - Pertence ao vendedor? ${matches}`);
        return matches;
      });
      
      console.log(`✅ loadClients - Clientes do vendedor ${salesRep.name}: ${salesRepClients.length}`);
      console.log('📋 loadClients - Clientes filtrados:', salesRepClients);
      
      setClients(salesRepClients);
      
      // Verificar se há inconsistências
      if (allClients.length > 0 && salesRepClients.length === 0) {
        console.warn('⚠️ loadClients - Vendedor tem 0 clientes, mas existem clientes no banco. Possível inconsistência!');
        toast.warning('Nenhum cliente encontrado. Pode haver inconsistências nos dados.');
      }
      
    } catch (error) {
      console.error('❌ loadClients - Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setIsLoadingClients(false);
    }
  }, [salesRep?.id, salesRep?.name]);

  const loadProducts = useCallback(async () => {
    console.log('🔄 loadProducts - Iniciando carregamento de produtos...');
    setIsLoadingProducts(true);
    try {
      const db = getDatabaseAdapter();
      const productsData = await db.getProducts();
      setProducts(productsData);
      console.log(`✅ loadProducts - Produtos carregados: ${productsData.length}`);
    } catch (error) {
      console.error('❌ loadProducts - Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  const isValidClient = (client: any): boolean => {
    if (!client) {
      console.warn('⚠️ isValidClient - Cliente é nulo ou indefinido');
      return false;
    }
    
    if (!salesRep?.id) {
      console.warn('⚠️ isValidClient - Vendedor não está autenticado ou ID não disponível');
      return false;
    }
    
    if (client.sales_rep_id !== salesRep.id) {
      console.warn(`⚠️ isValidClient - Cliente ${client.name} (ID: ${client.id}) não pertence ao vendedor ${salesRep.name} (ID: ${salesRep.id})`);
      console.warn(`   Cliente sales_rep_id: ${client.sales_rep_id}`);
      console.warn(`   Vendedor salesRep.id: ${salesRep.id}`);
      return false;
    }
    
    return true;
  };

  const handleValidateData = useCallback(async () => {
    if (salesRep?.id) {
      await validateClientData(salesRep.id);
    }
  }, [salesRep?.id, validateClientData]);

  const handleFixClient = useCallback(async (clientId: string) => {
    if (salesRep?.id) {
      const success = await fixClientAssociation(clientId, salesRep.id);
      if (success) {
        // Recarregar clientes após correção
        await loadClients();
      }
    }
  }, [salesRep?.id, fixClientAssociation, loadClients]);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (salesRep?.id) {
      loadClients();
    }
    loadProducts();
  }, [isAuthenticated, navigate, salesRep?.id, loadClients, loadProducts]);

  const handleClientSelect = (client: any) => {
    console.log('🎯 handleClientSelect - Cliente selecionado:', client);
    
    // Validação melhorada com mais detalhes
    const isValid = isValidClient(client);
    console.log(`🔍 handleClientSelect - Cliente válido? ${isValid}`);
    
    if (!isValid) {
      console.error('❌ handleClientSelect - Validação falhou!');
      console.error('📊 Debug info:', {
        client,
        salesRep,
        clientSalesRepId: client?.sales_rep_id,
        loggedSalesRepId: salesRep?.id,
        clientsLoaded: clients.length
      });
      
      toast.error('Cliente selecionado não pertence ao seu portfólio. Verifique os dados.');
      return;
    }
    
    setSelectedClient(client);
    setShowClientSearch(false);
    console.log('✅ handleClientSelect - Cliente selecionado com sucesso');
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setShowProductSearch(false);
    
    // Adicionar produto ao pedido com quantidade inicial de 1
    addItemToOrder(product.id, product.name, 1, product.price);
  };

  const addItemToOrder = (productId: string, productName: string, quantity: number, unitPrice: number) => {
    const existingItemIndex = orderItems.findIndex(item => item.product_id === productId);
    
    if (existingItemIndex !== -1) {
      // Atualizar quantidade se o item já existe
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex].quantity += quantity;
      updatedItems[existingItemIndex].total_price = updatedItems[existingItemIndex].quantity * unitPrice;
      setOrderItems(updatedItems);
    } else {
      // Adicionar novo item ao pedido
      const newItem: OrderItem = {
        id: Date.now().toString(), // Usar timestamp como ID temporário
        product_id: productId,
        product_name: productName,
        quantity: quantity,
        unit_price: unitPrice,
        total_price: quantity * unitPrice
      };
      setOrderItems([...orderItems, newItem]);
    }
  };

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    const updatedItems = orderItems.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, quantity: newQuantity, total_price: newQuantity * item.unit_price };
        return updatedItem;
      }
      return item;
    });
    setOrderItems(updatedItems);
  };

  const removeItemFromOrder = (itemId: string) => {
    const updatedItems = orderItems.filter(item => item.id !== itemId);
    setOrderItems(updatedItems);
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + item.total_price, 0);
  };

  const handleCreateOrder = async () => {
    if (!selectedClient) {
      toast.error('Selecione um cliente para criar o pedido.');
      return;
    }

    if (orderItems.length === 0) {
      toast.error('Adicione itens ao pedido.');
      return;
    }

    const orderData = {
      customer_id: selectedClient.id,
      customer_name: selectedClient.name,
      sales_rep_id: salesRep?.id,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      total: calculateTotal(),
      items: orderItems
    };

    try {
      const db = getDatabaseAdapter();
      await db.saveOrder(orderData);
      toast.success('Pedido criado com sucesso!');
      navigate('/home');
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast.error('Erro ao criar pedido.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/home')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Novo Pedido</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Debug Info */}
          <div className="text-xs text-gray-500 text-right">
            <div>Vendedor: {salesRep?.name || 'Carregando...'}</div>
            <div>Clientes: {clients.length}</div>
          </div>
          
          {/* Validation Button */}
          <button
            onClick={() => setShowValidationPanel(true)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            title="Validar Dados"
          >
            <Settings className="h-5 w-5" />
          </button>
          
          {inconsistencies.length > 0 && (
            <button
              onClick={() => setShowValidationPanel(true)}
              className="p-2 hover:bg-red-100 rounded-lg text-red-600"
              title={`${inconsistencies.length} inconsistências encontradas`}
            >
              <AlertTriangle className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Client Info Bar */}
      <ClientInfoBar
        selectedClient={selectedClient}
        onClientSearch={() => setShowClientSearch(true)}
      />

      {/* Order Items Table */}
      <OrderItemsTable
        orderItems={orderItems}
        onQuantityChange={updateItemQuantity}
        onRemoveItem={removeItemFromOrder}
      />

      {/* Add Product Button */}
      <div className="px-4 py-2 bg-white border-b border-gray-200">
        <AppButton onClick={() => setShowProductSearch(true)}>
          Adicionar Produto
        </AppButton>
      </div>

      {/* Order Summary */}
      <OrderSummary
        total={calculateTotal()}
        onCreateOrder={handleCreateOrder}
      />

      {/* Client Search Modal */}
      <ClientSearchModal
        isOpen={showClientSearch}
        onClose={() => setShowClientSearch(false)}
        clients={clients}
        onClientSelect={handleClientSelect}
        isLoading={isLoadingClients}
      />

      {/* Product Search Modal */}
      <ProductSearchModal
        isOpen={showProductSearch}
        onClose={() => setShowProductSearch(false)}
        products={products}
        onProductSelect={handleProductSelect}
        isLoading={isLoadingProducts}
      />

      {/* Validation Panel */}
      {showValidationPanel && (
        <DataValidationPanel
          inconsistencies={inconsistencies}
          isValidating={isValidating}
          onValidate={handleValidateData}
          onFix={handleFixClient}
          onSync={syncDataFromServer}
          onClose={() => setShowValidationPanel(false)}
        />
      )}
    </div>
  );
};

export default PlaceOrder;
