
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Users, Package, DollarSign, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';

interface ReportData {
  totalOrders: number;
  totalValue: number;
  totalClients: number;
  totalProducts: number;
  ordersByStatus: Array<{
    status: string;
    count: number;
    value: string;
  }>;
  recentOrders: any[];
  topProducts: Array<{
    name: string;
    quantity: number;
    value: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Reports = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<ReportData>({
    totalOrders: 0,
    totalValue: 0,
    totalClients: 0,
    totalProducts: 0,
    ordersByStatus: [],
    recentOrders: [],
    topProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30' | 'all'>('30');

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const db = getDatabaseAdapter();
      await db.initDatabase();

      // Buscar dados básicos
      const [orders, clients, products] = await Promise.all([
        db.getAllOrders(),
        db.getClients(),
        db.getProducts()
      ]);

      // Filtrar pedidos por período
      const now = new Date();
      const periodStart = new Date();
      if (selectedPeriod === '7') {
        periodStart.setDate(now.getDate() - 7);
      } else if (selectedPeriod === '30') {
        periodStart.setDate(now.getDate() - 30);
      } else {
        periodStart.setFullYear(2020); // Para pegar todos
      }

      const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.order_date || order.date || order.created_at);
        return orderDate >= periodStart;
      });

      // Calcular métricas
      const totalValue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);

      // Agrupar por status - usando tipagem correta
      const statusGroups: Record<string, { count: number; value: number }> = filteredOrders.reduce((acc, order) => {
        const status = order.status || 'pending';
        if (!acc[status]) {
          acc[status] = {
            count: 0,
            value: 0
          };
        }
        acc[status].count++;
        acc[status].value += order.total || 0;
        return acc;
      }, {} as Record<string, { count: number; value: number }>);

      const ordersByStatus = Object.entries(statusGroups).map(([status, data]) => ({
        status: status === 'pending' ? 'Pendente' : status === 'completed' ? 'Concluído' : status,
        count: data.count,
        value: `R$ ${data.value.toFixed(2)}`
      }));

      // Top produtos (mockado por enquanto, pois seria necessário analisar items dos pedidos)
      const topProducts = [
        {
          name: 'Produto A',
          quantity: 150,
          value: 2500
        },
        {
          name: 'Produto B',
          quantity: 120,
          value: 1800
        },
        {
          name: 'Produto C',
          quantity: 100,
          value: 1500
        }
      ];

      setReportData({
        totalOrders: filteredOrders.length,
        totalValue,
        totalClients: clients.length,
        totalProducts: products.length,
        ordersByStatus,
        recentOrders: filteredOrders.slice(0, 10),
        topProducts
      });

    } catch (error) {
      console.error('Erro ao carregar dados dos relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    count: {
      label: "Quantidade",
      color: "#2563eb"
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/home')}
                className="mr-4"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <h1 className="font-semibold text-gray-900 text-lg">Relatórios</h1>
            </div>
            
            {/* Filtro de período */}
            <div className="flex space-x-2">
              <Button
                variant={selectedPeriod === '7' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('7')}
              >
                7 dias
              </Button>
              <Button
                variant={selectedPeriod === '30' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('30')}
              >
                30 dias
              </Button>
              <Button
                variant={selectedPeriod === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('all')}
              >
                Todos
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de métricas principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {selectedPeriod === 'all' ? 'Todos os tempos' : `Últimos ${selectedPeriod} dias`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {reportData.totalValue.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Faturamento do período
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.totalClients}</div>
              <p className="text-xs text-muted-foreground">
                Clientes cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                Produtos cadastrados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de pedidos por status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pedidos por Status</CardTitle>
              <CardDescription>Distribuição dos pedidos por status</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <BarChart data={reportData.ordersByStatus}>
                  <XAxis dataKey="status" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#2563eb" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Gráfico de pizza - Status dos pedidos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribuição de Status</CardTitle>
              <CardDescription>Proporção dos pedidos por status</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <PieChart>
                  <Pie
                    data={reportData.ordersByStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {reportData.ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de pedidos recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pedidos Recentes</CardTitle>
            <CardDescription>Últimos pedidos do período selecionado</CardDescription>
          </CardHeader>
          <CardContent>
            {reportData.recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Código</th>
                      <th className="text-left p-2">Cliente</th>
                      <th className="text-left p-2">Data</th>
                      <th className="text-left p-2">Total</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.recentOrders.map((order, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{order.code || order.id?.slice(0, 8)}</td>
                        <td className="p-2">{order.customer_name || 'N/A'}</td>
                        <td className="p-2">
                          {new Date(order.date || order.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-2">R$ {(order.total || 0).toFixed(2)}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status === 'pending' ? 'Pendente' : 
                             order.status === 'completed' ? 'Concluído' : order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Nenhum pedido encontrado para o período selecionado
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
