
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, User, CreditCard, Package, DollarSign } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { LocalOrder } from '@/types/order';

const ViewOrderDetails = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { goBack } = useAppNavigation();
  
  const [order, setOrder] = useState<LocalOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrderDetails(orderId);
    }
  }, [orderId]);

  const loadOrderDetails = async (id: string) => {
    try {
      setIsLoading(true);
      const db = getDatabaseAdapter();
      const orderData = await db.getOrderById(id);
      
      if (orderData) {
        console.log('📋 Loaded order details:', orderData);
        setOrder(orderData);
      } else {
        toast.error('Pedido não encontrado');
        goBack();
      }
    } catch (error) {
      console.error('Error loading order details:', error);
      toast.error('Erro ao carregar detalhes do pedido');
      goBack();
    } finally {
      setIsLoading(false);
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
      case 'negativado':
        return 'bg-red-100 text-red-800';
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

  const getStatusLabel = (status: string): string => {
    const statusLabels: { [key: string]: string } = {
      pending: 'Pendente',
      processed: 'Processado',
      cancelled: 'Cancelado',
      delivered: 'Entregue',
      negativado: 'Negativado'
    };
    return statusLabels[status] || status;
  };

  const getSyncStatusLabel = (syncStatus: string): string => {
    const syncStatusLabels: { [key: string]: string } = {
      pending_sync: 'Pendente',
      transmitted: 'Transmitido',
      synced: 'Sincronizado',
      error: 'Erro'
    };
    return syncStatusLabels[syncStatus] || syncStatus;
  };

  const getPaymentMethodLabel = (method: string): string => {
    const paymentLabels: { [key: string]: string } = {
      cash: 'Dinheiro',
      credit: 'Cartão de Crédito',
      debit: 'Cartão de Débito',
      pix: 'PIX',
      transfer: 'Transferência',
      check: 'Cheque'
    };
    return paymentLabels[method] || method;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header 
          title="Detalhes do Pedido" 
          showBackButton={true} 
          backgroundColor="blue" 
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando detalhes do pedido...</p>
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
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Pedido não encontrado</p>
            <Button onClick={goBack} variant="outline">
              <ArrowLeft size={16} className="mr-2" />
              Voltar
            </Button>
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
      
      <div className="p-4 flex-1">
        {/* Informações do Pedido */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg">Pedido #{order.id?.substring(0, 8)}</span>
              <div className="flex gap-2">
                <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </Badge>
                <Badge className={`text-xs ${getSyncStatusColor(order.sync_status)}`}>
                  {getSyncStatusLabel(order.sync_status)}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="text-blue-500" size={20} />
              <div>
                <p className="font-medium">{order.customer_name}</p>
                <p className="text-sm text-gray-500">Cliente</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="text-green-500" size={20} />
              <div>
                <p className="font-medium">{formatDate(order.date)}</p>
                <p className="text-sm text-gray-500">Data do Pedido</p>
              </div>
            </div>
            
            {order.payment_method && (
              <div className="flex items-center gap-3">
                <CreditCard className="text-purple-500" size={20} />
                <div>
                  <p className="font-medium">{getPaymentMethodLabel(order.payment_method)}</p>
                  <p className="text-sm text-gray-500">Forma de Pagamento</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <DollarSign className="text-yellow-500" size={20} />
              <div>
                <p className="font-bold text-lg text-green-600">{formatCurrency(order.total)}</p>
                <p className="text-sm text-gray-500">Total do Pedido</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        {(order.reason || order.notes) && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.reason && (
                <div>
                  <p className="font-medium text-red-600 mb-1">Motivo:</p>
                  <p className="text-sm bg-red-50 p-3 rounded-lg">{order.reason}</p>
                </div>
              )}
              
              {order.notes && (
                <div>
                  <p className="font-medium text-blue-600 mb-1">Observações:</p>
                  <p className="text-sm bg-blue-50 p-3 rounded-lg">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Itens do Pedido */}
        {order.items && order.items.length > 0 && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="text-blue-500" size={20} />
                Itens do Pedido ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items.map((item: any, index: number) => (
                  <div key={index} className="border rounded-lg p-3 bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.product_name}</p>
                        {item.product_code && (
                          <p className="text-sm text-gray-500">Código: {item.product_code}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="font-bold">{formatCurrency((item.price || item.unit_price || 0) * item.quantity)}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Quantidade: {item.quantity} {item.unit || 'UN'}</span>
                      <span>Preço Unit.: {formatCurrency(item.price || item.unit_price || 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total:</span>
                <span className="text-green-600">{formatCurrency(order.total)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão de Voltar */}
        <div className="mt-6">
          <Button onClick={goBack} className="w-full">
            <ArrowLeft size={16} className="mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ViewOrderDetails;
