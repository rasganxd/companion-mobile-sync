
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Plus, ShoppingCart, Users } from 'lucide-react';
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
  code: string;
  price: number;
  unit: string;
  has_subunit?: boolean;
  subunit?: string;
  subunit_ratio?: number;
}

interface OrderItem {
  id: number;
  productId: string;
  productName: string;
  code: string;
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
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [quantity, setQuantity] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<'main' | 'sub'>('main');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showClientSelection, setShowClientSelection] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const locationState = location.state as any;
  const currentProduct = products[currentProductIndex];
  const { unitPrice, displayUnit, mainUnit, subUnit, ratio } = useProductPricing(currentProduct);

  // Carregar dados iniciais
  useEffect(() => {
    if (salesRep?.id) {
      loadData();
    }
  }, [salesRep?.id]);

  // Cliente pré-selecionado
  useEffect(() => {
    if (locationState?.clientId && clients.length > 0) {
      const preSelectedClient = clients.find(c => c.id === locationState.clientId);
      if (preSelectedClient) {
        setSelectedClient(preSelectedClient);
      }
    }
  }, [locationState?.clientId, clients]);

  // Itens existentes
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
          await db.saveProducts(supabaseProducts);
          setProducts(supabaseProducts);
        }
      } else {
        setProducts(localProducts);
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
        paymentMethod: 'A definir',
        clientId: selectedClient.id,
        clientName: selectedClient.name
      }
    });
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
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
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-gray-600">Cliente Selecionado:</Label>
                {selectedClient ? (
                  <div>
                    <p className="font-medium text-lg">{selectedClient.name}</p>
                    {selectedClient.company_name && selectedClient.company_name !== selectedClient.name && (
                      <p className="text-sm text-gray-600">{selectedClient.company_name}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">Nenhum cliente selecionado</p>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowClientSelection(true)}
              >
                <Users size={16} className="mr-2" />
                {selectedClient ? 'Alterar' : 'Selecionar'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Seção do Produto */}
        {products.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-600">Produto:</Label>
                  <div className="flex gap-2">
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
                
                {currentProduct && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                        {currentProduct.code}
                      </span>
                      <h3 className="font-medium">{currentProduct.name}</h3>
                    </div>
                    
                    {/* Unidades */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label className="text-sm">Unidade de Venda:</Label>
                        <p className="text-sm font-medium">{displayUnit}</p>
                      </div>
                      <div>
                        <Label className="text-sm">Preço Unitário:</Label>
                        <p className="text-sm font-medium">R$ {unitPrice.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    {/* Seletor de Unidade (se houver subunidade) */}
                    {currentProduct.has_subunit && subUnit && (
                      <div className="mb-4">
                        <Label className="text-sm">Unidade:</Label>
                        <Select value={selectedUnit} onValueChange={(value: 'main' | 'sub') => setSelectedUnit(value)}>
                          <SelectTrigger className="mt-1">
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
                    
                    {/* Quantidade e Preço */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label className="text-sm">Quantidade:</Label>
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="0"
                          min="0"
                          step="0.01"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Preço (opcional):</Label>
                        <Input
                          type="number"
                          value={customPrice}
                          onChange={(e) => setCustomPrice(e.target.value)}
                          placeholder={unitPrice.toFixed(2)}
                          min="0"
                          step="0.01"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    {quantity && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total do Item:</span>
                          <span className="text-lg font-bold text-blue-600">
                            R$ {calculateItemTotal()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão Gravar Item */}
        <Button 
          onClick={addItem}
          className="w-full"
          disabled={!selectedClient || !currentProduct || !quantity}
        >
          <Plus size={16} className="mr-2" />
          Gravar Item
        </Button>

        {/* Lista de Itens */}
        {orderItems.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <Label className="text-sm font-medium text-gray-600 block mb-3">
                Itens do Pedido ({orderItems.length}):
              </Label>
              <div className="space-y-2">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.productName}</p>
                      <p className="text-xs text-gray-600">
                        {item.quantity} {item.unit} × R$ {item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">R$ {(item.quantity * item.price).toFixed(2)}</span>
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
                
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total do Pedido:</span>
                    <span className="text-xl font-bold text-blue-600">
                      R$ {getTotalValue().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão Finalizar */}
        {orderItems.length > 0 && (
          <Button 
            onClick={finishOrder}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <ShoppingCart size={16} className="mr-2" />
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                    setSearchTerm('');
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
