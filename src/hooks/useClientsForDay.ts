
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { Client } from '@/types/visit-routes';

const dayMapping: { [key: string]: string } = {
  'monday': 'Segunda',
  'tuesday': 'Terça',
  'wednesday': 'Quarta',
  'thursday': 'Quinta',
  'friday': 'Sexta',
  'saturday': 'Sábado'
};

export const useClientsForDay = (day: string) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { salesRep, isLoading: authLoading } = useAuth();

  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoading(true);
        
        if (!salesRep?.id) {
          console.log('❌ Vendedor não autenticado');
          toast.error('Vendedor não autenticado');
          setClients([]);
          return;
        }
        
        console.log(`📅 Loading clients for: ${day} - Vendedor: ${salesRep.name} (${salesRep.id})`);
        
        const englishDay = Object.keys(dayMapping).find(key => dayMapping[key] === day);
        
        if (!englishDay) {
          console.log(`❌ No English day found for ${day}`);
          setClients([]);
          return;
        }
        
        console.log(`🔍 Fetching customers for ${day} (${englishDay}) from local database...`);
        
        const db = getDatabaseAdapter();
        const allCustomers = await db.getCustomers();
        
        const dayClients = allCustomers.filter(customer => 
          customer.active && 
          customer.sales_rep_id === salesRep.id &&
          customer.visit_days && 
          Array.isArray(customer.visit_days) && 
          customer.visit_days.includes(englishDay)
        );
        
        const today = new Date().toISOString().split('T')[0];
        const clientIds = dayClients.map(client => client.id);
        
        const allLocalOrders = await db.getAllOrders();
        const localOrders = allLocalOrders.filter(order => 
          order.sales_rep_id === salesRep.id && 
          clientIds.includes(order.customer_id) &&
          order.sync_status !== 'error' &&
          new Date(order.date || order.order_date || order.created_at).toISOString().split('T')[0] === today
        );
        
        console.log('👥 Day clients for salesperson:', dayClients);
        console.log('📱 Local orders for today:', localOrders);
        
        const clientsWithStatus = dayClients.map(client => {
          const clientLocalOrders = localOrders.filter(order => 
            order.customer_id === client.id
          );
          
          const pendingLocalOrders = clientLocalOrders.filter(order => order.sync_status === 'pending_sync');
          const transmittedLocalOrders = clientLocalOrders.filter(order => 
            order.sync_status === 'transmitted' || order.sync_status === 'synced'
          );
          
          let status: 'positivado' | 'negativado' | 'pendente' = 'pendente';
          let orderTotal = 0;
          let hasLocalOrders = pendingLocalOrders.length > 0;
          let localOrdersCount = pendingLocalOrders.length;
          let hasTransmittedOrders = transmittedLocalOrders.length > 0;
          let transmittedOrdersCount = transmittedLocalOrders.length;
          
          if (client.status === 'negativado') {
            status = 'negativado';
          } else if (clientLocalOrders.length > 0) {
            const hasPositive = clientLocalOrders.some(order => 
              order.status === 'pending' || 
              order.status === 'processed' || 
              order.status === 'delivered'
            );
            const hasNegative = clientLocalOrders.some(order => 
              order.status === 'negativado' || order.status === 'cancelled'
            );
            
            if (hasPositive) {
              status = 'positivado';
              orderTotal = clientLocalOrders
                .filter(order => 
                  order.status === 'pending' || 
                  order.status === 'processed' || 
                  order.status === 'delivered'
                )
                .reduce((sum, order) => sum + (order.total || 0), 0);
            } else if (hasNegative) {
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

        const sortedClients = clientsWithStatus.sort((a, b) => {
          const aVisited = a.status === 'positivado' || a.status === 'negativado';
          const bVisited = b.status === 'positivado' || b.status === 'negativado';
          
          if (aVisited && !bVisited) return -1;
          if (!aVisited && bVisited) return 1;
          
          if (aVisited && bVisited) {
            if (a.visit_sequence != null && b.visit_sequence != null) {
              if (a.visit_sequence !== b.visit_sequence) {
                return a.visit_sequence - b.visit_sequence;
              }
            }
            if (a.visit_sequence == null && b.visit_sequence != null) return 1;
            if (a.visit_sequence != null && b.visit_sequence == null) return -1;
            return a.name.localeCompare(b.name);
          }
          
          if (a.visit_sequence == null && b.visit_sequence == null) {
            return a.name.localeCompare(b.name);
          }
          if (a.visit_sequence == null) return -1;
          if (b.visit_sequence == null) return 1;
          
          if (a.visit_sequence !== b.visit_sequence) {
            return a.visit_sequence - b.visit_sequence;
          }
          
          return a.name.localeCompare(b.name);
        });
        
        console.log(`✅ Clients with smart ordering for ${day} (salesperson ${salesRep.name}):`, sortedClients);
        setClients(sortedClients);
        
      } catch (error) {
        console.error('❌ Error loading clients:', error);
        toast.error('Erro ao carregar clientes');
        setClients([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (day && !authLoading) {
        loadClients();
    } else if (authLoading) {
        setLoading(true);
    } else {
        setLoading(false);
    }
  }, [day, salesRep, authLoading]);

  return { clients, loading, authLoading, salesRep };
};
