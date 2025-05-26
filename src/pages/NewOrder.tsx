
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import ApiService, { Order, OrderItem } from '@/services/ApiService';

const NewOrder = () => {
  const navigate = useNavigate();
  const apiService = ApiService.getInstance();
  
  const [order, setOrder] = useState<Partial<Order>>({
    customer_id: '',
    customer_name: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
    notes: ''
  });
  
  const [items, setItems] = useState<Omit<OrderItem, 'id' | 'order_id'>[]>([
    {
      product_name: '',
      product_code: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      description: ''
    }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);

  const calculateItemTotal = (quantity: number, unitPrice: number): number => {
    return Number((quantity * unitPrice).toFixed(2));
  };

  const calculateOrderTotal = (): number => {
    return items.reduce((total, item) => total + item.total_price, 0);
  };

  const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const updatedItems = [...items];
    (updatedItems[index] as any)[field] = value;
    
    // Recalculate total price if quantity or unit_price changed
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_price = calculateItemTotal(
        updatedItems[index].quantity,
        updatedItems[index].unit_price
      );
    }
    
    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([...items, {
      product_name: '',
      product_code: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      description: ''
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const validateOrder = (): boolean => {
    if (!order.customer_id || !order.customer_name) {
      toast.error('Cliente é obrigatório');
      return false;
    }

    if (items.length === 0) {
      toast.error('Adicione pelo menos um item');
      return false;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.product_name || item.quantity <= 0 || item.unit_price <= 0) {
        toast.error(`Item ${i + 1}: Nome do produto, quantidade e preço são obrigatórios`);
        return false;
      }
    }

    return true;
  };

  const submitOrder = async () => {
    if (!validateOrder()) return;

    const config = apiService.getConfig();
    if (!config?.salesRepId) {
      toast.error('Configure a API primeiro em Configurações');
      return;
    }

    setIsLoading(true);
    try {
      const orderData: Omit<Order, 'id'> = {
        customer_id: order.customer_id!,
        customer_name: order.customer_name,
        sales_rep_id: config.salesRepId,
        date: order.date!,
        status: 'pending',
        total: calculateOrderTotal(),
        notes: order.notes
      };

      await apiService.createOrderWithItems(orderData, items);
      
      toast.success('Pedido criado com sucesso!');
      navigate('/my-orders');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(`Erro ao criar pedido: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Novo Pedido" 
        showBackButton={true} 
        backgroundColor="blue" 
      />
      
      <div className="p-4 flex-1">
        {/* Order Information */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Informações do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="customerId">ID do Cliente</Label>
              <Input
                id="customerId"
                placeholder="Digite o ID do cliente"
                value={order.customer_id}
                onChange={(e) => setOrder(prev => ({ ...prev, customer_id: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="customerName">Nome do Cliente</Label>
              <Input
                id="customerName"
                placeholder="Digite o nome do cliente"
                value={order.customer_name}
                onChange={(e) => setOrder(prev => ({ ...prev, customer_name: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="orderDate">Data do Pedido</Label>
              <Input
                id="orderDate"
                type="date"
                value={order.date}
                onChange={(e) => setOrder(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Observações sobre o pedido..."
                value={order.notes}
                onChange={(e) => setOrder(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Itens do Pedido
              <Button onClick={addItem} size="sm">
                <Plus size={16} className="mr-1" />
                Adicionar Item
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.map((item, index) => (
              <Card key={index} className="mb-4 border border-gray-200">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    {items.length > 1 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Nome do Produto</Label>
                      <Input
                        placeholder="Nome do produto"
                        value={item.product_name}
                        onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label>Código do Produto</Label>
                      <Input
                        placeholder="Código (opcional)"
                        value={item.product_code}
                        onChange={(e) => updateItem(index, 'product_code', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    
                    <div>
                      <Label>Preço Unitário</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label>Descrição (opcional)</Label>
                      <Input
                        placeholder="Descrição do produto"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-3 text-right">
                    <strong>Total: R$ {item.total_price.toFixed(2)}</strong>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total do Pedido:</span>
              <span>R$ {calculateOrderTotal().toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button 
          onClick={submitOrder}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            'Criando Pedido...'
          ) : (
            <>
              <Save size={16} className="mr-2" />
              Criar Pedido
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default NewOrder;
