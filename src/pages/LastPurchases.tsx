
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Package, Calendar, DollarSign, RefreshCw } from 'lucide-react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ApiService, { Order } from '@/services/ApiService';

const LastPurchases = () => {
  const location = useLocation();
  const { clientName, clientId, day } = location.state || { clientName: 'Cliente', clientId: null, day: null };
  const apiService = ApiService.getInstance();
  
  const [purchases, setPurchases] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLastPurchases = async () => {
    if (!clientId) {
      toast.error('Cliente não selecionado');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const config = apiService.getConfig();
      
      if (!config) {
        toast.error('Configure a API primeiro');
        setIsLoading(false);
        return;
      }

      // Buscar últimos pedidos do cliente
      const orders = await apiService.getOrders({
        customer_id: clientId,
        limit: 10
      });
      
      setPurchases(orders);
    } catch (error) {
      console.error('Error loading last purchases:', error);
      toast.error(`Erro ao carregar últimas compras: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLastPurchases();
  }, [clientId]);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (amount: number): string => {
    return `R$ ${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      delivered: 'bg-green-100 text-green-800'
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const statusLabels = {
      pending: 'Pendente',
      processed: 'Processado',
      cancelled: 'Cancelado',
      delivered: 'Entregue'
    };
    return statusLabels[status as keyof typeof statusLabels] || status;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title={`Últimas Compras - ${clientName}`}
        showBackButton={true} 
        backgroundColor="blue" 
      />
      
      <div className="p-4 flex-1">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">
            Histórico de Compras
          </h2>
          <Button onClick={loadLastPurchases} variant="outline" size="sm">
            <RefreshCw size={16} className="mr-1" />
            Atualizar
          </Button>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
              <p>Carregando últimas compras...</p>
            </CardContent>
          </Card>
        ) : purchases.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Package className="mx-auto mb-2 text-gray-400" size={48} />
              <p className="text-gray-500">Nenhuma compra encontrada</p>
              <p className="text-sm text-gray-400 mt-1">
                Este cliente ainda não realizou nenhuma compra
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <Card key={purchase.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        Pedido #{purchase.id?.substring(0, 8)}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar size={14} className="mr-1" />
                        {formatDate(purchase.date)}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge className={getStatusColor(purchase.status)}>
                        {getStatusLabel(purchase.status)}
                      </Badge>
                      <div className="flex items-center font-bold text-lg mt-1">
                        <DollarSign size={16} className="mr-1" />
                        {formatCurrency(purchase.total)}
                      </div>
                    </div>
                  </div>
                  
                  {purchase.notes && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <p className="text-sm text-gray-600 italic">
                        "{purchase.notes}"
                      </p>
                    </div>
                  )}
                  
                  {purchase.items && purchase.items.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Itens ({purchase.items.length}):
                      </p>
                      <div className="space-y-1">
                        {purchase.items.slice(0, 3).map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {item.quantity}x {item.product_name}
                            </span>
                            <span className="font-medium">
                              {formatCurrency(item.total_price)}
                            </span>
                          </div>
                        ))}
                        {purchase.items.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{purchase.items.length - 3} outros itens
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LastPurchases;
