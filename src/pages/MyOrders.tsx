import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, RefreshCw, Send, Users } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useConfirm } from '@/hooks/useConfirm';
import ConfirmDialog from '@/components/ConfirmDialog';

interface LocalOrder {
  id: string;
  customer_id: string;
  customer_name: string;
  total: number;
  date: string;
  status: string;
  items?: any[];
  sync_status: 'pending_sync' | 'transmitted' | 'synced' | 'error';
  reason?: string;
  notes?: string;
  payment_method?: string;
}

interface GroupedOrders {
  [customerName: string]: LocalOrder[];
}

const MyOrders = () => {
  const { navigateTo, navigateToViewOrderDetails } = useAppNavigation();
  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirm();
  
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const [groupedOrders, setGroupedOrders] = useState<GroupedOrders>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'transmitted'>('all');

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
    delivered: 'bg-green-100 text-green-800',
    negativado: 'bg-red-100 text-red-800'
  };

  const syncStatusColors = {
    pending_sync: 'bg-orange-100 text-orange-800',
    transmitted: 'bg-blue-100 text-blue-800',
    synced: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800'
  };

  const loadAllOrders = async () => {
    try {
      setIsLoading(true);
      const db = getDatabaseAdapter();
      
      // Buscar todos os pedidos (exceto deletados)
      const allOrders = await db.getAllOrders();
      
      console.log('📋 Loaded all orders:', allOrders);
      setOrders(allOrders);
      
      // Filtrar baseado no filtro ativo
      const filteredOrders = filterOrdersByStatus(allOrders, activeFilter);
      
      // Agrupar pedidos por cliente
      const grouped = filteredOrders.reduce((acc: GroupedOrders, order) => {
        const customerName = order.customer_name || 'Cliente não identificado';
        if (!acc[customerName]) {
          acc[customerName] = [];
        }
        acc[customerName].push(order);
        return acc;
      }, {});
      
      setGroupedOrders(grouped);
    } catch (error) {
      console.error('Error loading all orders:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrdersByStatus = (orders: LocalOrder[], filter: string) => {
    switch (filter) {
      case 'pending':
        return orders.filter(order => order.sync_status === 'pending_sync');
      case 'transmitted':
        return orders.filter(order => order.sync_status === 'transmitted');
      default:
        return orders;
    }
  };

  useEffect(() => {
    loadAllOrders();
  }, []);

  useEffect(() => {
    // Re-filter when active filter changes
    const filteredOrders = filterOrdersByStatus(orders, activeFilter);
    const grouped = filteredOrders.reduce((acc: GroupedOrders, order) => {
      const customerName = order.customer_name || 'Cliente não identificado';
      if (!acc[customerName]) {
        acc[customerName] = [];
      }
      acc[customerName].push(order);
      return acc;
    }, {});
    setGroupedOrders(grouped);
  }, [activeFilter, orders]);

  const deleteOrder = async (orderId: string, syncStatus: string) => {
    // Usar confirmação customizada ao invés de confirm() nativo
    const confirmMessage = syncStatus === 'transmitted' 
      ? 'Tem certeza que deseja deletar este pedido transmitido? Esta ação não pode ser desfeita.'
      : 'Tem certeza que deseja deletar este pedido?';

    const title = syncStatus === 'transmitted' 
      ? 'Deletar Pedido Transmitido' 
      : 'Deletar Pedido';

    const confirmed = await confirm({
      title,
      description: confirmMessage,
      confirmText: 'Deletar',
      cancelText: 'Cancelar'
    });

    if (!confirmed) {
      return;
    }

    try {
      const db = getDatabaseAdapter();
      await db.deleteOrder(orderId);
      
      console.log(syncStatus === 'transmitted' 
        ? 'Pedido transmitido deletado com sucesso'
        : 'Pedido deletado com sucesso');
      
      loadAllOrders(); // Recarregar lista
    } catch (error) {
      console.error('Error deleting order:', error);
      console.error(`Erro ao deletar pedido: ${error}`);
    }
  };

  const editOrder = (order: LocalOrder) => {
    if (order.sync_status === 'transmitted') {
      toast.warning('Pedidos transmitidos não podem ser editados. Crie um novo pedido para este cliente.');
      return;
    }

    // Navegar para PlaceOrder com dados do pedido
    navigateTo('/new-order', {
      clientId: order.customer_id,
      clientName: order.customer_name,
      existingOrderItems: order.items?.map((item: any, index: number) => ({
        id: Date.now() + index,
        productId: item.product_id || `temp_${index}`,
        productName: item.product_name,
        quantity: item.quantity,
        price: item.price || item.unit_price || 0,
        code: item.product_code?.toString() || '',
        unit: item.unit || 'UN'
      })) || [],
      paymentMethod: order.payment_method
    });
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

  const getFilteredOrdersCount = (filter: string) => {
    return filterOrdersByStatus(orders, filter).length;
  };

  const getTotalValue = () => {
    const filteredOrders = filterOrdersByStatus(orders, activeFilter);
    return filteredOrders.reduce((sum, order) => sum + order.total, 0);
  };

  const getStatusLabel = (status: string) => {
    const statusLabels = {
      pending: 'Pendente',
      processed: 'Processado',
      cancelled: 'Cancelado',
      delivered: 'Entregue',
      negativado: 'Negativado'
    };
    return statusLabels[status] || status;
  };

  const getSyncStatusLabel = (syncStatus: string) => {
    const syncStatusLabels = {
      pending_sync: 'Pendente',
      transmitted: 'Transmitido',
      synced: 'Sincronizado',
      error: 'Erro'
    };
    return syncStatusLabels[syncStatus] || syncStatus;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Meus Pedidos" 
        showBackButton={true} 
        backgroundColor="blue" 
      />
      
      <div className="p-4 flex-1">
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('all')}
            className="text-xs px-3 py-2"
          >
            Todos ({orders.length})
          </Button>
          <Button
            variant={activeFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('pending')}
            className="text-xs px-3 py-2"
          >
            Pendentes ({getFilteredOrdersCount('pending')})
          </Button>
          <Button
            variant={activeFilter === 'transmitted' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('transmitted')}
            className="text-xs px-3 py-2"
          >
            Transmitidos ({getFilteredOrdersCount('transmitted')})
          </Button>
        </div>

        {/* Resumo */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{getFilteredOrdersCount(activeFilter)}</p>
                <p className="text-xs sm:text-sm text-gray-600">
                  {activeFilter === 'all' ? 'Total de Pedidos' : 
                   activeFilter === 'pending' ? 'Pedidos Pendentes' : 'Pedidos Transmitidos'}
                </p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(getTotalValue())}</p>
                <p className="text-xs sm:text-sm text-gray-600">Valor Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          <Button onClick={() => navigateTo('/new-order')} className="w-full text-sm py-2">
            <Plus size={16} className="mr-2" />
            Novo Pedido
          </Button>
          
          <Button 
            onClick={() => navigateTo('/transmit-orders')} 
            variant="outline"
            disabled={getFilteredOrdersCount('pending') === 0}
            className="w-full text-sm py-2"
          >
            <Send size={16} className="mr-2" />
            Transmitir ({getFilteredOrdersCount('pending')})
          </Button>
        </div>

        <div className="flex justify-between items-center mb-4">
          <Button onClick={loadAllOrders} variant="outline" size="sm" className="text-xs px-3 py-2">
            <RefreshCw size={14} className="mr-1" />
            Atualizar
          </Button>
        </div>

        {/* Lista de Pedidos */}
        {isLoading ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
              <p>Carregando pedidos...</p>
            </CardContent>
          </Card>
        ) : Object.keys(groupedOrders).length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-500 mb-2">
                {activeFilter === 'all' ? 'Nenhum pedido encontrado' :
                 activeFilter === 'pending' ? 'Nenhum pedido pendente' :
                 'Nenhum pedido transmitido'}
              </p>
              <p className="text-sm text-gray-400">
                {activeFilter === 'pending' ? 'Todos os pedidos foram transmitidos' :
                 'Crie novos pedidos para visualizá-los aqui'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedOrders).map(([customerName, customerOrders]) => (
              <Card key={customerName} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-base sm:text-lg flex-wrap">
                    <Users size={20} className="mr-2 text-blue-600 flex-shrink-0" />
                    <span className="truncate min-w-0 flex-1">{customerName}</span>
                    <Badge variant="secondary" className="ml-2 text-xs flex-shrink-0">
                      {customerOrders.length} pedido(s)
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {customerOrders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-3 bg-white overflow-hidden">
                        <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">
                              Pedido #{order.id?.substring(0, 8)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(order.date)}
                            </p>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <div className="flex flex-wrap gap-1 justify-end">
                              <Badge className={`${statusColors[order.status] || statusColors.pending} text-xs`}>
                                {getStatusLabel(order.status)}
                              </Badge>
                              <Badge className={`${syncStatusColors[order.sync_status] || syncStatusColors.pending_sync} text-xs`}>
                                {getSyncStatusLabel(order.sync_status)}
                              </Badge>
                            </div>
                            <p className="font-bold text-sm">
                              {formatCurrency(order.total)}
                            </p>
                          </div>
                        </div>
                        
                        {order.reason && (
                          <p className="text-xs text-red-600 mb-2 italic truncate">
                            Motivo: {order.reason}
                          </p>
                        )}
                        
                        {order.notes && (
                          <p className="text-xs text-gray-600 mb-2 italic truncate">
                            "{order.notes}"
                          </p>
                        )}
                        
                        {order.items && order.items.length > 0 && (
                          <p className="text-xs text-gray-500 mb-2">
                            {order.items.length} produto(s)
                          </p>
                        )}
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateToViewOrderDetails(order.id)}
                            className="text-xs px-2 py-1 h-auto"
                          >
                            <Eye size={12} className="mr-1" />
                            Ver
                          </Button>
                          
                          {order.sync_status !== 'transmitted' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => editOrder(order)}
                              className="text-xs px-2 py-1 h-auto"
                            >
                              <Edit size={12} className="mr-1" />
                              Editar
                            </Button>
                          )}
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteOrder(order.id!, order.sync_status)}
                            className="text-xs px-2 py-1 h-auto"
                          >
                            <Trash2 size={12} className="mr-1" />
                            {order.sync_status === 'transmitted' ? 'Excluir Transmitido' : 'Deletar'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Adicionar o ConfirmDialog */}
      <ConfirmDialog
        isOpen={isOpen}
        title={options.title}
        description={options.description}
        confirmText={options.confirmText || 'Confirmar'}
        cancelText={options.cancelText || 'Cancelar'}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default MyOrders;
