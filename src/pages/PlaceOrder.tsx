import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Search, Package, Plus, ShoppingCart, Save, FileText } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useLocation } from 'react-router-dom';

interface Client {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  sales_rep_id?: string;
}

interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  unit: string;
  description?: string;
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
  const { navigateTo } = useAppNavigation();
  const location = useLocation();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [customPrice, setCustomPrice] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const locationState = location.state as any;

  // ✅ NOVO: Função para buscar clientes do Supabase com fallback
  const loadClientsWithFallback = async () => {
    if (!salesRep?.id) {
      console.warn('⚠️ Não há vendedor autenticado');
      return [];
    }

    try {
      const db = getDatabaseAdapter();
      let localClients = await db.getClients();
      
      console.log('🔍 Clientes no localStorage:', localClients.length);
      
      // Filtrar clientes do vendedor logado
      const salesRepClients = localClients.filter(client => client.sales_rep_id === salesRep.id);
      
      // ✅ FALLBACK: Se não há clientes locais ou poucos clientes, buscar do Supabase
      if (salesRepClients.length === 0) {
        console.log('🌐 localStorage vazio ou sem clientes do vendedor, buscando do Supabase...');
        
        const { data: supabaseClients, error } = await supabase
          .from('customers')
          .select('*')
          .eq('sales_rep_id', salesRep.id)
          .eq('active', true);
        
        if (error) {
          console.error('❌ Erro ao buscar clientes do Supabase:', error);
          toast.error('Erro ao carregar clientes do servidor');
          return salesRepClients;
        }
        
        if (supabaseClients && supabaseClients.length > 0) {
          console.log(`✅ Encontrados ${supabaseClients.length} clientes no Supabase`);
          
          // Sincronizar com localStorage
          if (db.saveClients) {
            await db.saveClients(supabaseClients);
            console.log('💾 Clientes sincronizados com localStorage');
          }
          
          return supabaseClients;
        } else {
          console.log('⚠️ Nenhum cliente encontrado no Supabase para este vendedor');
          toast.warning('Você não possui clientes atribuídos. Entre em contato com o administrador.');
          return [];
        }
      }
      
      console.log(`✅ Usando ${salesRepClients.length} clientes do localStorage`);
      return salesRepClients;
      
    } catch (error) {
      console.error('❌ Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar lista de clientes');
      return [];
    }
  };

  // ✅ NOVO: Função para buscar produtos do Supabase com fallback
  const loadProductsWithFallback = async () => {
    try {
      const db = getDatabaseAdapter();
      let localProducts = await db.getProducts();
      
      console.log('🔍 Produtos no localStorage:', localProducts.length);
      
      // ✅ FALLBACK: Se não há produtos locais, buscar do Supabase
      if (localProducts.length === 0) {
        console.log('🌐 localStorage vazio, buscando produtos do Supabase...');
        
        const { data: supabaseProducts, error } = await supabase
          .from('products')
          .select('*')
          .order('name');
        
        if (error) {
          console.error('❌ Erro ao buscar produtos do Supabase:', error);
          toast.error('Erro ao carregar produtos do servidor');
          return localProducts;
        }
        
        if (supabaseProducts && supabaseProducts.length > 0) {
          console.log(`✅ Encontrados ${supabaseProducts.length} produtos no Supabase`);
          
          // Sincronizar com localStorage
          if (db.saveProducts) {
            await db.saveProducts(supabaseProducts);
            console.log('💾 Produtos sincronizados com localStorage');
          }
          
          return supabaseProducts;
        } else {
          console.log('⚠️ Nenhum produto encontrado no Supabase');
          return [];
        }
      }
      
      console.log(`✅ Usando ${localProducts.length} produtos do localStorage`);
      return localProducts;
      
    } catch (error) {
      console.error('❌ Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar lista de produtos');
      return [];
    }
  };

  // ✅ ATUALIZADO: Carregar dados com fallback
  const loadData = async () => {
    setIsLoadingData(true);
    try {
      console.log('🔄 Iniciando carregamento de dados...');
      
      // Carregar clientes e produtos em paralelo
      const [clientsData, productsData] = await Promise.all([
        loadClientsWithFallback(),
        loadProductsWithFallback()
      ]);
      
      console.log('📊 Dados carregados:', {
        clients: clientsData.length,
        products: productsData.length,
        salesRepId: salesRep?.id
      });
      
      setClients(clientsData);
      setProducts(productsData);
      
      // ✅ CORRIGIDO: Buscar cliente pré-selecionado após carregar os dados
      if (locationState?.clientId && clientsData.length > 0) {
        const preSelectedClient = clientsData.find(c => c.id === locationState.clientId);
        
        if (preSelectedClient) {
          console.log('✅ Cliente pré-selecionado encontrado:', preSelectedClient.name);
          console.log('🔍 Dados do cliente:', {
            id: preSelectedClient.id,
            name: preSelectedClient.name,
            sales_rep_id: preSelectedClient.sales_rep_id,
            expectedSalesRepId: salesRep?.id
          });
          
          setSelectedClient(preSelectedClient);
        } else {
          console.warn('❌ Cliente pré-selecionado não encontrado na lista carregada');
          console.log('🔍 Cliente procurado:', locationState.clientId);
          console.log('🔍 Clientes disponíveis:', clientsData.map(c => ({ id: c.id, name: c.name })));
        }
      }
      
    } catch (error) {
      console.error('❌ Erro no carregamento de dados:', error);
      toast.error('Erro ao carregar dados necessários');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (salesRep?.id) {
      loadData();
    }
  }, [salesRep?.id]);

  useEffect(() => {
    // Carregar dados existentes se houver
    if (locationState?.existingOrderItems) {
      setOrderItems(locationState.existingOrderItems);
    }
    if (locationState?.paymentMethod) {
      setPaymentMethod(locationState.paymentMethod);
    }
  }, [locationState]);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  const addProductToOrder = () => {
    if (!selectedProduct) {
      toast.error('Selecione um produto');
      return;
    }

    if (quantity <= 0) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }

    const price = customPrice ? parseFloat(customPrice) : selectedProduct.price;
    
    if (price <= 0) {
      toast.error('Preço deve ser maior que zero');
      return;
    }

    const newItem: OrderItem = {
      id: Date.now(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      code: selectedProduct.code,
      quantity,
      price,
      unit: selectedProduct.unit
    };

    setOrderItems([...orderItems, newItem]);
    setSelectedProduct(null);
    setQuantity(1);
    setCustomPrice('');
    setShowProductDialog(false);
    toast.success('Produto adicionado ao pedido');
  };

  const removeItem = (itemId: number) => {
    setOrderItems(orderItems.filter(item => item.id !== itemId));
    toast.success('Item removido do pedido');
  };

  const updateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) return;
    
    setOrderItems(orderItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const updatePrice = (itemId: number, newPrice: number) => {
    if (newPrice <= 0) return;
    
    setOrderItems(orderItems.map(item =>
      item.id === itemId ? { ...item, price: newPrice } : item
    ));
  };

  const getTotalValue = () => {
    return orderItems.reduce((total, item) => total + (item.quantity * item.price), 0);
  };

  // ✅ CORRIGIDO: Validação com logs mais detalhados
  const validateOrder = (): boolean => {
    console.log('🔍 Validando pedido...');
    
    if (!selectedClient) {
      console.error('❌ Validação falhou: Nenhum cliente selecionado');
      toast.error('Selecione um cliente');
      return false;
    }

    console.log('🔍 Dados do cliente selecionado:', {
      id: selectedClient.id,
      name: selectedClient.name,
      sales_rep_id: selectedClient.sales_rep_id,
      currentSalesRepId: salesRep?.id
    });

    // ✅ VALIDAÇÃO MAIS ROBUSTA: Verificar se o cliente pertence ao vendedor
    if (!selectedClient.sales_rep_id) {
      console.error('❌ Validação falhou: Cliente sem sales_rep_id definido');
      toast.error('Cliente com dados incompletos. Tente sincronizar os dados.');
      return false;
    }

    if (selectedClient.sales_rep_id !== salesRep?.id) {
      console.error('❌ Validação falhou: Cliente não pertence ao vendedor atual');
      console.error('🔍 Detalhes:', {
        clientSalesRepId: selectedClient.sales_rep_id,
        currentSalesRepId: salesRep?.id,
        clientName: selectedClient.name
      });
      toast.error('Cliente selecionado não pertence ao seu portfólio');
      return false;
    }

    if (orderItems.length === 0) {
      console.error('❌ Validação falhou: Nenhum produto no pedido');
      toast.error('Adicione pelo menos um produto ao pedido');
      return false;
    }

    if (!salesRep?.id) {
      console.error('❌ Validação falhou: Vendedor não identificado');
      toast.error('Vendedor não identificado. Faça login novamente.');
      return false;
    }

    console.log('✅ Validação do pedido passou com sucesso');
    return true;
  };

  const saveOrder = async () => {
    if (!validateOrder()) return;

    setIsLoading(true);
    try {
      const db = getDatabaseAdapter();
      
      console.log('💾 Salvando pedido:', {
        clientId: selectedClient!.id,
        clientName: selectedClient!.name,
        salesRepId: salesRep!.id,
        salesRepName: salesRep!.name,
        itemsCount: orderItems.length,
        total: getTotalValue()
      });

      const orderData = {
        customer_id: selectedClient!.id,
        customer_name: selectedClient!.name,
        sales_rep_id: salesRep!.id,
        sales_rep_name: salesRep!.name,
        date: new Date().toISOString(),
        total: getTotalValue(),
        status: 'pending',
        notes: notes || '',
        payment_method: paymentMethod || '',
        items: orderItems.map(item => ({
          product_id: item.productId,
          product_name: item.productName,
          product_code: parseInt(item.code) || 0,
          quantity: item.quantity,
          price: item.price,
          unit_price: item.price,
          total: item.quantity * item.price,
          unit: item.unit
        }))
      };

      await db.saveMobileOrder(orderData);
      
      toast.success('Pedido salvo com sucesso!');
      
      // Resetar formulário
      setSelectedClient(null);
      setOrderItems([]);
      setNotes('');
      setPaymentMethod('');
      
      // Navegar de volta
      navigateTo('/my-orders');
      
    } catch (error) {
      console.error('❌ Erro ao salvar pedido:', error);
      toast.error(`Erro ao salvar pedido: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Mostrar loading durante carregamento inicial
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header 
          title="Novo Pedido" 
          showBackButton={true} 
          backgroundColor="blue" 
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Novo Pedido" 
        showBackButton={true} 
        backgroundColor="blue" 
      />
      
      <div className="p-4 flex-1">
        {/* Cliente Selecionado */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="mr-2" size={20} />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedClient ? (
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{selectedClient.name}</p>
                  {selectedClient.address && (
                    <p className="text-sm text-gray-600">{selectedClient.address}</p>
                  )}
                  {selectedClient.phone && (
                    <p className="text-sm text-gray-600">{selectedClient.phone}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowClientDialog(true)}
                >
                  Alterar
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => setShowClientDialog(true)}
                className="w-full"
              >
                <Users className="mr-2" size={16} />
                Selecionar Cliente
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Seleção de Cliente */}
        {showClientDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Selecionar Cliente</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClientDialog(false)}
                  >
                    ✕
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {filteredClients.length === 0 && searchTerm && (
                  <p className="text-sm text-gray-500 mt-2">
                    Nenhum cliente encontrado em seu portfólio
                  </p>
                )}
                {clients.length === 0 && (
                  <p className="text-sm text-orange-600 mt-2">
                    ⚠️ Você não possui clientes atribuídos. Entre em contato com o administrador.
                  </p>
                )}
              </div>
              <div className="overflow-y-auto max-h-96">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className="p-3 border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      console.log('🎯 Cliente selecionado:', {
                        id: client.id,
                        name: client.name,
                        sales_rep_id: client.sales_rep_id
                      });
                      setSelectedClient(client);
                      setShowClientDialog(false);
                      setSearchTerm('');
                    }}
                  >
                    <p className="font-medium">{client.name}</p>
                    {client.address && (
                      <p className="text-sm text-gray-600">{client.address}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Produtos */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center">
                <Package className="mr-2" size={20} />
                Produtos
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProductDialog(true)}
              >
                <Plus size={16} className="mr-1" />
                Adicionar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orderItems.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Nenhum produto adicionado
              </p>
            ) : (
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-600">Código: {item.code}</p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                      >
                        ✕
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-gray-600">Qtd</label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                          min="1"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Preço Unit.</label>
                        <Input
                          type="number"
                          value={item.price}
                          onChange={(e) => updatePrice(item.id, parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Total</label>
                        <p className="text-sm font-medium pt-2">
                          R$ {(item.quantity * item.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total do Pedido:</span>
                    <span className="text-lg font-bold text-blue-600">
                      R$ {getTotalValue().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Seleção de Produto */}
        {showProductDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Adicionar Produto</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowProductDialog(false);
                      setSelectedProduct(null);
                      setQuantity(1);
                      setCustomPrice('');
                    }}
                  >
                    ✕
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar produto..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {selectedProduct && (
                    <div className="border rounded-lg p-3 bg-blue-50">
                      <p className="font-medium">{selectedProduct.name}</p>
                      <p className="text-sm text-gray-600">Código: {selectedProduct.code}</p>
                      <p className="text-sm text-gray-600">Preço: R$ {selectedProduct.price.toFixed(2)}</p>
                      
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div>
                          <label className="text-xs text-gray-600">Quantidade</label>
                          <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                            min="1"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Preço Personalizado</label>
                          <Input
                            type="number"
                            value={customPrice}
                            onChange={(e) => setCustomPrice(e.target.value)}
                            placeholder={selectedProduct.price.toFixed(2)}
                            min="0"
                            step="0.01"
                            className="text-sm"
                          />
                        </div>
                      </div>
                      
                      <Button
                        onClick={addProductToOrder}
                        className="w-full mt-3"
                        size="sm"
                      >
                        Adicionar ao Pedido
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="overflow-y-auto max-h-96">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${
                      selectedProduct?.id === product.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">Código: {product.code}</p>
                    <p className="text-sm text-gray-600">R$ {product.price.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Informações Adicionais */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <FileText className="mr-2" size={20} />
              Informações Adicionais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Forma de Pagamento</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="prazo">A Prazo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Observações</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações do pedido..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Botão Salvar */}
        <div className="fixed bottom-4 left-4 right-4 z-40">
          <Button
            onClick={saveOrder}
            disabled={isLoading || !selectedClient || orderItems.length === 0}
            className="w-full py-3"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2" size={20} />
                Salvar Pedido
              </>
            )}
          </Button>
        </div>
        
        <div className="h-20"></div>
      </div>
    </div>
  );
};

export default PlaceOrder;
