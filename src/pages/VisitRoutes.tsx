
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import AppButton from '@/components/AppButton';
import { Progress } from '@/components/ui/progress';
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
        
        if (!salesRep?.id) {
          console.log('❌ No sales rep logged in');
          return;
        }
        
        console.log('🔍 Fetching customers from local database for sales rep:', salesRep.id);
        
        // Buscar clientes do banco local
        const db = getDatabaseAdapter();
        const allCustomers = await db.getCustomers();
        
        // Filtrar clientes ativos do vendedor com dias de visita definidos
        const customers = allCustomers.filter(customer => 
          customer.active && 
          customer.sales_rep_id === salesRep.id &&
          customer.visit_days && 
          Array.isArray(customer.visit_days) &&
          customer.visit_days.length > 0
        );
        
        // Buscar pedidos locais
        const localOrders = await db.getOrders();
        
        // Filtrar pedidos válidos do dia atual
        const today = new Date().toISOString().split('T')[0];
        const todayValidOrders = localOrders.filter(order => {
          const orderDate = new Date(order.date || order.order_date || order.created_at).toISOString().split('T')[0];
          const isValidOrder = order.sync_status === 'pending_sync' || 
                              order.sync_status === 'transmitted' || 
                              order.sync_status === 'synced';
          return isValidOrder && orderDate === today && order.sales_rep_id === salesRep.id;
        });
        
        console.log('👥 Loaded customers for sales rep:', customers);
        console.log('📋 Valid local orders for today:', todayValidOrders);
        
        // Calcular totais únicos por cliente
        const uniqueClientStats = new Map<string, {
          hasPositive: boolean;
          hasNegative: boolean;
          totalSales: number;
        }>();
        
        customers.forEach(customer => {
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
        
        // Calcular totais gerais
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
        
        const clientsWithValidOrders = new Set(todayValidOrders.map(order => order.customer_id));
        const totalPendentes = customers.length - clientsWithValidOrders.size;
        
        console.log('💰 Unique client stats:', {
          totalSales,
          totalPositivados,
          totalNegativados,
          totalPendentes
        });
        
        // Processar rotas por dia
        const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const dayClientsData: { [key: string]: Client[] } = {};
        
        const processedRoutes: RouteData[] = weekDays.map(day => {
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
          
          const dayClients = customers.filter(customer => 
            customer.visit_days && 
            Array.isArray(customer.visit_days) && 
            customer.visit_days.includes(englishDay)
          );
          
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
        
      } catch (error) {
        console.error('❌ Error loading routes data:', error);
        toast.error('Erro ao carregar dados das rotas');
      } finally {
        setLoading(false);
      }
    };
    
    loadRoutesData();
  }, [salesRep]);

  const handleVisitDay = (day: string) => {
    navigate('/clients-list', {
      state: { day }
    });
  };

  const getRouteColor = (visited: number, total: number) => {
    if (total === 0) return 'bg-gray-200';
    const percentage = (visited / total) * 100;
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header title="Rotas de Visita" showBackButton backgroundColor="blue" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-lg">Carregando rotas...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!salesRep) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header title="Rotas de Visita" showBackButton backgroundColor="blue" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-lg">Vendedor não autenticado</div>
            <div className="text-sm mt-2">Faça a primeira sincronização para continuar</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="Rotas de Visita" showBackButton backgroundColor="blue" />
      
      <div className="p-3 flex-1">
        {/* Resumo Compacto de Vendas */}
        <div className="bg-white rounded-lg shadow p-3 mb-3">
          <h2 className="text-base font-semibold mb-2">Resumo do Dia</h2>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-600">
                {salesData.totalPositivados}
              </div>
              <div className="text-xs text-gray-600">Positivados</div>
              <div className="text-sm font-semibold text-green-700">
                R$ {salesData.positivadosValue.toFixed(0)}
              </div>
            </div>
            
            <div className="text-center p-2 bg-red-50 rounded">
              <div className="text-lg font-bold text-red-600">
                {salesData.totalNegativados}
              </div>
              <div className="text-xs text-gray-600">Negativados</div>
            </div>
            
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-lg font-bold text-gray-600">
                {salesData.totalPendentes}
              </div>
              <div className="text-xs text-gray-600">Pendentes</div>
            </div>
          </div>
        </div>

        {/* Lista Compacta de Rotas */}
        <div className="space-y-2">
          {routes.map((route) => (
            <AppButton
              key={route.day}
              variant="gray"
              fullWidth
              onClick={() => handleVisitDay(route.day)}
              className="text-left p-3 h-auto"
            >
              <div className="flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-base">{route.day}</div>
                    <div className="text-xs text-gray-500">
                      ({route.total})
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5 leading-tight">
                    {route.pendentes} PENDENTES • {route.positivados} POSITIVADOS • {route.negativados} NEGATIVADOS
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    R$ {route.totalSales.toFixed(0)}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-xs font-medium">
                    {route.visited}/{route.total}
                  </div>
                  <div className="w-12">
                    <Progress 
                      value={route.total > 0 ? (route.visited / route.total) * 100 : 0} 
                      className="h-1.5"
                    />
                  </div>
                </div>
              </div>
            </AppButton>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VisitRoutes;
