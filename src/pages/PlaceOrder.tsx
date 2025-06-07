
import React from 'react';
import { ArrowLeft, Search, ShoppingCart, Eye } from 'lucide-react';
import Header from '@/components/Header';
import AppButton from '@/components/AppButton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useOrderManagement } from '@/hooks/useOrderManagement';
import { useProductSelection } from '@/hooks/useProductSelection';
import { useClientSelection } from '@/hooks/useClientSelection';
import ClientSelectionModal from '@/components/order/ClientSelectionModal';
import ProductSearchDialog from '@/components/order/ProductSearchDialog';
import OrderItemsList from '@/components/order/OrderItemsList';
import OrderChoiceModal from '@/components/order/OrderChoiceModal';
import ActionButtons from '@/components/order/ActionButtons';

const PlaceOrder = () => {
  const { goBack } = useAppNavigation();
  
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
    addProduct,
    clearSelection
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
    selectClient,
    handleEditOrder,
    handleCreateNew,
    handleDeleteOrder
  } = useClientSelection();

  const [showProductSearch, setShowProductSearch] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="Novo Pedido" showBackButton backgroundColor="blue" />
      
      <div className="flex-1 p-4">
        <ScrollArea className="h-full">
          <div className="space-y-6">
            {/* Client Section */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Cliente</h2>
              
              {selectedClient ? (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {selectedClient.company_name || selectedClient.name}
                      </p>
                      {selectedClient.company_name && selectedClient.name && (
                        <p className="text-sm text-gray-600">
                          Razão Social: {selectedClient.name}
                        </p>
                      )}
                    </div>
                    <AppButton
                      variant="gray"
                      onClick={() => setSelectedClient(null)}
                      className="text-xs px-2 py-1"
                    >
                      Alterar
                    </AppButton>
                  </div>
                </div>
              ) : (
                <AppButton
                  variant="gray"
                  fullWidth
                  onClick={() => setShowClientSelection(true)}
                  className="flex items-center justify-center gap-2"
                >
                  <Search size={18} />
                  <span>Selecionar Cliente</span>
                </AppButton>
              )}
            </div>

            {/* Product Section */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Produto</h2>
              
              <AppButton
                variant="blue"
                fullWidth
                onClick={() => setShowProductSearch(true)}
                className="flex items-center justify-center gap-2 mb-4"
              >
                <Search size={18} />
                <span>Buscar Produto</span>
              </AppButton>

              {selectedProduct && (
                <div className="p-3 bg-gray-50 rounded-lg border mb-4">
                  <p className="font-medium text-gray-900 mb-2">{selectedProduct.name}</p>
                  <p className="text-sm text-gray-600 mb-2">Código: {selectedProduct.code}</p>
                  <p className="text-sm text-gray-600 mb-3">
                    Preço: R$ {selectedProduct.price.toFixed(2)}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantidade
                      </label>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preço Unitário
                      </label>
                      <input
                        type="number"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(parseFloat(e.target.value) || selectedProduct.price)}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <AppButton
                      variant="blue"
                      onClick={addProduct}
                      className="flex-1"
                    >
                      Adicionar ao Pedido
                    </AppButton>
                    <AppButton
                      variant="gray"
                      onClick={clearSelection}
                    >
                      Cancelar
                    </AppButton>
                  </div>
                </div>
              )}
            </div>

            {/* Order Items */}
            <OrderItemsList
              items={orderItems}
              onRemoveItem={removeOrderItem}
              total={calculateTotal()}
            />
          </div>
        </ScrollArea>
      </div>

      {/* Action Buttons */}
      <ActionButtons
        selectedClient={selectedClient}
        orderItems={orderItems}
        isSubmitting={isSubmitting}
        onFinishOrder={() => finishOrder(selectedClient)}
        onViewOrder={viewOrder}
        onClearCart={clearCart}
        onGoBack={goBack}
      />

      {/* Modals */}
      <ClientSelectionModal
        isOpen={showClientSelection}
        onClose={() => setShowClientSelection(false)}
        clients={filteredClients}
        searchTerm={clientSearchTerm}
        onSearchChange={setClientSearchTerm}
        onSelectClient={selectClient}
      />

      <ProductSearchDialog
        isOpen={showProductSearch}
        onClose={() => setShowProductSearch(false)}
        products={products}
        onSelectProduct={selectProduct}
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
