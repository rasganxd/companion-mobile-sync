
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import AppButton from '@/components/AppButton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { useAuth } from '@/hooks/useAuth';
import ClientsListContent from '@/components/clients/ClientsListContent';

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

const ClientsList = () => {
  const { goBack } = useAppNavigation();
  const navigate = useNavigate();
  const location = useLocation();
  const { day } = location.state || { day: 'Segunda' };
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { salesRep, isLoading: authLoading } = useAuth();
  
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
    const loadClients = async () => {
      try {
        setLoading(true);
        
        if (authLoading) {
          console.log('🔄 Aguardando autenticação...');
          return;
        }
        
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
        
        console.log(`🔍 Fetching customers for ${day} (${englishDay}) from Supabase...`);
        
        const { data: customers, error: customersError } = await supabase
          .from('customers')
          .select('id, name, company_name, code, active, phone, address, city, state, visit_days')
          .eq('active', true)
          .eq('sales_rep_id', salesRep.id)
          .not('visit_days', 'is', null);
        
        if (customersError) {
          console.error('❌ Error fetching customers:', customersError);
          throw customersError;
        }
        
        const dayClients = customers?.filter(customer => 
          customer.visit_days && 
          Array.isArray(customer.visit_days) && 
          customer.visit_days.includes(englishDay)
        ) || [];
        
        const today = new Date().toISOString().split('T')[0];
        const clientIds = dayClients.map(client => client.id);
        
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('customer_id, status, total, date')
          .in('customer_id', clientIds)
          .gte('date', today)
          .lt('date', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        
        if (ordersError) {
          console.error('❌ Error fetching orders:', ordersError);
        }
        
        const db = getDatabaseAdapter();
        const allLocalOrders = await db.getAllOrders();
        
        const localOrders = allLocalOrders.filter(order => 
          order.sales_rep_id === salesRep.id && clientIds.includes(order.customer_id)
        );
        
        console.log('👥 Day clients for salesperson:', dayClients);
        console.log('📋 Online orders for today:', orders);
        console.log('📱 Local orders for salesperson:', localOrders);
        
        const clientsWithStatus = dayClients.map(client => {
          const clientOnlineOrders = orders?.filter(order => order.customer_id === client.id) || [];
          
          const clientLocalOrders = localOrders.filter(order => 
            order.customer_id === client.id && 
            (order.sync_status === 'pending_sync' || 
             order.sync_status === 'transmitted' || 
             order.sync_status === 'synced')
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
          
          if (clientOnlineOrders.length > 0) {
            const hasPositive = clientOnlineOrders.some(order => 
              order.status === 'pending' || 
              order.status === 'processed' || 
              order.status === 'delivered'
            );
            const hasNegative = clientOnlineOrders.some(order => order.status === 'cancelled');
            
            if (hasPositive) {
              status = 'positivado';
              orderTotal = clientOnlineOrders
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
          
          if (status === 'pendente' && clientLocalOrders.length > 0) {
            const hasPositiveLocal = clientLocalOrders.some(order => 
              order.status === 'pending' || 
              order.status === 'processed' || 
              order.status === 'delivered'
            );
            const hasNegativeLocal = clientLocalOrders.some(order => 
              order.status === 'negativado' || order.status === 'cancelled'
            );
            
            if (hasPositiveLocal) {
              status = 'positivado';
              orderTotal = clientLocalOrders
                .filter(order => 
                  order.status === 'pending' || 
                  order.status === 'processed' || 
                  order.status === 'delivered'
                )
                .reduce((sum, order) => sum + (order.total || 0), 0);
            } else if (hasNegativeLocal) {
              status = 'negativado';
            }
          }
          
          console.log(`🔍 Client ${client.name}:`, {
            onlineOrders: clientOnlineOrders.length,
            localOrders: clientLocalOrders.length,
            pendingLocal: pendingLocalOrders.length,
            transmittedLocal: transmittedLocalOrders.length,
            status,
            orderTotal
          });
          
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
        
        console.log(`✅ Clients with status for ${day} (salesperson ${salesRep.name}):`, clientsWithStatus);
        setClients(clientsWithStatus);
        
      } catch (error) {
        console.error('❌ Error loading clients:', error);
        toast.error('Erro ao carregar clientes');
        setClients([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadClients();
  }, [day, salesRep, authLoading]);
  
  const handleClientSelect = (client: Client) => {
    console.log('👤 Selected client:', client);
    console.log('📅 Day:', day);
    
    navigate('/client-activities', {
      state: {
        clientName: client.company_name || client.name,
        clientId: client.id,
        day: day
      }
    });
  };
  
  const handleGoBack = () => {
    console.log('🔙 Going back to visit routes');
    goBack();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header title={`Clientes de ${day}`} showBackButton backgroundColor="blue" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-lg">Verificando autenticação...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!salesRep) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header title={`Clientes de ${day}`} showBackButton backgroundColor="blue" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-lg">Vendedor não autenticado</div>
            <div className="text-sm mt-2">Faça login para ver os clientes</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title={`Clientes de ${day}`} showBackButton backgroundColor="blue" />
      
      <div className="flex-1 p-4">
        <ScrollArea className="h-full">
          <ClientsListContent
            loading={loading}
            clients={clients}
            day={day}
            salesRep={salesRep}
            onClientSelect={handleClientSelect}
          />
        </ScrollArea>
      </div>
      
      <div className="p-3 bg-white border-t">
        <AppButton 
          variant="gray"
          fullWidth
          onClick={handleGoBack}
          className="flex items-center justify-center gap-2"
        >
          <ArrowLeft size={18} />
          <span>Voltar para Rotas</span>
        </AppButton>
      </div>
    </div>
  );
};

export default ClientsList;
