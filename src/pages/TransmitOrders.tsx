import React, { useState, useEffect } from 'react';
import { Send, RefreshCw, Trash2, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import ApiService from '@/services/ApiService';
import { useAppNavigation } from '@/hooks/useAppNavigation';

interface LocalOrder {
  id: string;
  customer_id: string;
  customer_name: string;
  total: number;
  date: string;
  status: 'pending' | 'processed' | 'cancelled' | 'delivered';
  items?: any[];
  sync_status: 'pending_sync' | 'transmitted' | 'synced' | 'error';
  reason?: string;
  notes?: string;
  payment_method?: string;
}

const TransmitOrders = () => {
  const { navigateTo } = useAppNavigation();
  
  const [pendingOrders, setPendingOrders] = useState<LocalOrder[]>([]);
  const [transmittedOrders, setTransmittedOrders] = useState<LocalOrder[]>([]);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'transmitted'>('pending');

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const db = getDatabaseAdapter();
      
      console.log('🔄 Loading orders for transmission page...');
      
      // Carregar pedidos pendentes
      const pending = await db.getPendingOrders();
      console.log(`📋 Loaded ${pending.length} pending orders:`, pending.map(o => ({
        id: o.id,
        customer_name: o.customer_name,
        sync_status: o.sync_status,
        total: o.total
      })));
      setPendingOrders(pending);
      
      // Carregar pedidos transmitidos
      const transmitted = await db.getTransmittedOrders();
      console.log(`📤 Loaded ${transmitted.length} transmitted orders`);
      setTransmittedOrders(transmitted);
      
      // Carregar todos os pedidos para debug
      const allOrders = await db.getAllOrders();
      console.log(`📊 Total orders in database: ${allOrders.length}`);
      console.log(`📊 Orders breakdown by sync_status:`, {
        pending_sync: allOrders.filter(o => o.sync_status === 'pending_sync').length,
        transmitted: allOrders.filter(o => o.sync_status === 'transmitted').length,
        synced: allOrders.filter(o => o.sync_status === 'synced').length,
        error: allOrders.filter(o => o.sync_status === 'error').length,
        other: allOrders.filter(o => !['pending_sync', 'transmitted', 'synced', 'error'].includes(o.sync_status)).length
      });
      
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const transmitAllOrders = async () => {
    if (pendingOrders.length === 0) {
      toast.warning('Não há pedidos pendentes para transmitir');
      return;
    }

    if (!confirm(`Transmitir ${pendingOrders.length} pedido(s)?`)) {
      return;
    }

    setIsTransmitting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const apiService = ApiService.getInstance();
      const db = getDatabaseAdapter();

      for (const order of pendingOrders) {
        try {
          console.log('🚀 Transmitting order:', order.id);

          // Preparar dados do pedido para a API - garantindo que status seja do tipo correto
          const orderData = {
            customer_id: order.customer_id,
            customer_name: order.customer_name,
            date: order.date,
            status: order.status as 'pending' | 'processed' | 'cancelled' | 'delivered',
            total: order.total,
            notes: order.notes || '',
            payment_method: order.payment_method || '',
            source_project: 'mobile'
          };

          // Enviar pedido para a API
          await apiService.createOrderWithItems(orderData, order.items || []);
          
          // Marcar como transmitido (não deletar)
          await db.markOrderAsTransmitted(order.id);
          
          successCount++;
          console.log('✅ Order transmitted successfully:', order.id);
          
        } catch (error) {
          console.error('❌ Error transmitting order:', order.id, error);
          
          // Marcar como erro
          await db.updateSyncStatus('orders', order.id, 'error');
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} pedido(s) transmitido(s) com sucesso!`);
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} pedido(s) falharam na transmissão`);
      }

      // Recarregar listas
      await loadOrders();

    } catch (error) {
      console.error('Error in transmission process:', error);
      toast.error('Erro no processo de transmissão');
    } finally {
      setIsTransmitting(false);
    }
  };

  const deleteTransmittedOrder = async (orderId: string) => {
    if (!confirm('Tem certeza que deseja excluir este pedido permanentemente?')) {
      return;
    }

    try {
      const db = getDatabaseAdapter();
      await db.deleteOrder(orderId);
      toast.success('Pedido excluído com sucesso');
      await loadOrders(); // Recarregar lista
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Erro ao excluir pedido');
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number): string => {
    return `R$ ${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: string): "orange" | "gray" | "blue" | "purple" => {
    switch (status) {
      case 'pending': return 'orange';
      case 'processed': return 'blue';
      case 'cancelled': return 'gray';
      case 'delivered': return 'blue';
      default: return 'gray';
    }
  };

  const getSyncStatusColor = (syncStatus: string): "orange" | "gray" | "blue" | "purple" => {
    switch (syncStatus) {
      case 'pending_sync': return 'orange';
      case 'transmitted': return 'blue';
      case 'synced': return 'blue';
      case 'error': return 'gray';
      default: return 'gray';
    }
  };

  const renderOrderCard = (order: LocalOrder, showDeleteButton = false) => (
    <Card key={order.id} className="mb-4">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-medium">{order.customer_name}</h4>
            <p className="text-sm text-gray-500">
              Pedido #{order.id?.substring(0, 8)} • {formatDate(order.date)}
            </p>
            <p className="text-xs text-blue-600">
              Sync: {order.sync_status}
            </p>
          </div>
          <div className="text-right">
            <div className="flex gap-1 mb-1">
              <Badge variant="secondary" className={`bg-${getStatusColor(order.status)}-100 text-${getStatusColor(order.status)}-800`}>
                {order.status}
              </Badge>
              <Badge variant="secondary" className={`bg-${getSyncStatusColor(order.sync_status)}-100 text-${getSyncStatusColor(order.sync_status)}-800`}>
                {order.sync_status}
              </Badge>
            </div>
            <p className="font-bold">{formatCurrency(order.total)}</p>
          </div>
        </div>
        
        {order.reason && (
          <p className="text-sm text-red-600 mb-2 italic">
            Motivo: {order.reason}
          </p>
        )}
        
        {order.notes && (
          <p className="text-sm text-gray-600 mb-2 italic">
            "{order.notes}"
          </p>
        )}
        
        {order.items && order.items.length > 0 && (
          <p className="text-xs text-gray-500 mb-2">
            {order.items.length} produto(s)
          </p>
        )}
        
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateTo(`/order-details/${order.id}`)}
          >
            <Eye size={14} className="mr-1" />
            Ver Detalhes
          </Button>
          
          {showDeleteButton && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteTransmittedOrder(order.id)}
            >
              <Trash2 size={14} className="mr-1" />
              Excluir
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Transmitir Pedidos" 
        showBackButton={true} 
        backgroundColor="blue" 
      />
      
      <div className="p-4 flex-1">
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === 'pending' ? 'default' : 'outline'}
            onClick={() => setActiveTab('pending')}
          >
            Pendentes ({pendingOrders.length})
          </Button>
          <Button
            variant={activeTab === 'transmitted' ? 'default' : 'outline'}
            onClick={() => setActiveTab('transmitted')}
          >
            Transmitidos ({transmittedOrders.length})
          </Button>
        </div>

        {/* Resumo */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-orange-600">{pendingOrders.length}</p>
                <p className="text-sm text-gray-600">Pedidos Pendentes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{transmittedOrders.length}</p>
                <p className="text-sm text-gray-600">Pedidos Transmitidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        {activeTab === 'pending' && (
          <div className="flex gap-2 mb-4">
            <Button 
              onClick={transmitAllOrders}
              disabled={isTransmitting || pendingOrders.length === 0}
              className="flex-1"
            >
              {isTransmitting ? (
                <RefreshCw className="animate-spin mr-2" size={16} />
              ) : (
                <Send className="mr-2" size={16} />
              )}
              {isTransmitting ? 'Transmitindo...' : `Transmitir Todos (${pendingOrders.length})`}
            </Button>
            
            <Button 
              onClick={loadOrders} 
              variant="outline"
              disabled={isLoading}
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </Button>
          </div>
        )}

        {activeTab === 'transmitted' && (
          <div className="flex justify-end mb-4">
            <Button 
              onClick={loadOrders} 
              variant="outline"
              disabled={isLoading}
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </Button>
          </div>
        )}

        {/* Lista de Pedidos */}
        {isLoading ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
              <p>Carregando pedidos...</p>
            </CardContent>
          </Card>
        ) : activeTab === 'pending' ? (
          pendingOrders.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle className="mx-auto mb-2 text-green-500" size={24} />
                <p className="text-gray-500 mb-2">Não há pedidos pendentes para transmitir</p>
                <p className="text-sm text-gray-400">Todos os pedidos foram transmitidos com sucesso!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingOrders.map(order => renderOrderCard(order, false))}
            </div>
          )
        ) : (
          transmittedOrders.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <AlertCircle className="mx-auto mb-2 text-gray-400" size={24} />
                <p className="text-gray-500 mb-2">Nenhum pedido transmitido encontrado</p>
                <p className="text-sm text-gray-400">Pedidos aparecerão aqui após serem transmitidos</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {transmittedOrders.map(order => renderOrderCard(order, true))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default TransmitOrders;
