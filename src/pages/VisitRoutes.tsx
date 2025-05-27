
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import AppButton from '@/components/AppButton';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RouteData {
  day: string;
  visited: number;
  remaining: number;
  total: number;
  clients: string[];
  positivados: number;
  negativados: number;
  pendentes: number;
  totalSales: number;
}

interface SalesData {
  totalSales: number;
  totalPositivados: number;
  totalNegativados: number;
  totalPendentes: number;
  positivadosValue: number;
}

const VisitRoutes = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [salesData, setSalesData] = useState<SalesData>({
    totalSales: 0,
    totalPositivados: 0,
    totalNegativados: 0,
    totalPendentes: 0,
    positivadosValue: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Mapeamento dos dias da semana
  const dayMapping: { [key: string]: string } = {
    'monday': 'Segunda',
    'tuesday': 'Terça', 
    'wednesday': 'Quarta',
    'thursday': 'Quinta',
    'friday': 'Sexta',
    'saturday': 'Sábado',
    'sunday': 'Domingo'
  };

  useEffect(() => {
    const loadRoutesData = async () => {
      try {
        setLoading(true);
        
        console.log('🔍 Fetching customers and orders from Supabase...');
        
        // Buscar clientes ativos com dias de visita definidos
        const { data: customers, error: customersError } = await supabase
          .from('customers')
          .select('id, name, visit_days')
          .eq('active', true)
          .not('visit_days', 'is', null);
        
        if (customersError) {
          console.error('❌ Error fetching customers:', customersError);
          throw customersError;
        }
        
        // Buscar pedidos do dia atual
        const today = new Date().toISOString().split('T')[0];
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('customer_id, status, total, date')
          .gte('date', today)
          .lt('date', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        
        if (ordersError) {
          console.error('❌ Error fetching orders:', ordersError);
          throw ordersError;
        }
        
        console.log('👥 Loaded customers:', customers);
        console.log('📋 Loaded orders:', orders);
        
        // Definir todos os dias da semana
        const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        
        let totalSales = 0;
        let totalPositivados = 0;
        let totalNegativados = 0;
        let totalPendentes = 0;
        let positivadosValue = 0;
        
        // Processar dados das rotas
        const processedRoutes: RouteData[] = weekDays.map(day => {
          // Encontrar a chave em inglês correspondente ao dia em português
          const englishDay = Object.keys(dayMapping).find(key => dayMapping[key] === day);
          
          if (!englishDay) {
            return {
              day,
              visited: 0,
              remaining: 0,
              total: 0,
              clients: [],
              positivados: 0,
              negativados: 0,
              pendentes: 0,
              totalSales: 0
            };
          }
          
          // Filtrar clientes que têm esse dia nas suas visit_days
          const dayClients = customers?.filter(customer => 
            customer.visit_days && 
            Array.isArray(customer.visit_days) && 
            customer.visit_days.includes(englishDay)
          ) || [];
          
          const clientNames = dayClients.map(client => client.name);
          const total = clientNames.length;
          
          // Calcular status dos clientes baseado nos pedidos
          let positivados = 0;
          let negativados = 0;
          let pendentes = 0;
          let dayTotalSales = 0;
          
          dayClients.forEach(client => {
            const clientOrders = orders?.filter(order => order.customer_id === client.id) || [];
            
            if (clientOrders.length > 0) {
              // Cliente tem pedidos - verificar status
              const hasPositive = clientOrders.some(order => order.status === 'pending' || order.status === 'processed' || order.status === 'delivered');
              const hasNegative = clientOrders.some(order => order.status === 'cancelled');
              
              if (hasPositive) {
                positivados++;
                // Somar apenas pedidos positivos
                const positiveOrdersValue = clientOrders
                  .filter(order => order.status === 'pending' || order.status === 'processed' || order.status === 'delivered')
                  .reduce((sum, order) => sum + (order.total || 0), 0);
                dayTotalSales += positiveOrdersValue;
              } else if (hasNegative) {
                negativados++;
              }
            } else {
              // Cliente sem pedidos = pendente
              pendentes++;
            }
          });
          
          // Acumular totais gerais
          totalPositivados += positivados;
          totalNegativados += negativados;
          totalPendentes += pendentes;
          totalSales += dayTotalSales;
          positivadosValue += dayTotalSales;
          
          console.log(`📅 ${day} (${englishDay}):`, {
            clients: clientNames,
            total,
            positivados,
            negativados,
            pendentes,
            totalSales: dayTotalSales
          });
          
          return {
            day,
            visited: positivados + negativados,
            remaining: pendentes,
            total,
            clients: clientNames,
            positivados,
            negativados,
            pendentes,
            totalSales: dayTotalSales
          };
        });
        
        setRoutes(processedRoutes);
        setSalesData({
          totalSales,
          totalPositivados,
          totalNegativados,
          totalPendentes,
          positivadosValue
        });
        
        console.log('📋 Processed routes:', processedRoutes);
        console.log('💰 Sales data:', {
          totalSales,
          totalPositivados,
          totalNegativados,
          totalPendentes,
          positivadosValue
        });
        
      } catch (error) {
        console.error('❌ Error loading routes data:', error);
        
        // Fallback para dados vazios
        const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        setRoutes(weekDays.map(day => ({
          day,
          visited: 0,
          remaining: 0,
          total: 0,
          clients: [],
          positivados: 0,
          negativados: 0,
          pendentes: 0,
          totalSales: 0
        })));
      } finally {
        setLoading(false);
      }
    };
    
    loadRoutesData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleDaySelect = (day: string) => {
    console.log(`🗓️ Selected day: ${day}`);
    navigate('/clientes-lista', { state: { day } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header 
          title="Rotas de Visitas" 
          backgroundColor="blue" 
          showBackButton={true}
        />
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg text-gray-600">Carregando rotas...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Rotas de Visitas" 
        backgroundColor="blue" 
        showBackButton={true}
      />
      
      <div className="p-3 flex-1">
        {/* Cards de resumo */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
            <h3 className="text-gray-700 font-medium mb-1 text-sm">Total de Vendas</h3>
            <div className="text-lg font-bold text-green-600">{formatCurrency(salesData.totalSales)}</div>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
            <h3 className="text-gray-700 font-medium mb-1 text-sm">Positivados</h3>
            <div className="text-lg font-bold text-green-600">{salesData.totalPositivados}</div>
            <div className="text-xs text-gray-500">{formatCurrency(salesData.positivadosValue)}</div>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
            <h3 className="text-gray-700 font-medium mb-1 text-sm">Negativados</h3>
            <div className="text-lg font-bold text-red-500">{salesData.totalNegativados}</div>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
            <h3 className="text-gray-700 font-medium mb-1 text-sm">Pendentes</h3>
            <div className="text-lg font-bold text-gray-600">{salesData.totalPendentes}</div>
          </div>
        </div>

        {/* Cabeçalho da tabela */}
        <div className="grid grid-cols-5 gap-2 mb-1 font-medium text-center text-sm bg-app-blue text-white p-2 rounded-t-lg shadow-sm">
          <div className="text-left">Dia</div>
          <div>Positivo</div>
          <div>Negativo</div>
          <div>Pendente</div>
          <div>Total</div>
        </div>
        
        {/* Linhas da tabela */}
        <div className="space-y-1">
          {routes.map((route, index) => (
            <div 
              key={index} 
              className={`grid grid-cols-5 gap-2 py-3 px-3 bg-white rounded-lg font-medium text-center shadow-sm border border-slate-100 ${
                route.total > 0 
                  ? 'cursor-pointer hover:bg-slate-100 transition-colors' 
                  : 'opacity-60'
              }`}
              onClick={() => route.total > 0 && handleDaySelect(route.day)}
            >
              <div className="text-left">
                <span>{route.day}</span>
                {route.total > 0 && (
                  <div className="text-xs text-blue-600 mt-0.5">
                    {route.clients.length} cliente{route.clients.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
              <div className="text-green-600">{route.positivados}</div>
              <div className="text-red-600">{route.negativados}</div>
              <div className="text-gray-600">{route.pendentes}</div>
              <div className="text-gray-800 font-bold">{route.total}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VisitRoutes;
