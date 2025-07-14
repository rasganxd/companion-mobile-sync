
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2, Edit3, ShoppingCart } from 'lucide-react';
import AppButton from '@/components/AppButton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

interface OrderItem {
  id: number;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  code: string;
  unit: string;
}

interface Client {
  id: string;
  name: string;
  company_name?: string;
  code?: number;
}

const OrderReview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { salesRep } = useAuth();
  const { orderItems: initialOrderItems, client, paymentMethod, clientId, clientName, day } = location.state || {};
  
  const [orderItems, setOrderItems] = useState<OrderItem[]>(initialOrderItems || []);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!initialOrderItems || !client) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header 
          title="Revisão do Pedido"
          backgroundColor="blue"
          showBackButton
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg text-gray-600">Dados do pedido não encontrados</div>
            <AppButton 
              variant="blue" 
              className="mt-4"
              onClick={() => navigate('/new-order')}
            >
              Voltar para Pedidos
            </AppButton>
          </div>
        </div>
      </div>
    );
  }

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  };

  const handleRemoveItem = (id: number) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
    // ✅ REMOVIDO: toast.info("Item removido do pedido");
  };

  const handleEditItem = (item: OrderItem) => {
    setEditingItem(item.id);
    setEditQuantity(item.quantity.toString());
  };

  const handleSaveEdit = (id: number) => {
    const newQuantity = parseFloat(editQuantity);
    if (newQuantity <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }

    setOrderItems(orderItems.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
    setEditingItem(null);
    setEditQuantity('');
    toast.success("Quantidade atualizada");
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditQuantity('');
  };

  const handleAddMoreItems = () => {
    navigate('/new-order', {
      state: {
        clientId,
        clientName,
        day,
        existingOrderItems: orderItems,
        paymentMethod
      }
    });
  };

  const handleFinishOrder = async () => {
    if (orderItems.length === 0) {
      toast.error("Adicione pelo menos um item ao pedido");
      return;
    }

    console.log('🛒 OrderReview.handleFinishOrder() - STARTING order finalization:', {
      clientId: client.id,
      clientName: client.company_name || client.name,
      itemsCount: orderItems.length,
      total: calculateTotal(),
      salesRepId: salesRep?.id,
      paymentMethod
    });

    setIsSubmitting(true);
    
    try {
      const db = getDatabaseAdapter();
      
      let paymentTableId = null;
      if (paymentMethod && paymentMethod !== 'Dinheiro') {
        try {
          const paymentTables = await db.getPaymentTables();
          const matchingTable = paymentTables.find(table => 
            table.name === paymentMethod || 
            table.name.toLowerCase() === paymentMethod.toLowerCase()
          );
          if (matchingTable) {
            paymentTableId = matchingTable.id;
            console.log('💳 OrderReview.handleFinishOrder() - Found payment table:', {
              paymentMethod,
              paymentTableId
            });
          }
        } catch (error) {
          console.warn('⚠️ OrderReview.handleFinishOrder() - Could not fetch payment tables:', error);
        }
      }
      
      const orderData = {
        id: uuidv4(),
        customer_id: client.id,
        customer_name: client.company_name || client.name,
        sales_rep_id: salesRep?.id,
        sales_rep_name: salesRep?.name,
        total: parseFloat(calculateTotal()),
        status: 'pending',
        payment_method: paymentMethod,
        payment_table_id: paymentTableId,
        date: new Date().toISOString(),
        sync_status: 'pending_sync',
        source_project: 'mobile',
        items: orderItems.map(item => ({
          id: uuidv4(),
          product_name: item.productName,
          product_code: parseInt(item.code) || null,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
          unit: item.unit
        }))
      };

      console.log('💾 OrderReview.handleFinishOrder() - Calling db.saveOrder with corrected data:', {
        orderId: orderData.id,
        customerId: orderData.customer_id,
        customerName: orderData.customer_name,
        salesRepId: orderData.sales_rep_id,
        salesRepName: orderData.sales_rep_name,
        paymentTableId: orderData.payment_table_id,
        total: orderData.total,
        itemsCount: orderData.items.length
      });

      await db.saveOrder(orderData);
      
      console.log('✅ OrderReview.handleFinishOrder() - Order saved successfully! Client should be positivated automatically.');
      
      toast.success("Pedido finalizado com sucesso!");
      
      // 🔧 FIX: Retornar para o dia correto que foi selecionado
      navigate('/clients-list', {
        state: { day: day }
      });
    } catch (error) {
      console.error("❌ OrderReview.handleFinishOrder() - Error saving order:", error);
      toast.error("Erro ao finalizar pedido");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    navigate('/new-order', {
      state: {
        clientId,
        clientName,
        day,
        existingOrderItems: orderItems,
        paymentMethod
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header 
        title="Revisão do Pedido"
        backgroundColor="blue"
        showBackButton
      />
      
      {/* Client Info */}
      <div className="bg-app-blue text-white px-3 py-2 text-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold">{client.code || 'S/N'}</span> - {client.name}
            {client.company_name && client.company_name !== client.name && (
              <div className="text-xs text-blue-100 mt-1">{client.company_name}</div>
            )}
            <div className="text-xs text-blue-100 mt-1">
              Pagamento: {paymentMethod || 'Não selecionada'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-blue-100">Total:</div>
            <div className="text-sm font-bold">R$ {calculateTotal()}</div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="flex-1 p-3 overflow-y-auto">
        <Card>
          <CardContent className="p-3">
            <div className="space-y-3">
              {orderItems.map((item) => (
                <div key={item.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 mr-2">
                      <div className="font-medium text-sm text-gray-900">
                        {item.productName}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Código: {item.code} | Unidade: {item.unit}
                      </div>
                      <div className="text-xs text-gray-500">
                        Preço unit.: R$ {item.price.toFixed(2)}
                      </div>
                      
                      {editingItem === item.id ? (
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            type="number"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(e.target.value)}
                            className="h-8 w-20 text-xs"
                            min="0"
                            step="0.01"
                          />
                          <Button
                            size="sm"
                            className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
                            onClick={() => handleSaveEdit(item.id)}
                          >
                            OK
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs"
                            onClick={handleCancelEdit}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-gray-600">
                            Qtd: {item.quantity} {item.unit}
                          </div>
                          <div className="text-sm font-medium text-app-blue">
                            R$ {(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {editingItem !== item.id && (
                      <div className="flex flex-col gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 text-blue-500 hover:bg-blue-50"
                          onClick={() => handleEditItem(item)}
                        >
                          <Edit3 size={12} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {orderItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-sm">Nenhum item no pedido</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="p-4 bg-white border-t shadow-lg">
        <div className="grid grid-cols-3 gap-3">
          <AppButton 
            variant="gray" 
            className="flex items-center justify-center text-sm"
            onClick={handleGoBack}
          >
            <ArrowLeft size={16} className="mr-1" />
            Voltar
          </AppButton>
          
          <AppButton 
            variant="blue" 
            className="flex items-center justify-center text-sm"
            onClick={handleAddMoreItems}
          >
            <Plus size={16} className="mr-1" />
            Incluir
          </AppButton>
          
          <AppButton 
            variant="green" 
            className="flex items-center justify-center text-sm"
            onClick={handleFinishOrder}
            disabled={orderItems.length === 0 || isSubmitting}
          >
            <ShoppingCart size={16} className="mr-1" />
            {isSubmitting ? 'Salvando...' : 'Gravar'}
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default OrderReview;
