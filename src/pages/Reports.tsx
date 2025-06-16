import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Users, Package, DollarSign, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import Header from '@/components/Header';

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
      const [orders, clients, products] = await Promise.all([db.getAllOrders(), db.getClients(), db.getProducts()]);

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
      const statusGroups: Record<string, {
        count: number;
        value: number;
      }> = filteredOrders.reduce((acc, order) => {
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
      }, {} as Record<string, {
        count: number;
        value: number;
      }>);
      const ordersByStatus = Object.entries(statusGroups).map(([status, data]) => ({
        status: status === 'pending' ? 'Pendente' : status === 'completed' ? 'Concluído' : status,
        count: data.count,
        value: `R$ ${data.value.toFixed(2)}`
      }));

      // Top produtos (mockado por enquanto, pois seria necessário analisar items dos pedidos)
      const topProducts = [{
        name: 'Produto A',
        quantity: 150,
        value: 2500
      }, {
        name: 'Produto B',
        quantity: 120,
        value: 1800
      }, {
        name: 'Produto C',
        quantity: 100,
        value: 1500
      }];
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

  // Componente dos filtros de período para o rightComponent
  const PeriodFilters = () => (
    <div className="flex space-x-1">
      <Button 
        variant={selectedPeriod === '7' ? 'secondary' : 'ghost'} 
        size="sm" 
        onClick={() => setSelectedPeriod('7')}
        className="text-xs text-white hover:bg-white/20 data-[state=active]:bg-white/30"
      >
        7d
      </Button>
      <Button 
        variant={selectedPeriod === '30' ? 'secondary' : 'ghost'} 
        size="sm" 
        onClick={() => setSelectedPeriod('30')}
        className="text-xs text-white hover:bg-white/20 data-[state=active]:bg-white/30"
      >
        30d
      </Button>
      <Button 
        variant={selectedPeriod === 'all' ? 'secondary' : 'ghost'} 
        size="sm" 
        onClick={() => setSelectedPeriod('all')}
        className="text-xs text-white hover:bg-white/20 data-[state=active]:bg-white/30"
      >
        Todos
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          title="Relatórios" 
          showBackButton={true}
          backgroundColor="blue"
        />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando relatórios...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Relatórios" 
        showBackButton={true}
        backgroundColor="blue"
        rightComponent={<PeriodFilters />}
      />

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
              <CardTitle>Pedidos por Status</CardTitle>
              <CardDescription>Distribuição dos pedidos por status.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={reportData.ordersByStatus}>
                    <XAxis dataKey="status" />
                    <YAxis />
                    <ChartTooltip>
                      <ChartTooltipContent label="Status" value="count" config={chartConfig} />
                    </ChartTooltip>
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Gráfico de pizza - Status dos pedidos */}
          <Card>
            <CardHeader>
              <CardTitle>Status dos Pedidos</CardTitle>
              <CardDescription>Visualização em pizza dos status dos pedidos.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      dataKey="count"
                      data={reportData.ordersByStatus}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label
                    >
                      {
                        reportData.ordersByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))
                      }
                    </Pie>
                    <ChartTooltip>
                      <ChartTooltipContent label="Status" value="count" config={chartConfig} />
                    </ChartTooltip>
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de pedidos recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Recentes</CardTitle>
            <CardDescription>Últimos pedidos realizados.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID do Pedido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.order_date || order.date || order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.client_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {order.total}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
