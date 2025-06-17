
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
      const [orders, clients, products] = await Promise.all([
        db.getAllOrders(),
        db.getClients(),
        db.getProducts()
      ]);

      console.log('📊 Reports - Raw data:', {
        ordersCount: orders.length,
        clientsCount: clients.length,
        productsCount: products.length
      });

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
        status: status === 'pending' ? 'Pendente' : 
                status === 'completed' ? 'Concluído' : 
                status === 'cancelled' ? 'Cancelado' :
                status === 'negativado' ? 'Negativado' : status,
        count: data.count,
        value: `R$ ${data.value.toFixed(2)}`
      }));

      // Top produtos com dados mock mais realistas para o ambiente de teste
      const topProducts = [
        {
          name: 'Produto Mais Vendido A',
          quantity: Math.floor(Math.random() * 200) + 50,
          value: Math.floor(Math.random() * 5000) + 1000
        },
        {
          name: 'Produto Popular B',
          quantity: Math.floor(Math.random() * 150) + 40,
          value: Math.floor(Math.random() * 3000) + 800
        },
        {
          name: 'Produto Destaque C',
          quantity: Math.floor(Math.random() * 100) + 30,
          value: Math.floor(Math.random() * 2000) + 500
        },
        {
          name: 'Produto Favorito D',
          quantity: Math.floor(Math.random() * 80) + 20,
          value: Math.floor(Math.random() * 1500) + 400
        },
        {
          name: 'Produto Especial E',
          quantity: Math.floor(Math.random() * 60) + 15,
          value: Math.floor(Math.random() * 1000) + 300
        }
      ].sort((a, b) => b.quantity - a.quantity);

      console.log('📊 Reports - Processed data:', {
        totalOrders: filteredOrders.length,
        totalValue,
        ordersByStatus,
        topProducts
      });

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
        <Header title="Relatórios" showBackButton={true} backgroundColor="blue" />
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
          {/* Gráfico de barras - Pedidos por status */}
          <Card>
            <CardHeader>
              <CardTitle>Pedidos por Status</CardTitle>
              <CardDescription>Distribuição dos pedidos no período selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.ordersByStatus}>
                    <XAxis dataKey="status" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Gráfico de pizza - Top produtos */}
          <Card>
            <CardHeader>
              <CardTitle>Top Produtos</CardTitle>
              <CardDescription>Produtos mais vendidos por quantidade</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.topProducts}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, quantity }) => `${name}: ${quantity}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="quantity"
                    >
                      {reportData.topProducts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
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
            <CardDescription>Últimos pedidos do período selecionado</CardDescription>
          </CardHeader>
          <CardContent>
            {reportData.recentOrders.length > 0 ? (
              <div className="space-y-4">
                {reportData.recentOrders.map((order, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{order.customer_name || 'Cliente Desconhecido'}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.date || order.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">R$ {(order.total || 0).toFixed(2)}</p>
                      <p className="text-sm text-gray-600 capitalize">{order.status || 'pending'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum pedido encontrado no período selecionado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
