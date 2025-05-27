
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, RefreshCw, Send, Users } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';

interface LocalOrder {
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

interface GroupedOrders {
  [customerName: string]: LocalOrder[];
}

const MyOrders = () => {
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const [groupedOrders, setGroupedOrders] = useState<GroupedOrders>({});
  const [isLoading, setIsLoading] = useState(true);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
    delivered: 'bg-green-100 text-green-800',
    negativado: 'bg-red-100 text-red-800'
  };

  const loadLocalOrders = async () => {
    try {
      setIsLoading(true);
      const db = getDatabaseAdapter();
      
      // Buscar apenas pedidos pendentes de sincronização
      const pendingOrders = await db.getPendingSyncItems('orders');
      
      console.log('📋 Loaded local pending orders:', pendingOrders);
      setOrders(pendingOrders);
      
      // Agrupar pedidos por cliente
      const grouped = pendingOrders.reduce((acc: GroupedOrders, order) => {
        const customerName = order.customer_name || 'Cliente não identificado';
        if (!acc[customerName]) {
          acc[customerName] = [];
        }
        acc[customerName].push(order);
        return acc;
      }, {});
      
      setGroupedOrders(grouped);
    } catch (error) {
      console.error('Error loading local orders:', error);
      toast.error('Erro ao carregar pedidos locais');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLocalOrders();
  }, []);

  const deleteOrder = async (orderId: string, status: string) => {
    if (status !== 'pending' && status !== 'negativado') {
      toast.error('Apenas pedidos pendentes podem ser deletados');
      return;
    }

    if (!confirm('Tem certeza que deseja deletar este pedido?')) {
      return;
    }

    try {
      const db = getDatabaseAdapter();
      // Para deletar, vamos marcar como 'error' ou implementar método de delete
      await db.updateSyncStatus('orders', orderId, 'error');
      toast.success('Pedido deletado com sucesso');
      loadLocalOrders(); // Recarregar lista
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error(`Erro ao deletar pedido: ${error}`);
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

  const getTotalOrders = () => orders.length;
  const getTotalValue = () => orders.reduce((sum, order) => sum + order.total, 0);

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Meus Pedidos" 
        showBackButton={true} 
        backgroundColor="blue" 
      />
      
      <div className="p-4 flex-1">
        {/* Resumo */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{getTotalOrders()}</p>
                <p className="text-sm text-gray-600">Pedidos Pendentes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(getTotalValue())}</p>
                <p className="text-sm text-gray-600">Valor Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button onClick={() => navigate('/new-order')} className="w-full">
            <Plus size={16} className="mr-2" />
            Novo Pedido
          </Button>
          
          <Button 
            onClick={() => navigate('/transmit-orders')} 
            variant="outline"
            disabled={getTotalOrders() === 0}
            className="w-full"
          >
            <Send size={16} className="mr-2" />
            Transmitir ({getTotalOrders()})
          </Button>
        </div>

        <div className="flex justify-between items-center mb-4">
          <Button onClick={loadLocalOrders} variant="outline" size="sm">
            <RefreshCw size={16} className="mr-1" />
            Atualizar
          </Button>
        </div>

        {/* Lista de Pedidos */}
        {isLoading ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
              <p>Carregando pedidos locais...</p>
            </CardContent>
          </Card>
        ) : getTotalOrders() === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-500 mb-2">Nenhum pedido pendente</p>
              <p className="text-sm text-gray-400">Todos os pedidos foram transmitidos</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedOrders).map(([customerName, customerOrders]) => (
              <Card key={customerName}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Users size={20} className="mr-2 text-blue-600" />
                    {customerName}
                    <Badge variant="secondary" className="ml-2">
                      {customerOrders.length} pedido(s)
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {customerOrders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-3 bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">
                              Pedido #{order.id?.substring(0, 8)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(order.date)}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <Badge className={statusColors[order.status] || statusColors.pending}>
                              {getStatusLabel(order.status)}
                            </Badge>
                            <p className="font-bold text-sm mt-1">
                              {formatCurrency(order.total)}
                            </p>
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
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/order-details/${order.id}`)}
                          >
                            <Eye size={14} className="mr-1" />
                            Ver
                          </Button>
                          
                          {(order.status === 'pending' || order.status === 'negativado') && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/edit-order/${order.id}`)}
                              >
                                <Edit size={14} className="mr-1" />
                                Editar
                              </Button>
                              
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteOrder(order.id!, order.status)}
                              >
                                <Trash2 size={14} className="mr-1" />
                                Deletar
                              </Button>
                            </>
                          )}
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
    </div>
  );
};

export default MyOrders;
