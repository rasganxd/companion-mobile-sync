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
import NewOrderItemsList from '@/components/order/NewOrderItemsList';
import NewOrderTotals from '@/components/order/NewOrderTotals';
import ClientSelectionModal from '@/components/order/ClientSelectionModal';
import ProductSearchDialog from '@/components/order/ProductSearchDialog';
import OrderChoiceModal from '@/components/order/OrderChoiceModal';
import PaymentSection from '@/components/order/PaymentSection';
import ActionButtons from '@/components/order/ActionButtons';
const PlaceOrder = () => {
  const {
    goBack
  } = useAppNavigation();
  const location = useLocation();

  // Extract client data from navigation state
  const {
    clientName,
    clientId
  } = location.state || {};

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
    addOrderItem,
    removeOrderItem,
    clearCart,
    calculateTotal,
    saveAsDraft,
    finishOrder
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
  const handleFinishOrder = () => {
    finishOrder(selectedClient, selectedPaymentTable?.id);
  };
  return <div className="min-h-screen bg-gray-100 flex flex-col">
      <NewOrderHeader onGoBack={goBack} />

      <NewOrderClientInfo selectedClient={selectedClient} onShowClientSelection={() => setShowClientSelection(true)} />

      <div className="flex-1 p-4 space-y-4">
        {/* Seção de Pagamento - Agora após cliente */}
        {selectedClient && <PaymentSection paymentTables={paymentTables} selectedPaymentTable={selectedPaymentTable} onPaymentTableChange={selectPaymentTable} />}

        {/* Produto atual e navegação */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            
            {/* Mostra total geral de produtos e categorias */}
            
          </div>

          <NewOrderProductNavigation currentProductIndex={currentProductIndex} totalProducts={products.length} categoryInfo={categoryInfo} onNavigate={handleProductNavigation} onShowProductSearch={() => setShowProductSearch(true)} />

          <NewOrderProductDetails currentProduct={currentProduct} quantity={quantity} unitPrice={unitPrice} unitOptions={unitOptions} selectedUnitType={selectedUnitType} hasMultipleUnits={hasMultipleUnits} onQuantityChange={setQuantity} onUnitPriceChange={setUnitPrice} onUnitTypeChange={setSelectedUnitType} onAddProduct={addProduct} onProductCodeSearch={handleProductCodeSearch} />
        </div>

        <NewOrderItemsList orderItems={orderItems} onRemoveItem={removeOrderItem} />

        {/* Totais */}
        {orderItems.length > 0 && <NewOrderTotals total={calculateTotal()} />}
      </div>

      {/* Botões de ação */}
      <ActionButtons orderItems={orderItems} onClearCart={clearCart} onGoBack={goBack} onSaveAsDraft={() => saveAsDraft(selectedClient)} onFinishOrder={handleFinishOrder} selectedClient={selectedClient || {
      id: ''
    }} isSubmitting={isSubmitting} />

      {/* Modals */}
      <ClientSelectionModal showClientSelection={showClientSelection} clientSearchTerm={clientSearchTerm} filteredClients={filteredClients} onClose={() => setShowClientSelection(false)} onSearchChange={setClientSearchTerm} onSelectClient={selectClient} />

      <ProductSearchDialog isOpen={showProductSearch} onClose={() => setShowProductSearch(false)} searchTerm={searchTerm} onSearchChange={setSearchTerm} products={products} onSelectProduct={product => {
      selectProduct(product);
      const index = products.findIndex(p => p.id === product.id);
      if (index !== -1) {
        setCurrentProductIndex(index);
      }
      setShowProductSearch(false);
    }} />

      {existingOrder && <OrderChoiceModal isOpen={showOrderChoice} onClose={() => setShowOrderChoice(false)} onEditOrder={handleEditOrder} onCreateNew={handleCreateNew} onDeleteOrder={handleDeleteOrder} clientName={selectedClient?.company_name || selectedClient?.name || ''} orderTotal={existingOrder.total || 0} orderItemsCount={existingOrder.items?.length || 0} />}
    </div>;
};
export default PlaceOrder;