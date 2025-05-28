
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, Search, Trash2, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
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
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');

  const { salesRep, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const loadClients = useCallback(async () => {
    if (!salesRep?.id) {
      console.log('❌ loadClients - salesRep não disponível ainda');
      return;
    }

    console.log('🔄 loadClients - Iniciando carregamento de clientes...');
    setIsLoadingClients(true);
    try {
      const db = getDatabaseAdapter();
      const allClients = await db.getClients();
      
      // Filtrar clientes do vendedor logado
      const salesRepClients = allClients.filter(client => 
        client.sales_rep_id === salesRep.id
      );
      
      setClients(salesRepClients);
      console.log(`✅ loadClients - Clientes carregados: ${salesRepClients.length}`);
      
    } catch (error) {
      console.error('❌ loadClients - Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setIsLoadingClients(false);
    }
  }, [salesRep?.id]);

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

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
    (client.company_name && client.company_name.toLowerCase().includes(clientSearchQuery.toLowerCase()))
  );

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchQuery.toLowerCase())
  );

  const handleClientSelect = (client: Client) => {
    if (!salesRep?.id || client.sales_rep_id !== salesRep.id) {
      toast.error('Cliente selecionado não pertence ao seu portfólio.');
      return;
    }
    
    setSelectedClient(client);
    setShowClientSearch(false);
    setClientSearchQuery('');
  };

  const handleProductSelect = (product: Product) => {
    const existingItemIndex = orderItems.findIndex(item => item.product_id === product.id);
    
    if (existingItemIndex !== -1) {
      // Atualizar quantidade se o item já existe
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].total_price = updatedItems[existingItemIndex].quantity * product.price;
      setOrderItems(updatedItems);
    } else {
      // Adicionar novo item ao pedido
      const newItem: OrderItem = {
        id: Date.now().toString(),
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
        total_price: product.price
      };
      setOrderItems([...orderItems, newItem]);
    }
    
    setShowProductSearch(false);
    setProductSearchQuery('');
    toast.success('Produto adicionado ao pedido');
  };

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItemFromOrder(itemId);
      return;
    }
    
    const updatedItems = orderItems.map(item => {
      if (item.id === itemId) {
        return { 
          ...item, 
          quantity: newQuantity, 
          total_price: newQuantity * item.unit_price 
        };
      }
      return item;
    });
    setOrderItems(updatedItems);
  };

  const removeItemFromOrder = (itemId: string) => {
    const updatedItems = orderItems.filter(item => item.id !== itemId);
    setOrderItems(updatedItems);
    toast.success('Item removido do pedido');
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
      </div>

      {/* Client Info Bar */}
      <div className="bg-blue-600 text-white px-4 py-2">
        {selectedClient ? (
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold">{selectedClient.code || 'S/N'}</span> - {selectedClient.company_name || selectedClient.name}
            </div>
            <AppButton 
              variant="gray" 
              size="sm"
              onClick={() => setShowClientSearch(true)}
            >
              Alterar
            </AppButton>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span>Nenhum cliente selecionado</span>
            <AppButton 
              variant="gray" 
              size="sm"
              onClick={() => setShowClientSearch(true)}
            >
              Selecionar Cliente
            </AppButton>
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className="bg-white mx-4 mt-4 rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Itens do Pedido ({orderItems.length})</h3>
        </div>
        
        {orderItems.length > 0 ? (
          <div className="divide-y">
            {orderItems.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium">{item.product_name}</div>
                  <div className="text-sm text-gray-500">
                    R$ {item.unit_price.toFixed(2)} x {item.quantity} = R$ {item.total_price.toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-12 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeItemFromOrder(item.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            Nenhum item adicionado ao pedido
          </div>
        )}
      </div>

      {/* Add Product Button */}
      <div className="px-4 py-4">
        <AppButton 
          onClick={() => setShowProductSearch(true)}
          className="w-full flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Produto
        </AppButton>
      </div>

      {/* Order Summary */}
      <div className="bg-white mx-4 mb-4 rounded-lg border p-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold">Total:</span>
          <span className="text-xl font-bold text-green-600">
            R$ {calculateTotal().toFixed(2)}
          </span>
        </div>
        <AppButton 
          onClick={handleCreateOrder}
          disabled={!selectedClient || orderItems.length === 0}
          className="w-full"
          variant="blue"
        >
          Criar Pedido
        </AppButton>
      </div>

      {/* Client Search Modal */}
      {showClientSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Selecionar Cliente</h3>
              <button 
                onClick={() => setShowClientSearch(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={clientSearchQuery}
                  onChange={(e) => setClientSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {isLoadingClients ? (
                <div className="text-center py-4">Carregando clientes...</div>
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleClientSelect(client)}
                    className="w-full text-left p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="font-medium">
                      {client.company_name || client.name}
                    </div>
                    {client.company_name && (
                      <div className="text-sm text-gray-500">
                        Razão Social: {client.name}
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Nenhum cliente encontrado
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Search Modal */}
      {showProductSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Adicionar Produto</h3>
              <button 
                onClick={() => setShowProductSearch(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar produto..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {isLoadingProducts ? (
                <div className="text-center py-4">Carregando produtos...</div>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className="w-full text-left p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">
                          Código: {product.code || 'S/C'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-blue-600">
                          R$ {product.price.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Estoque: {product.stock || 0}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Nenhum produto encontrado
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceOrder;
