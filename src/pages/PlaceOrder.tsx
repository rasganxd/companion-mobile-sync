import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Plus, ShoppingCart, Users, Search } from 'lucide-react';
import { toast } from 'sonner';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProductPricing } from '@/hooks/useProductPricing';

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
  const [customPrice, setCustomPrice] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<'main' | 'sub'>('main');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showClientSelection, setShowClientSelection] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');

  const locationState = location.state as any;
  const currentProduct = products[currentProductIndex];
  const { unitPrice, displayUnit, mainUnit, subUnit, ratio } = useProductPricing(currentProduct);

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

  const navigateProduct = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentProductIndex > 0) {
      setCurrentProductIndex(currentProductIndex - 1);
    } else if (direction === 'next' && currentProductIndex < products.length - 1) {
      setCurrentProductIndex(currentProductIndex + 1);
    }
    
    // Reset form
    setQuantity('');
    setCustomPrice('');
    setSelectedUnit('main');
  };

  const handleProductSearch = () => {
    setShowProductSearch(!showProductSearch);
    setProductSearchTerm('');
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  const selectProduct = (product: Product) => {
    const productIndex = products.findIndex(p => p.id === product.id);
    if (productIndex !== -1) {
      setCurrentProductIndex(productIndex);
      setShowProductSearch(false);
      setProductSearchTerm('');
      // Reset form
      setQuantity('');
      setCustomPrice('');
      setSelectedUnit('main');
    }
  };

  const calculateItemTotal = () => {
    const qty = parseFloat(quantity) || 0;
    const price = customPrice ? parseFloat(customPrice) : unitPrice;
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
    
    const price = customPrice ? parseFloat(customPrice) : unitPrice;
    if (price <= 0) {
      toast.error('Preço deve ser maior que zero');
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
    
    // Reset form
    setQuantity('');
    setCustomPrice('');
    setSelectedUnit('main');
    
    toast.success('Item adicionado ao pedido');
  };

  const removeItem = (itemId: number) => {
    setOrderItems(orderItems.filter(item => item.id !== itemId));
    toast.success('Item removido');
  };

  const getTotalValue = () => {
    return orderItems.reduce((total, item) => total + (item.quantity * item.price), 0);
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
      
      <div className="p-4 flex-1 space-y-4">
        {/* Seção do Cliente */}
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-600 block mb-1">Cliente:</Label>
                {selectedClient ? (
                  <div>
                    <p className="font-semibold text-lg text-gray-900">{selectedClient.name}</p>
                    {selectedClient.company_name && selectedClient.company_name !== selectedClient.name && (
                      <p className="text-sm text-gray-600">{selectedClient.company_name}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Nenhum cliente selecionado</p>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowClientSelection(true)}
                className="ml-4"
              >
                <Users size={16} className="mr-1" />
                {selectedClient ? 'Alterar' : 'Selecionar'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Seção da Forma de Pagamento */}
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <Label className="text-sm font-medium text-gray-600 block mb-3">Forma de Pagamento:</Label>
            <Select 
              value={selectedPaymentTable?.id || 'none'} 
              onValueChange={(value) => {
                if (value === 'none') {
                  setSelectedPaymentTable(null);
                } else {
                  const table = paymentTables.find(t => t.id === value);
                  setSelectedPaymentTable(table || null);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">A definir</SelectItem>
                {paymentTables.map((table) => (
                  <SelectItem key={table.id} value={table.id}>
                    <div>
                      <div className="font-medium">{table.name}</div>
                      {table.description && (
                        <div className="text-sm text-gray-500">{table.description}</div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPaymentTable && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                <p className="font-medium">{selectedPaymentTable.name}</p>
                {selectedPaymentTable.description && (
                  <p className="text-gray-600">{selectedPaymentTable.description}</p>
                )}
                {selectedPaymentTable.type && (
                  <p className="text-gray-600">Tipo: {selectedPaymentTable.type}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seção do Produto */}
        {products.length > 0 && (
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 space-y-4">
              {/* Navegação e Busca de Produto */}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-600">Produto:</Label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleProductSearch}
                    className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                  >
                    <Search size={16} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigateProduct('prev')}
                    disabled={currentProductIndex === 0}
                  >
                    <ArrowLeft size={16} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigateProduct('next')}
                    disabled={currentProductIndex === products.length - 1}
                  >
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </div>

              {/* Busca de Produto */}
              {showProductSearch && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <Input
                    placeholder="Digite o nome do produto..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    className="mb-3"
                    autoFocus
                  />
                  {productSearchTerm && (
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {filteredProducts.slice(0, 8).map((product) => (
                        <div
                          key={product.id}
                          className="p-2 bg-white rounded border hover:bg-blue-50 cursor-pointer"
                          onClick={() => selectProduct(product)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-sm">{product.name}</p>
                              <p className="text-xs text-gray-600">Código: {product.code}</p>
                            </div>
                            <p className="text-sm font-semibold text-blue-600">
                              R$ {product.price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                      {filteredProducts.length === 0 && (
                        <p className="text-center text-gray-500 py-2">Nenhum produto encontrado</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Informações do Produto Atual */}
              {currentProduct && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-gray-200 px-3 py-1 rounded text-sm font-mono">
                      {currentProduct.code}
                    </span>
                    <h3 className="font-semibold text-lg text-gray-900">{currentProduct.name}</h3>
                  </div>
                  
                  {/* Informações de Unidade e Preço */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-sm text-gray-600">Unidade:</Label>
                      <p className="font-medium">{displayUnit}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Preço:</Label>
                      <p className="font-medium text-blue-600">R$ {unitPrice.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {/* Seletor de Unidade (se houver subunidade) */}
                  {currentProduct.has_subunit && subUnit && (
                    <div className="mb-4">
                      <Label className="text-sm text-gray-600 block mb-2">Tipo de Unidade:</Label>
                      <Select value={selectedUnit} onValueChange={(value: 'main' | 'sub') => setSelectedUnit(value)}>
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sub">{subUnit}</SelectItem>
                          <SelectItem value="main">{mainUnit}</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        1 {mainUnit} = {ratio} {subUnit}
                      </p>
                    </div>
                  )}
                  
                  {/* Campos de Quantidade e Preço */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-sm text-gray-600 block mb-1">Quantidade:</Label>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="text-center font-medium"
                        autoFocus
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600 block mb-1">Preço (opcional):</Label>
                      <Input
                        type="number"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        placeholder={unitPrice.toFixed(2)}
                        min="0"
                        step="0.01"
                        className="text-center font-medium"
                      />
                    </div>
                  </div>
                  
                  {/* Total do Item */}
                  {quantity && (
                    <div className="bg-blue-100 p-3 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Total do Item:</span>
                        <span className="text-xl font-bold text-blue-700">
                          R$ {calculateItemTotal()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Botão Gravar Item */}
        <Button 
          onClick={addItem}
          className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-semibold"
          disabled={!selectedClient || !currentProduct || !quantity}
        >
          <Plus size={20} className="mr-2" />
          Gravar Item
        </Button>

        {/* Lista de Itens */}
        {orderItems.length > 0 && (
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <Label className="text-sm font-medium text-gray-600 block mb-3">
                Itens do Pedido ({orderItems.length}):
              </Label>
              <div className="space-y-2 mb-4">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded border">
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} {item.unit} × R$ {item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-green-600">R$ {(item.quantity * item.price).toFixed(2)}</span>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => removeItem(item.id)}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total do Pedido:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    R$ {getTotalValue().toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão Finalizar */}
        {orderItems.length > 0 && (
          <Button 
            onClick={finishOrder}
            className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-semibold"
            size="lg"
          >
            <ShoppingCart size={20} className="mr-2" />
            Finalizar Pedido
          </Button>
        )}

        <div className="h-20"></div>
      </div>

      {/* Dialog de Seleção de Cliente */}
      {showClientSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Selecionar Cliente</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowClientSelection(false)}
                >
                  ✕
                </Button>
              </div>
              <Input
                placeholder="Buscar cliente..."
                value={clientSearchTerm}
                onChange={(e) => setClientSearchTerm(e.target.value)}
              />
            </div>
            <div className="overflow-y-auto max-h-96">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="p-3 border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedClient(client);
                    setShowClientSelection(false);
                    setClientSearchTerm('');
                  }}
                >
                  <p className="font-medium">{client.name}</p>
                  {client.company_name && client.company_name !== client.name && (
                    <p className="text-sm text-gray-600">{client.company_name}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceOrder;
