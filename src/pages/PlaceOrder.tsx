
import React from 'react';
import { ArrowLeft, Search, ShoppingCart, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Package, DollarSign, CheckCircle, Settings } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useOrderManagement } from '@/hooks/useOrderManagement';
import { useProductSelection } from '@/hooks/useProductSelection';
import { useClientSelection } from '@/hooks/useClientSelection';
import ClientSelectionModal from '@/components/order/ClientSelectionModal';
import ProductSearchDialog from '@/components/order/ProductSearchDialog';
import OrderChoiceModal from '@/components/order/OrderChoiceModal';

const PlaceOrder = () => {
  const { goBack } = useAppNavigation();
  const location = useLocation();
  
  // Extract client data from navigation state
  const { clientName, clientId } = location.state || {};
  
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
    finishOrder,
    viewOrder
  } = useOrderManagement();

  const {
    products,
    selectedProduct,
    quantity,
    unitPrice,
    searchTerm,
    selectProduct,
    setQuantity,
    setUnitPrice,
    setSearchTerm,
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
    setShowOrderChoice,
    selectClient,
    handleEditOrder,
    handleCreateNew,
    handleDeleteOrder
  } = useClientSelection(initialClient);

  const [showProductSearch, setShowProductSearch] = React.useState(false);
  const [currentProductIndex, setCurrentProductIndex] = React.useState(0);

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

  const currentProduct = selectedProduct || products[currentProductIndex];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header laranja estilo POS */}
      <div className="bg-orange-500 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={goBack}
            className="text-white hover:bg-orange-600 p-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-lg font-bold">Digitação de Pedidos</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Cliente Info Bar */}
      {selectedClient && (
        <div className="bg-blue-600 text-white px-4 py-2 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold">{selectedClient.id}</span> - {selectedClient.company_name || selectedClient.name}
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowClientSelection(true)}
              className="text-white hover:bg-blue-700 text-xs px-2 py-1 h-6"
            >
              Alterar
            </Button>
          </div>
        </div>
      )}

      {/* Selecionar Cliente */}
      {!selectedClient && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4">
          <div className="flex items-center justify-between">
            <span className="text-yellow-800">Nenhum cliente selecionado</span>
            <Button
              onClick={() => setShowClientSelection(true)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm"
            >
              Selecionar Cliente
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 p-4 space-y-4">
        {/* Produto atual e navegação */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Produto</h2>
            <div className="text-sm text-gray-600">
              {products.length > 0 && `${currentProductIndex + 1} de ${products.length}`}
            </div>
          </div>

          {/* Navegação de produtos */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            <Button
              variant="outline"
              onClick={() => handleProductNavigation('first')}
              disabled={products.length === 0}
            >
              <ChevronsLeft size={16} />
            </Button>
            <Button
              variant="outline"
              onClick={() => handleProductNavigation('prev')}
              disabled={products.length === 0}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              onClick={() => setShowProductSearch(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Search size={16} className="mr-1" />
              Consultar
            </Button>
            <Button
              variant="outline"
              onClick={() => handleProductNavigation('next')}
              disabled={products.length === 0}
            >
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="outline"
              onClick={() => handleProductNavigation('last')}
              disabled={products.length === 0}
            >
              <ChevronsRight size={16} />
            </Button>
          </div>

          {/* Informações do produto atual */}
          {currentProduct && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Package size={20} className="text-blue-600" />
                  <div>
                    <div className="font-semibold">{currentProduct.code} - {currentProduct.name}</div>
                    <div className="text-sm text-gray-600">
                      Estoque: {currentProduct.stock} {currentProduct.unit || 'UN'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalhes do produto em grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="text-xs text-gray-600">Preço Unitário</div>
                    <div className="font-semibold text-blue-700">
                      R$ {(currentProduct.sale_price || currentProduct.price || 0).toFixed(2)}
                    </div>
                  </div>
                  {currentProduct.min_price && currentProduct.min_price > 0 && (
                    <div className="bg-yellow-50 p-2 rounded">
                      <div className="text-xs text-gray-600">Preço Mínimo</div>
                      <div className="font-semibold text-yellow-700">
                        R$ {currentProduct.min_price.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="bg-green-50 p-2 rounded">
                    <div className="text-xs text-gray-600">Unidade</div>
                    <div className="font-semibold text-green-700">
                      {currentProduct.unit || 'UN'}
                    </div>
                  </div>
                  {currentProduct.has_subunit && currentProduct.subunit && (
                    <div className="bg-purple-50 p-2 rounded">
                      <div className="text-xs text-gray-600">Sub-unidade</div>
                      <div className="font-semibold text-purple-700">
                        {currentProduct.subunit} (1:{currentProduct.subunit_ratio || 1})
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quantidade e Valor */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    min="1"
                    className="text-center font-semibold text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Unitário</label>
                  <Input
                    type="number"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="text-center font-semibold text-lg"
                  />
                </div>
              </div>

              {/* Total do item */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-green-900">Total do Item:</span>
                  <span className="font-bold text-green-600 text-lg">
                    R$ {(quantity * unitPrice).toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                onClick={addProduct}
                disabled={!currentProduct || quantity <= 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
              >
                <Package size={18} className="mr-2" />
                Adicionar ao Pedido
              </Button>
            </div>
          )}
        </div>

        {/* Lista de itens do pedido */}
        {orderItems.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">Itens do Pedido ({orderItems.length})</h3>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded border">
                    <div className="flex-1">
                      <div className="font-medium">{item.code} - {item.productName}</div>
                      <div className="text-sm text-gray-600">
                        {item.quantity} {item.unit} × R$ {item.price.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-green-600">
                        R$ {(item.quantity * item.price).toFixed(2)}
                      </span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeOrderItem(item.id)}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Totais */}
        {orderItems.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold">Total Bruto:</span>
                <span className="font-bold text-blue-600">R$ {calculateTotal()}</span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold">Total Líquido:</span>
                <span className="font-bold text-green-600">R$ {calculateTotal()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botões de ação */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            onClick={viewOrder}
            disabled={orderItems.length === 0}
            className="flex items-center justify-center gap-2"
          >
            <Settings size={16} />
            Opções
          </Button>
          
          <Button
            onClick={clearCart}
            disabled={orderItems.length === 0}
            className="flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            <DollarSign size={16} />
            Gravar
          </Button>
          
          <Button
            onClick={() => finishOrder(selectedClient)}
            disabled={!selectedClient || orderItems.length === 0 || isSubmitting}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <CheckCircle size={16} />
            )}
            Fin. Pedido
          </Button>
        </div>
      </div>

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
