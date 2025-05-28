
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import AppButton from '@/components/AppButton';
import { ArrowLeft, Send, CheckCircle, XCircle, Clock, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import ApiService from '@/services/ApiService';
import { toast } from 'sonner';

interface PendingOrder {
  id: string;
  customer_id: string;
  customer_name: string;
  total: number;
  date: string;
  status: string;
  items?: any[];
  sync_status: 'pending_sync' | 'synced' | 'error';
  reason?: string;
  notes?: string;
  payment_method?: string;
}

const TransmitOrders = () => {
  const navigate = useNavigate();
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPendingOrders();
    checkConnection();
  }, []);

  const loadPendingOrders = async () => {
    try {
      setIsLoading(true);
      const db = getDatabaseAdapter();
      const orders = await db.getPendingSyncItems('orders');
      
      console.log('📋 Loaded pending orders:', orders);
      setPendingOrders(orders);
      
      // Auto-select all orders
      const orderIds = new Set(orders.map(order => order.id));
      setSelectedOrders(orderIds);
    } catch (error) {
      console.error('Error loading pending orders:', error);
      toast.error('Erro ao carregar pedidos pendentes');
    } finally {
      setIsLoading(false);
    }
  };

  const checkConnection = async () => {
    try {
      const apiService = ApiService.getInstance();
      const connected = await apiService.testConnection();
      setIsConnected(connected);
      
      if (!connected) {
        toast.warning('Sem conexão com o servidor');
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      setIsConnected(false);
      toast.error('Erro ao verificar conexão');
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    const newSelection = new Set(selectedOrders);
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId);
    } else {
      newSelection.add(orderId);
    }
    setSelectedOrders(newSelection);
  };

  const selectAllOrders = () => {
    const allIds = new Set(pendingOrders.map(order => order.id));
    setSelectedOrders(allIds);
  };

  const deselectAllOrders = () => {
    setSelectedOrders(new Set());
  };

  const transmitSelectedOrders = async () => {
    if (selectedOrders.size === 0) {
      toast.warning('Selecione pelo menos um pedido para transmitir');
      return;
    }

    if (!isConnected) {
      toast.error('Sem conexão com o servidor. Verifique sua internet.');
      return;
    }

    setIsTransmitting(true);
    const db = getDatabaseAdapter();
    const apiService = ApiService.getInstance();
    let successCount = 0;
    let errorCount = 0;

    try {
      const ordersToTransmit = pendingOrders.filter(order => selectedOrders.has(order.id));
      
      toast.info(`Transmitindo ${ordersToTransmit.length} pedido(s)...`);
      
      for (const order of ordersToTransmit) {
        try {
          console.log('📤 Transmitting order:', order);
          
          if (order.status === 'negativado') {
            // For negative sales, create a special order record
            const negativeOrder = {
              customer_id: order.customer_id,
              customer_name: order.customer_name,
              total: 0,
              status: 'cancelled' as const,
              notes: `Motivo: ${order.reason}. ${order.notes || ''}`,
              date: order.date,
              source_project: 'mobile'
            };
            
            const result = await apiService.createOrder(negativeOrder);
            console.log('✅ Negative order transmitted:', result);
          } else {
            // Regular order with items
            const orderData = {
              customer_id: order.customer_id,
              customer_name: order.customer_name,
              total: order.total,
              status: 'pending' as const,
              payment_method: order.payment_method || 'N/A',
              notes: order.notes || '',
              date: order.date,
              source_project: 'mobile'
            };
            
            const items = order.items || [];
            const result = await apiService.createOrderWithItems(orderData, items);
            console.log('✅ Regular order transmitted:', result);
          }
          
          // Mark as synced locally ONLY if transmission was successful
          await db.updateSyncStatus('orders', order.id, 'synced');
          successCount++;
          
          console.log('✅ Order transmitted and marked as synced:', order.id);
          
          // Show individual success message
          toast.success(`Pedido de ${order.customer_name} transmitido!`);
          
        } catch (error) {
          console.error('❌ Error transmitting order:', order.id, error);
          errorCount++;
          
          // Show specific error message
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          console.error('❌ Detailed error for order', order.customer_name, ':', errorMessage);
          toast.error(`Erro no pedido ${order.customer_name}: ${errorMessage}`);
          
          // Mark as error in local database
          try {
            await db.updateSyncStatus('orders', order.id, 'error');
          } catch (dbError) {
            console.error('❌ Failed to update order status to error:', dbError);
          }
        }
      }

      // Show final results
      if (successCount > 0) {
        toast.success(`${successCount} pedido(s) transmitido(s) com sucesso! 🎉`);
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} pedido(s) falharam na transmissão`);
      }

      console.log(`✅ Transmissão concluída: ${successCount} sucesso, ${errorCount} erros`);

      // Reload pending orders to update the list
      await loadPendingOrders();
      
    } catch (error) {
      console.error('❌ Error during transmission:', error);
      toast.error('Erro geral na transmissão de pedidos');
    } finally {
      setIsTransmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (order: PendingOrder) => {
    if (order.status === 'negativado') {
      return <Badge variant="destructive">Negativado</Badge>;
    }
    
    if (order.sync_status === 'error') {
      return <Badge variant="destructive">Erro</Badge>;
    }
    
    return <Badge variant="secondary">Pendente</Badge>;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Transmitir Pedidos" 
        backgroundColor="blue"
        showBackButton
      />
      
      {/* Connection Status */}
      <div className={`px-3 py-2 text-white text-sm flex items-center gap-2 ${
        isConnected ? 'bg-green-600' : 'bg-red-600'
      }`}>
        {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
        {isConnected ? 'Conectado ao servidor' : 'Sem conexão com o servidor'}
      </div>

      {/* Summary */}
      <div className="bg-white border-b p-4">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-medium">Pedidos Pendentes</h3>
            <p className="text-sm text-gray-600">
              {pendingOrders.length} pedido(s) aguardando transmissão
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Selecionados</p>
            <p className="font-medium">{selectedOrders.size} de {pendingOrders.length}</p>
          </div>
        </div>
        
        {pendingOrders.length > 0 && (
          <div className="flex gap-2">
            <AppButton 
              variant="gray" 
              className="text-xs"
              onClick={selectAllOrders}
            >
              Selecionar Todos
            </AppButton>
            <AppButton 
              variant="gray" 
              className="text-xs"
              onClick={deselectAllOrders}
            >
              Desmarcar Todos
            </AppButton>
          </div>
        )}
      </div>
      
      <ScrollArea className="flex-1 px-4 py-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-lg text-gray-600">Carregando pedidos...</div>
          </div>
        ) : pendingOrders.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <div className="text-lg text-gray-600">Nenhum pedido pendente</div>
            <div className="text-sm text-gray-500">Todos os pedidos foram transmitidos</div>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingOrders.map((order) => (
              <Card 
                key={order.id} 
                className={`cursor-pointer border-2 transition-colors ${
                  selectedOrders.has(order.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => toggleOrderSelection(order.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-medium">
                      {order.customer_name}
                    </CardTitle>
                    {getStatusBadge(order)}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium">{formatCurrency(order.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data:</span>
                      <span>{formatDate(order.date)}</span>
                    </div>
                    {order.reason && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Motivo:</span>
                        <span className="text-red-600">{order.reason}</span>
                      </div>
                    )}
                    {order.items && order.items.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Itens:</span>
                        <span>{order.items.length} produto(s)</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
      
      {/* Actions */}
      <div className="p-4 bg-white border-t grid grid-cols-2 gap-4">
        <AppButton 
          variant="gray" 
          onClick={() => navigate(-1)}
          disabled={isTransmitting}
          className="flex items-center justify-center"
        >
          <ArrowLeft size={16} className="mr-2" />
          Voltar
        </AppButton>
        
        <AppButton 
          variant="blue" 
          onClick={transmitSelectedOrders}
          disabled={isTransmitting || selectedOrders.size === 0 || !isConnected}
          className="flex items-center justify-center"
        >
          {isTransmitting ? (
            <>
              <Clock size={16} className="mr-2 animate-spin" />
              Transmitindo...
            </>
          ) : (
            <>
              <Send size={16} className="mr-2" />
              Transmitir ({selectedOrders.size})
            </>
          )}
        </AppButton>
      </div>
    </div>
  );
};

export default TransmitOrders;
