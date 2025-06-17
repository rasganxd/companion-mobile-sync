
import { useState, useEffect } from 'react';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { RouteData, SalesData } from '@/types/visit-routes';

const dayMapping: { [key: string]: string; } = {
  'monday': 'Segunda',
  'tuesday': 'Terça',
  'wednesday': 'Quarta',
  'thursday': 'Quinta',
  'friday': 'Sexta',
  'saturday': 'Sábado'
};

export const useVisitRoutesData = () => {
  console.log('🔄 useVisitRoutesData - HOOK START');
  
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

  console.log('🔄 useVisitRoutesData - Auth state:', {
    salesRep: salesRep ? `${salesRep.name} (${salesRep.id})` : 'null'
  });

  useEffect(() => {
    console.log('🔄 useVisitRoutesData - useEffect triggered, salesRep:', salesRep?.id || 'null');
    
    const loadRoutesData = async () => {
      try {
        console.log('🔄 useVisitRoutesData - loadRoutesData START');
        setLoading(true);
        
        if (!salesRep?.id) {
          console.log('❌ useVisitRoutesData - No salesRep ID, exiting');
          return;
        }
        
        console.log('🔄 useVisitRoutesData - Getting database adapter...');
        const db = getDatabaseAdapter();
        
        console.log('🔄 useVisitRoutesData - Loading customers...');
        const allCustomers = await db.getCustomers();
        console.log(`📊 useVisitRoutesData - Total customers: ${allCustomers.length}`);
        
        const customers = allCustomers.filter(customer => {
          const isValid = customer.active && 
            customer.sales_rep_id === salesRep.id && 
            customer.visit_days && 
            Array.isArray(customer.visit_days) && 
            customer.visit_days.length > 0;
          
          if (!isValid) {
            console.log(`❌ Customer ${customer.name} filtered out:`, {
              active: customer.active,
              sales_rep_id: customer.sales_rep_id,
              expected_sales_rep_id: salesRep.id,
              visit_days: customer.visit_days,
              visit_days_type: typeof customer.visit_days,
              is_array: Array.isArray(customer.visit_days)
            });
          }
          
          return isValid;
        });
        
        console.log(`📊 useVisitRoutesData - Filtered customers for salesRep ${salesRep.id}: ${customers.length}`);
        
        console.log('🔄 useVisitRoutesData - Loading orders...');
        const localOrders = await db.getOrders();
        console.log(`📊 useVisitRoutesData - Total orders: ${localOrders.length}`);
        
        const today = new Date().toISOString().split('T')[0];
        const todayValidOrders = localOrders.filter(order => {
          const orderDate = new Date(order.date || order.order_date || order.created_at).toISOString().split('T')[0];
          const isValidOrder = order.sync_status === 'pending_sync' || order.sync_status === 'transmitted' || order.sync_status === 'synced';
          return isValidOrder && orderDate === today && order.sales_rep_id === salesRep.id;
        });
        
        console.log(`📊 useVisitRoutesData - Today's valid orders: ${todayValidOrders.length}`);

        const uniqueClientStats = new Map<string, { hasPositive: boolean; hasNegative: boolean; totalSales: number; }>();
        customers.forEach(customer => {
          const clientOrders = todayValidOrders.filter(order => order.customer_id === customer.id);
          if (clientOrders.length > 0) {
            const hasPositive = clientOrders.some(order => order.status === 'pending' || order.status === 'processed' || order.status === 'delivered');
            const hasNegative = clientOrders.some(order => order.status === 'cancelled');
            const positiveOrdersValue = clientOrders.filter(order => order.status === 'pending' || order.status === 'processed' || order.status === 'delivered').reduce((sum, order) => sum + (order.total || 0), 0);
            uniqueClientStats.set(customer.id, { hasPositive, hasNegative, totalSales: hasPositive ? positiveOrdersValue : 0 });
          }
        });

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

        const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const processedRoutes: RouteData[] = weekDays.map(day => {
          const englishDay = Object.keys(dayMapping).find(key => dayMapping[key] === day);
          if (!englishDay) {
            return { day, visited: 0, remaining: 0, total: 0, clients: [], positivados: 0, negativados: 0, pendentes: 0, totalSales: 0 };
          }
          const dayClients = customers.filter(customer => customer.visit_days && Array.isArray(customer.visit_days) && customer.visit_days.includes(englishDay));
          
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

          return { day, visited: positivados + negativados, remaining: pendentes, total, clients: clientNames, positivados, negativados, pendentes, totalSales: dayTotalSales };
        });
        
        console.log('📊 useVisitRoutesData - Processed routes:', processedRoutes);
        console.log('📊 useVisitRoutesData - Sales data:', { totalSales, totalPositivados, totalNegativados, totalPendentes, positivadosValue });
        
        setRoutes(processedRoutes);
        setSalesData({ totalSales, totalPositivados, totalNegativados, totalPendentes, positivadosValue });

        console.log('✅ useVisitRoutesData - Data loaded successfully');

      } catch (error) {
        console.error('❌ useVisitRoutesData - Error loading routes data:', error);
        toast.error('Erro ao carregar dados das rotas');
      } finally {
        console.log('🔄 useVisitRoutesData - Setting loading to false');
        setLoading(false);
      }
    };
    
    loadRoutesData();
  }, [salesRep]);

  console.log('🔄 useVisitRoutesData - HOOK END, returning:', {
    routes: routes.length,
    salesData,
    loading,
    salesRep: salesRep ? 'present' : 'null'
  });

  return { routes, salesData, loading, salesRep };
};
