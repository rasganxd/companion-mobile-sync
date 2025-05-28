
import React, { useState, useEffect } from 'react';
import { Download, Eye, Check, X, RefreshCw, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAppNavigation } from '@/hooks/useAppNavigation';

interface PendingOrder {
  id: string;
  code: number;
  customer_id: string;
  customer_name: string;
  date: string;
  status: string;
  total: number;
  notes?: string;
  payment_method?: string;
  created_at: string;
  items?: any[];
}

const MobileOrdersImport = () => {
  const { navigateTo } = useAppNavigation();
  
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [importingOrderId, setImportingOrderId] = useState<string | null>(null);

  const loadPendingOrders = async () => {
    try {
      setIsLoading(true);
      
      console.log('🔍 Loading pending mobile orders...');
      
      // Buscar pedidos não importados do mobile
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('imported', false)
        .eq('source_project', 'mobile')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('❌ Error loading pending orders:', ordersError);
        throw ordersError;
      }

      console.log('📋 Loaded pending orders:', orders);
      setPendingOrders(orders || []);
      
    } catch (error) {
      console.error('Error loading pending orders:', error);
      toast.error('Erro ao carregar pedidos pendentes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPendingOrders();
  }, []);

  const importOrder = async (orderId: string) => {
    if (!confirm('Confirma a importação deste pedido para o sistema?')) {
      return;
    }

    try {
      setImportingOrderId(orderId);
      
      console.log('📥 Importing order:', orderId);
      
      // Marcar pedido como importado
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          imported: true,
          sync_status: 'synced',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('❌ Error importing order:', updateError);
        throw updateError;
      }

      // Log da importação
      const { error: logError } = await supabase
        .from('sync_logs')
        .insert({
          event_type: 'manual_import',
          data_type: 'orders',
          records_count: 1,
          status: 'completed',
          metadata: {
            order_id: orderId,
            imported_by: 'admin',
            import_date: new Date().toISOString()
          }
        });

      if (logError) {
        console.warn('⚠️ Warning: Failed to log import:', logError);
      }

      toast.success('Pedido importado com sucesso!');
      
      // Recarregar lista
      await loadPendingOrders();
      
    } catch (error) {
      console.error('Error importing order:', error);
      toast.error('Erro ao importar pedido');
    } finally {
      setImportingOrderId(null);
    }
  };

  const rejectOrder = async (orderId: string) => {
    if (!confirm('Tem certeza que deseja rejeitar este pedido? Ele será removido permanentemente.')) {
      return;
    }

    try {
      setImportingOrderId(orderId);
      
      console.log('❌ Rejecting order:', orderId);
      
      // Deletar itens do pedido primeiro
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (itemsError) {
        console.error('❌ Error deleting order items:', itemsError);
        throw itemsError;
      }

      // Deletar o pedido
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (orderError) {
        console.error('❌ Error deleting order:', orderError);
        throw orderError;
      }

      // Log da rejeição
      const { error: logError } = await supabase
        .from('sync_logs')
        .insert({
          event_type: 'order_rejection',
          data_type: 'orders',
          records_count: 1,
          status: 'completed',
          metadata: {
            order_id: orderId,
            rejected_by: 'admin',
            rejection_date: new Date().toISOString()
          }
        });

      if (logError) {
        console.warn('⚠️ Warning: Failed to log rejection:', logError);
      }

      toast.success('Pedido rejeitado com sucesso');
      
      // Recarregar lista
      await loadPendingOrders();
      
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast.error('Erro ao rejeitar pedido');
    } finally {
      setImportingOrderId(null);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number): string => {
    return `R$ ${amount.toFixed(2)}`;
  };

  const getTotalValue = () => {
    return pendingOrders.reduce((sum, order) => sum + order.total, 0);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Importar Pedidos Móveis" 
        showBackButton={true} 
        backgroundColor="purple" 
      />
      
      <div className="p-4 flex-1">
        {/* Resumo */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-purple-600">{pendingOrders.length}</p>
                <p className="text-sm text-gray-600">Pedidos Pendentes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(getTotalValue())}</p>
                <p className="text-sm text-gray-600">Valor Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão de Atualizar */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Pedidos Aguardando Importação</h2>
          <Button 
            onClick={loadPendingOrders} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin mr-1' : 'mr-1'} />
            Atualizar
          </Button>
        </div>

        {/* Lista de Pedidos */}
        {isLoading ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
              <p>Carregando pedidos pendentes...</p>
            </CardContent>
          </Card>
        ) : pendingOrders.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertCircle className="mx-auto mb-2 text-gray-400" size={24} />
              <p className="text-gray-500 mb-2">Nenhum pedido móvel pendente</p>
              <p className="text-sm text-gray-400">Pedidos do app móvel aparecerão aqui para importação manual</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{order.customer_name}</CardTitle>
                      <p className="text-sm text-gray-500">
                        Pedido #{order.code} • {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 mb-1">
                        Pendente
                      </Badge>
                      <p className="font-bold text-lg">{formatCurrency(order.total)}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium">{order.status}</span>
                    </div>
                    
                    {order.payment_method && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Pagamento:</span>
                        <span className="font-medium">{order.payment_method}</span>
                      </div>
                    )}
                    
                    {order.notes && (
                      <div className="text-sm">
                        <span className="text-gray-600">Observações:</span>
                        <p className="italic mt-1">"{order.notes}"</p>
                      </div>
                    )}
                    
                    {order.items && order.items.length > 0 && (
                      <div className="text-sm">
                        <span className="text-gray-600">Itens:</span>
                        <p className="font-medium">{order.items.length} produto(s)</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateTo(`/order-details/${order.id}`)}
                    >
                      <Eye size={14} className="mr-1" />
                      Ver Detalhes
                    </Button>
                    
                    <Button
                      onClick={() => importOrder(order.id)}
                      disabled={importingOrderId === order.id}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {importingOrderId === order.id ? (
                        <RefreshCw className="animate-spin mr-1" size={14} />
                      ) : (
                        <Check size={14} className="mr-1" />
                      )}
                      Importar
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => rejectOrder(order.id)}
                      disabled={importingOrderId === order.id}
                    >
                      <X size={14} className="mr-1" />
                      Rejeitar
                    </Button>
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

export default MobileOrdersImport;
