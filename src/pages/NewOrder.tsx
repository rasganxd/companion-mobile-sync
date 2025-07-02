import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useOrderManagement } from '@/hooks/useOrderManagement';
import { useProductSelection } from '@/hooks/useProductSelection';
import { useClientSelection } from '@/hooks/useClientSelection';
import { usePaymentTables } from '@/hooks/usePaymentTables';
import NewOrderHeader from '@/components/order/NewOrderHeader';
import NewOrderClientInfo from '@/components/order/NewOrderClientInfo';
import NewOrderProductNavigation from '@/components/order/NewOrderProductNavigation';
import NewOrderProductDetails from '@/components/order/NewOrderProductDetails';
import ClientSelectionModal from '@/components/order/ClientSelectionModal';
import ProductSearchDialog from '@/components/order/ProductSearchDialog';
import OrderChoiceModal from '@/components/order/OrderChoiceModal';
import PaymentSection from '@/components/order/PaymentSection';
import ActionButtons from '@/components/order/ActionButtons';
import { toast } from 'sonner';

const PlaceOrder = () => {
  const {
    goBack,
    navigateToClientActivities,
    navigateTo
  } = useAppNavigation();
  const location = useLocation();

  // Extract client data from navigation state
  const {
    clientName,
    clientId,
    day,
    editMode,
    existingOrderItems,
    paymentMethod
  } = location.state || {};

  // ✅ CORREÇÃO: Estado para controle de carregamento do pedido
  const [orderLoaded, setOrderLoaded] = React.useState(false);
  const [existingItemsLoaded, setExistingItemsLoaded] = React.useState(false);

  // ✅ MELHORADA: Função de voltar mais inteligente
  const handleGoBack = () => {
    // Se temos dados do cliente, voltar para atividades do cliente com estado
    if (clientId && clientName) {
      console.log('🔙 NewOrder: Going back to client activities with client data', {
        clientName,
        clientId,
        day
      });
      navigateToClientActivities(clientName, clientId, day);
    } else {
      console.log('🔙 NewOrder: No client data, using default goBack');
      // Se não temos dados do cliente, usar o goBack padrão do contexto
      goBack();
    }
  };

  // Create initial client object if data is available
  const initialClient = React.useMemo(() => {
    if (clientId && clientName) {
      return {
        id: clientId,
        name: clientName,
        company_name: clientName
      };
    }
    return null;
  }, [clientId, clientName]);

  const {
    orderItems,
    isSubmitting,
    editingOrderId,
    addOrderItem,
    removeOrderItem,
    clearCart,
    calculateTotal,
    finishOrder,
    loadExistingOrder,
    setOrderItems
  } = useOrderManagement();

  const {
    products,
    productsByCategory,
    selectedProduct,
    quantity,
    unitPrice,
    searchTerm,
    currentProductIndex,
    unitOptions,
    selectedUnit,
    selectedUnitType,
    hasMultipleUnits,
    selectProduct,
    setQuantity,
    setUnitPrice,
    setSearchTerm,
    setSelectedUnitType,
    setCurrentProductIndex,
    addProduct,
    clearSelection,
    getCurrentCategoryInfo
  } = useProductSelection(addOrderItem);

  const {
    clients,
    selectedClient,
    showClientSelection,
    clientSearchTerm,
    showOrderChoice,
    existingOrder,
    filteredClients,
    setSelectedClient,
    setShowClientSelection,
    setClientSearchTerm,
    setShowOrderChoice,
    selectClient,
    handleEditOrder,
    handleCreateNew,
    handleDeleteOrder
  } = useClientSelection(initialClient);

  const {
    paymentTables,
    selectedPaymentTable,
    loading: paymentTablesLoading,
    selectPaymentTable
  } = usePaymentTables();

  const [showProductSearch, setShowProductSearch] = React.useState(false);

  // ✅ NOVO: Carregar itens existentes vindos da navegação (Mais Itens)
  React.useEffect(() => {
    if (existingOrderItems && existingOrderItems.length > 0 && !existingItemsLoaded) {
      console.log('📋 NewOrder: Loading existing order items from navigation:', existingOrderItems.length, 'items');
      setOrderItems(existingOrderItems);
      setExistingItemsLoaded(true);
    }
  }, [existingOrderItems, existingItemsLoaded, setOrderItems]);

  // ✅ CORREÇÃO: Carregar pedido existente apenas uma vez com controle adequado
  React.useEffect(() => {
    // Só carregar se estamos em modo de edição, temos cliente selecionado e ainda não carregamos
    // E não temos itens existentes vindos da navegação
    if (editMode && clientId && selectedClient && !orderLoaded && !existingOrderItems) {
      console.log('📋 NewOrder: Edit mode detected, loading existing order for client:', clientId);
      
      const loadOrder = async () => {
        try {
          const result = await loadExistingOrder(clientId, true); // Mostrar toast agora
          if (result.success) {
            setOrderLoaded(true); // Marcar como carregado para evitar loops
            console.log('✅ Order loaded successfully with', result.itemsCount, 'items');
          }
        } catch (error) {
          console.error('❌ Error loading existing order:', error);
          toast.error('Erro ao carregar pedido existente');
        }
      };

      loadOrder();
    }
  }, [editMode, clientId, selectedClient, orderLoaded, loadExistingOrder, existingOrderItems]);

  // ✅ CORREÇÃO: Reset orderLoaded quando mudamos de cliente
  React.useEffect(() => {
    if (selectedClient?.id !== clientId) {
      setOrderLoaded(false);
    }
  }, [selectedClient, clientId]);

  // Product navigation functions
  const handleProductNavigation = (direction: 'prev' | 'next' | 'first' | 'last') => {
    if (products.length === 0) return;

    let newIndex = currentProductIndex;

    switch (direction) {
      case 'first':
        newIndex = 0;
        break;
      case 'prev':
        newIndex = currentProductIndex > 0 ? currentProductIndex - 1 : products.length - 1;
        break;
      case 'next':
        newIndex = currentProductIndex < products.length - 1 ? currentProductIndex + 1 : 0;
        break;
      case 'last':
        newIndex = products.length - 1;
        break;
    }

    setCurrentProductIndex(newIndex);
    selectProduct(products[newIndex]);
  };

  // New function to handle product code search
  const handleProductCodeSearch = (code: string) => {
    console.log('🔍 Searching for product with code:', code);
    const foundProduct = products.find(p => p.code.toString() === code);
    if (foundProduct) {
      console.log('✅ Product found:', foundProduct.name);
      selectProduct(foundProduct);
      const index = products.findIndex(p => p.id === foundProduct.id);
      if (index !== -1) {
        setCurrentProductIndex(index);
      }
    } else {
      console.log('❌ Product not found for code:', code);
      // You could show a toast or error message here
    }
  };

  // Sincronizar currentProductIndex com produto selecionado
  React.useEffect(() => {
    if (selectedProduct && products.length > 0) {
      const index = products.findIndex(p => p.id === selectedProduct.id);
      if (index !== -1 && index !== currentProductIndex) {
        setCurrentProductIndex(index);
      }
    }
  }, [selectedProduct, products, currentProductIndex]);

  const currentProduct = selectedProduct || products[currentProductIndex];
  const categoryInfo = getCurrentCategoryInfo();

  // ✅ NOVO: Função para ir para revisão do pedido
  const handleFinishOrder = () => {
    if (!selectedClient) {
      toast.error('Selecione um cliente');
      return;
    }

    if (!selectedPaymentTable?.id) {
      toast.error('Selecione uma forma de pagamento');
      return;
    }

    if (orderItems.length === 0) {
      toast.error('Adicione pelo menos um produto ao pedido');
      return;
    }

    // Navegar para a tela de revisão com todos os dados necessários
    navigateTo('/order-review', {
      orderItems,
      client: selectedClient,
      paymentMethod: selectedPaymentTable.name,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      day
    });
  };

  // ✅ Determinar título baseado no modo
  const headerTitle = editMode ? 'Editar Pedido' : 'Novo Pedido';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <NewOrderHeader 
        onGoBack={handleGoBack} 
        title={headerTitle}
      />

      <NewOrderClientInfo
        selectedClient={selectedClient}
        onShowClientSelection={() => setShowClientSelection(true)}
      />

      {/* Container principal com margem superior para evitar colagem */}
      <div className="flex-1 p-4 pt-6 space-y-6">
        {/* Seção de Pagamento - Agora após cliente */}
        {selectedClient && (
          <PaymentSection
            paymentTables={paymentTables}
            selectedPaymentTable={selectedPaymentTable}
            onPaymentTableChange={selectPaymentTable}
          />
        )}

        {/* Produto atual e navegação */}
        <div className="bg-white rounded-lg shadow p-4 px-[6px] py-[6px] mx-0 my-0">
          <div className="flex items-center justify-between mb-4">
            {/* Mostra total geral de produtos e categorias */}
          </div>

          <NewOrderProductNavigation
            currentProductIndex={currentProductIndex}
            totalProducts={products.length}
            categoryInfo={categoryInfo}
            onNavigate={handleProductNavigation}
            onShowProductSearch={() => setShowProductSearch(true)}
          />

          <NewOrderProductDetails
            currentProduct={currentProduct}
            quantity={quantity}
            unitPrice={unitPrice}
            unitOptions={unitOptions}
            selectedUnitType={selectedUnitType}
            hasMultipleUnits={hasMultipleUnits}
            onQuantityChange={setQuantity}
            onUnitPriceChange={setUnitPrice}
            onUnitTypeChange={setSelectedUnitType}
            onAddProduct={addProduct}
            onProductCodeSearch={handleProductCodeSearch}
          />
        </div>

        {/* ✅ NOVO: Indicador sutil de total acumulado do pedido */}
        {orderItems.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-sm text-green-700 text-center">
              Total: R$ {calculateTotal().replace('.', ',')}
            </div>
          </div>
        )}
      </div>

      {/* Botões de ação */}
      <ActionButtons
        orderItems={orderItems}
        onClearCart={clearCart}
        onGoBack={handleGoBack}
        onFinishOrder={handleFinishOrder}
        selectedClient={selectedClient || { id: '' }}
        isSubmitting={isSubmitting}
        finishButtonText="Finalizar"
      />

      {/* Modals */}
      <ClientSelectionModal
        showClientSelection={showClientSelection}
        clientSearchTerm={clientSearchTerm}
        filteredClients={filteredClients}
        onClose={() => setShowClientSelection(false)}
        onSearchChange={setClientSearchTerm}
        onSelectClient={selectClient}
      />

      <ProductSearchDialog
        isOpen={showProductSearch}
        onClose={() => setShowProductSearch(false)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        products={products}
        onSelectProduct={(product) => {
          selectProduct(product);
          const index = products.findIndex(p => p.id === product.id);
          if (index !== -1) {
            setCurrentProductIndex(index);
          }
          setShowProductSearch(false);
        }}
      />

      {existingOrder && (
        <OrderChoiceModal
          isOpen={showOrderChoice}
          onClose={() => setShowOrderChoice(false)}
          onEditOrder={handleEditOrder}
          onCreateNew={handleCreateNew}
          onDeleteOrder={handleDeleteOrder}
          clientName={selectedClient?.company_name || selectedClient?.name || ''}
          orderTotal={existingOrder.total || 0}
          orderItemsCount={existingOrder.items?.length || 0}
        />
      )}
    </div>
  );
};

export default PlaceOrder;
