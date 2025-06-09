
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Package, User, Calendar, CreditCard, MapPin } from 'lucide-react';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { LocalOrder } from '@/types/order';
import { toast } from 'sonner';

const ViewOrderDetails = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<LocalOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrderDetails = async () => {
      if (!orderId) {
        toast.error('ID do pedido não fornecido');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const db = getDatabaseAdapter();
        
        // Buscar o pedido específico
        const allOrders = await db.getAllOrders();
        const foundOrder = allOrders.find(o => o.id === orderId);
        
        if (!foundOrder) {
          toast.error('Pedido não encontrado');
          setOrder(null);
        } else {
          setOrder(foundOrder);
        }
      } catch (error) {
        console.error('Error loading order details:', error);
        toast.error('Erro ao carregar detalhes do pedido');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrderDetails();
  }, [orderId]);

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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSyncStatusColor = (syncStatus: string): string => {
    switch (syncStatus) {
      case 'pending_sync':
        return 'bg-orange-100 text-orange-800';
      case 'transmitted':
        return 'bg-blue-100 text-blue-800';
      case 'synced':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSyncStatusLabel = (syncStatus: string): string => {
    switch (syncStatus) {
      case 'pending_sync':
        return 'Pendente de Transmissão';
      case 'transmitted':
        return 'Transmitido';
      case 'synced':
        return 'Sincronizado';
      case 'error':
        return 'Erro na Transmissão';
      default:
        return syncStatus;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header 
          title="Detalhes do Pedido" 
          showBackButton={true} 
          backgroundColor="blue" 
        />
        <div className="p-4 flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
            <p>Carregando detalhes do pedido...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header 
          title="Detalhes do Pedido" 
          showBackButton={true} 
          backgroundColor="blue" 
        />
        <div className="p-4 flex-1 flex items-center justify-center">
          <div className="text-center">
            <Package className="mx-auto mb-2 text-gray-400" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Pedido não encontrado</h3>
            <p className="text-gray-500">O pedido solicitado não foi encontrado no sistema.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Detalhes do Pedido" 
        showBackButton={true} 
        backgroundColor="blue" 
      />
      
      <div className="p-4 flex-1 space-y-4">
        {/* Status e Informações Gerais */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">Pedido #{order.id?.substring(0, 8)}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Criado em {formatDate(order.date)}
                </p>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <Badge className={`text-xs ${getSyncStatusColor(order.sync_status)}`}>
                  {getSyncStatusLabel(order.sync_status)}
                </Badge>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Informações do Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User size={16} />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="font-medium">{order.customer_name}</p>
              {order.customer_id && (
                <p className="text-sm text-gray-500">ID: {order.customer_id}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações de Pagamento */}
        {(order.payment_method || order.payment_table) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard size={16} />
                Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {order.payment_method && (
                <div>
                  <p className="text-sm text-gray-500">Forma de Pagamento</p>
                  <p className="font-medium">{order.payment_method}</p>
                </div>
              )}
              {order.payment_table && (
                <div>
                  <p className="text-sm text-gray-500">Tabela de Preços</p>
                  <p className="font-medium">{order.payment_table}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Itens do Pedido */}
        {order.items && order.items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package size={16} />
                Itens do Pedido ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-gray-500">
                        Qtd: {item.quantity} {item.unit || 'UN'} × {formatCurrency(item.unit_price || item.price)}
                      </p>
                      {item.discount && item.discount > 0 && (
                        <p className="text-sm text-red-600">
                          Desconto: {formatCurrency(item.discount)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(item.total)}</p>
                    </div>
                  </div>
                  {index < order.items.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Observações */}
        {(order.notes || order.reason) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {order.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notas</p>
                  <p className="italic">"{order.notes}"</p>
                </div>
              )}
              {order.reason && (
                <div>
                  <p className="text-sm text-gray-500">Motivo</p>
                  <p className="text-red-600 italic">{order.reason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resumo do Pedido */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Total de itens:</span>
              <span>{order.items?.length || 0}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total do Pedido:</span>
              <span className="text-green-600">{formatCurrency(order.total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ViewOrderDetails;
