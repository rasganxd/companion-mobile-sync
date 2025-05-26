
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Edit, Trash2, Eye, RefreshCw } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ApiService, { Order } from '@/services/ApiService';

const MyOrders = () => {
  const navigate = useNavigate();
  const apiService = ApiService.getInstance();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: ''
  });

  const statusOptions = [
    { value: '', label: 'Todos os Status' },
    { value: 'pending', label: 'Pendente' },
    { value: 'processed', label: 'Processado' },
    { value: 'cancelled', label: 'Cancelado' },
    { value: 'delivered', label: 'Entregue' }
  ];

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
    delivered: 'bg-green-100 text-green-800'
  };

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const config = apiService.getConfig();
      
      if (!config) {
        toast.error('Configure a API primeiro');
        navigate('/api-settings');
        return;
      }

      const fetchedOrders = await apiService.getOrders({
        status: filters.status || undefined,
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined
      });
      
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error(`Erro ao carregar pedidos: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = () => {
    loadOrders();
  };

  const deleteOrder = async (orderId: string, status: string) => {
    if (status !== 'pending') {
      toast.error('Apenas pedidos pendentes podem ser deletados');
      return;
    }

    if (!confirm('Tem certeza que deseja deletar este pedido?')) {
      return;
    }

    try {
      await apiService.deleteOrder(orderId);
      toast.success('Pedido deletado com sucesso');
      loadOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error(`Erro ao deletar pedido: ${error}`);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (amount: number): string => {
    return `R$ ${amount.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Meus Pedidos" 
        showBackButton={true} 
        backgroundColor="blue" 
      />
      
      <div className="p-4 flex-1">
        {/* Filters */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2" size={20} />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="startDate">Data Inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="endDate">Data Final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={applyFilters} className="flex-1">
                Aplicar Filtros
              </Button>
              <Button onClick={loadOrders} variant="outline">
                <RefreshCw size={16} className="mr-1" />
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add New Order Button */}
        <div className="mb-4">
          <Button onClick={() => navigate('/new-order')} className="w-full">
            <Plus size={16} className="mr-2" />
            Novo Pedido
          </Button>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
              <p>Carregando pedidos...</p>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-500">Nenhum pedido encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        Pedido #{order.id?.substring(0, 8)}
                      </h3>
                      <p className="text-gray-600">{order.customer_name}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(order.date)}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <Badge className={statusColors[order.status]}>
                        {statusOptions.find(s => s.value === order.status)?.label}
                      </Badge>
                      <p className="font-bold text-lg mt-1">
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                  </div>
                  
                  {order.notes && (
                    <p className="text-sm text-gray-600 mb-4 italic">
                      "{order.notes}"
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
                    
                    {order.status === 'pending' && (
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
