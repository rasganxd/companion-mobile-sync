
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import ClientSection from '@/components/order/ClientSection';
import ProductSection from '@/components/order/ProductSection';
import OrderItemsList from '@/components/order/OrderItemsList';
import ActionButtons from '@/components/order/ActionButtons';
import ClientSelectionModal from '@/components/order/ClientSelectionModal';
import OrderChoiceModal from '@/components/order/OrderChoiceModal';
import { useOrderManagement } from '@/hooks/useOrderManagement';
import { useProductSelection } from '@/hooks/useProductSelection';
import { useClientSelection } from '@/hooks/useClientSelection';

const PlaceOrder = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Estado do cliente passado via navegação
  const { clientId, clientName } = location.state || {};
  
  // Custom hooks
  const {
    orderItems,
    isSubmitting,
    addOrderItem,
    removeOrderItem,
    clearCart,
    calculateTotal,
    finishOrder,
    viewOrder
  } = useOrderManagement();

  const {
    products,
    selectedProduct,
    quantity,
    unitPrice,
    selectProduct,
    setQuantity,
    setUnitPrice,
    addProduct
  } = useProductSelection(addOrderItem);

  const {
    selectedClient,
    showClientSelection,
    clientSearchTerm,
    showOrderChoice,
    existingOrder,
    filteredClients,
    setSelectedClient,
    setShowClientSelection,
    setClientSearchTerm,
    selectClient,
    handleEditOrder,
    handleCreateNew,
    handleDeleteOrder
  } = useClientSelection();

  useEffect(() => {
    // Se veio com cliente específico, configurar automaticamente
    if (clientId && clientName) {
      setSelectedClient({
        id: clientId,
        name: clientName
      });
    }
  }, [clientId, clientName, setSelectedClient]);

  const handleGoBack = () => {
    if (orderItems.length > 0) {
      if (confirm('Você tem itens no carrinho. Deseja realmente sair?')) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

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
            onSelectProduct={selectProduct}
            onQuantityChange={setQuantity}
            onUnitPriceChange={setUnitPrice}
            onAddProduct={addProduct}
          />
        </div>
        
        {/* Lista de Itens do Pedido */}
        <OrderItemsList
          orderItems={orderItems}
          onRemoveItem={removeOrderItem}
          calculateTotal={calculateTotal}
        />
        
        {/* Botões de Ação */}
        <ActionButtons
          orderItems={orderItems}
          onClearCart={clearCart}
          onGoBack={handleGoBack}
          onViewOrder={viewOrder}
          onFinishOrder={() => finishOrder(selectedClient)}
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
        onSelectClient={selectClient}
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
