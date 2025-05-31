import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import AppButton from '@/components/AppButton';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { useAuth } from '@/hooks/useAuth';
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

interface Client {
  id: string;
  name: string;
  company_name?: string;
  code?: number;
  active: boolean;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  visit_days?: string[];
  status?: 'positivado' | 'negativado' | 'pendente';
  orderTotal?: number;
  hasLocalOrders?: boolean;
  localOrdersCount?: number;
  hasTransmittedOrders?: boolean;
  transmittedOrdersCount?: number;
}

const VisitRoutes = () => {
  const navigate = useNavigate();
  const { salesRep } = useAuth();
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [salesData, setSalesData] = useState<SalesData>({
    totalSales: 0,
    totalPositivados: 0,
    totalNegativados: 0,
    totalPendentes: 0,
    positivadosValue: 0
  });
  const [loading, setLoading] = useState(true);
  const [clientsData, setClientsData] = useState<{ [key: string]: Client[] }>({});
  
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
        
        // Verificar se há vendedor logado
        if (!salesRep?.id) {
          console.log('❌ No sales rep logged in');
          return;
        }
        
        console.log('🔍 Fetching customers from Supabase and local orders for sales rep:', salesRep.id);
        
        // Buscar clientes ativos com dias de visita definidos do Supabase FILTRADOS pelo vendedor logado
        const { data: customers, error: customersError } = await supabase
          .from('customers')
          .select('id, name, company_name, code, active, phone, address, city, state, visit_days')
          .eq('active', true)
          .eq('sales_rep_id', salesRep.id) // ✅ FILTRAR pelo vendedor logado
          .not('visit_days', 'is', null);
        
        if (customersError) {
          console.error('❌ Error fetching customers:', customersError);
          throw customersError;
        }
        
        // Buscar pedidos locais (incluindo transmitidos)
        const db = getDatabaseAdapter();
        const localOrders = await db.getOrders();
        
        // Filtrar pedidos válidos do dia atual (pending_sync OU transmitted)
        const today = new Date().toISOString().split('T')[0];
        const todayValidOrders = localOrders.filter(order => {
          const orderDate = new Date(order.date || order.order_date || order.created_at).toISOString().split('T')[0];
          // Incluir pedidos pendentes E transmitidos (excluir apenas deleted e error)
          const isValidOrder = order.sync_status === 'pending_sync' || 
                              order.sync_status === 'transmitted' || 
                              order.sync_status === 'synced';
          return isValidOrder && orderDate === today;
        });
        
        console.log('👥 Loaded customers for sales rep:', customers);
        console.log('📋 Valid local orders for today (including transmitted):', todayValidOrders);
        
        // PRIMEIRO: Calcular totais únicos por cliente (incluindo pedidos transmitidos)
        const uniqueClientStats = new Map<string, {
          hasPositive: boolean;
          hasNegative: boolean;
          totalSales: number;
        }>();
        
        // Processar cada cliente único uma vez
        customers?.forEach(customer => {
          const clientOrders = todayValidOrders.filter(order => order.customer_id === customer.id);
          
          if (clientOrders.length > 0) {
            const hasPositive = clientOrders.some(order => 
              order.status === 'pending' || 
              order.status === 'processed' || 
              order.status === 'delivered'
            );
            const hasNegative = clientOrders.some(order => order.status === 'cancelled');
            
            const positiveOrdersValue = clientOrders
              .filter(order => 
                order.status === 'pending' || 
                order.status === 'processed' || 
                order.status === 'delivered'
              )
              .reduce((sum, order) => sum + (order.total || 0), 0);
            
            uniqueClientStats.set(customer.id, {
              hasPositive,
              hasNegative,
              totalSales: hasPositive ? positiveOrdersValue : 0
            });
          }
        });
        
        // Calcular totais gerais únicos (incluindo pedidos transmitidos)
        let totalSales = 0;
        let totalPositivados = 0;
        let totalNegativados = 0;
        let positivadosValue = 0;
        
        uniqueClientStats.forEach(stats => {
          if (stats.hasPositive) {
            totalPositivados++;
            totalSales += stats.totalSales;
            positivadosValue += stats.totalSales;
          } else if (stats.hasNegative) {
            totalNegativados++;
          }
        });
        
        // Calcular pendentes (clientes sem pedidos válidos)
        const clientsWithValidOrders = new Set(todayValidOrders.map(order => order.customer_id));
        const totalPendentes = (customers?.length || 0) - clientsWithValidOrders.size;
        
        console.log('💰 Unique client stats (including transmitted):', {
          totalSales,
          totalPositivados,
          totalNegativados,
          totalPendentes,
          uniqueClientStats: Array.from(uniqueClientStats.entries())
        });
        
        // SEGUNDO: Processar dados das rotas por dia (para exibição na tabela)
        const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const dayClientsData: { [key: string]: Client[] } = {};
        
        const processedRoutes: RouteData[] = weekDays.map(day => {
          // Encontrar a chave em inglês correspondente ao dia em português
          const englishDay = Object.keys(dayMapping).find(key => dayMapping[key] === day);
          
          if (!englishDay) {
            dayClientsData[day] = [];
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
          
          // Processar clientes com status para o dia
          const clientsWithStatus = dayClients.map(client => {
            const clientStats = uniqueClientStats.get(client.id);
            
            let status: 'positivado' | 'negativado' | 'pendente' = 'pendente';
            let orderTotal = 0;
            let hasLocalOrders = false;
            let localOrdersCount = 0;
            let hasTransmittedOrders = false;
            let transmittedOrdersCount = 0;
            
            const clientLocalOrders = todayValidOrders.filter(order => order.customer_id === client.id);
            const pendingLocalOrders = clientLocalOrders.filter(order => order.sync_status === 'pending_sync');
            const transmittedLocalOrders = clientLocalOrders.filter(order => 
              order.sync_status === 'transmitted' || order.sync_status === 'synced'
            );
            
            hasLocalOrders = pendingLocalOrders.length > 0;
            localOrdersCount = pendingLocalOrders.length;
            hasTransmittedOrders = transmittedLocalOrders.length > 0;
            transmittedOrdersCount = transmittedLocalOrders.length;
            
            if (clientStats) {
              if (clientStats.hasPositive) {
                status = 'positivado';
                orderTotal = clientStats.totalSales;
              } else if (clientStats.hasNegative) {
                status = 'negativado';
              }
            }
            
            return {
              ...client,
              status,
              orderTotal,
              hasLocalOrders,
              localOrdersCount,
              hasTransmittedOrders,
              transmittedOrdersCount
            };
          });
          
          dayClientsData[day] = clientsWithStatus;
          
          const clientNames = dayClients.map(client => client.name);
          const total = clientNames.length;
          
          // Calcular status dos clientes baseado nos pedidos válidos (incluindo transmitidos)
          let positivados = 0;
          let negativados = 0;
          let pendentes = 0;
          let dayTotalSales = 0;
          
          dayClients.forEach(client => {
            const clientStats = uniqueClientStats.get(client.id);
            
            if (clientStats) {
              if (clientStats.hasPositive) {
                positivados++;
                dayTotalSales += clientStats.totalSales;
              } else if (clientStats.hasNegative) {
                negativados++;
              }
            } else {
              // Cliente sem pedidos válidos = pendente
              pendentes++;
            }
          });
          
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
        setClientsData(dayClientsData);
        setSalesData({
          totalSales,
          totalPositivados,
          totalNegativados,
          totalPendentes,
          positivadosValue
        });
        
        console.log('📋 Processed routes by day (including transmitted orders):', processedRoutes);
        console.log('💰 Final unique sales data (including transmitted):', {
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
  }, [salesRep?.id]); // ✅ Adicionar salesRep.id como dependência

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleDaySelect = (day: string) => {
    console.log(`🗓️ Selected day: ${day}`);
    
    const dayClients = clientsData[day] || [];
    
    if (dayClients.length === 0) {
      toast.error(`Nenhum cliente encontrado para ${day}`);
      return;
    }
    
    console.log(`📊 Navigating to client-fullscreen with ${dayClients.length} clients for ${day}`);
    
    // Navegar diretamente para a visualização full-screen com o dia correto
    navigate('/client-fullscreen', {
      state: {
        clients: dayClients,
        initialIndex: 0,
        day: day
      }
    });
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
            <h3 className="text-gray-700 font-medium mb-1 text-sm">Total de Vendas (Local)</h3>
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
