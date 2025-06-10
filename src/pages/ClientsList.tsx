import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import AppButton from '@/components/AppButton';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  visit_sequence?: number;
  status?: 'positivado' | 'negativado' | 'pendente';
  orderTotal?: number;
  hasLocalOrders?: boolean;
  localOrdersCount?: number;
  hasTransmittedOrders?: boolean;
  transmittedOrdersCount?: number;
}

const ClientsList = () => {
  const { goBack, navigateToClientFullScreen } = useAppNavigation();
  const navigate = useNavigate();
  const location = useLocation();
  
  const getDayFromState = () => {
    if (location.state?.day) {
      return location.state.day;
    }
    
    const today = new Date();
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const currentDay = dayNames[today.getDay()];
    
    console.log('⚠️ Nenhum dia especificado no state, usando dia atual:', currentDay);
    return currentDay;
  };
  
  const [day] = useState(getDayFromState());
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
        
        console.log(`🔍 Fetching customers for ${day} (${englishDay}) from local database...`);
        
        // Buscar clientes do banco local
        const db = getDatabaseAdapter();
        const allCustomers = await db.getCustomers();
        
        // Filtrar clientes ativos do vendedor que têm o dia de visita
        const dayClients = allCustomers.filter(customer => 
          customer.active && 
          customer.sales_rep_id === salesRep.id &&
          customer.visit_days && 
          Array.isArray(customer.visit_days) && 
          customer.visit_days.includes(englishDay)
        );
        
        const today = new Date().toISOString().split('T')[0];
        const clientIds = dayClients.map(client => client.id);
        
        // Buscar pedidos locais do dia
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
          
          if (clientLocalOrders.length > 0) {
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
          
          console.log(`🔍 Client ${client.name}:`, {
            localOrders: clientLocalOrders.length,
            pendingLocal: pendingLocalOrders.length,
            transmittedLocal: transmittedLocalOrders.length,
            status,
            orderTotal: orderTotal.toFixed(2)
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

        // Smart ordering: visitados primeiro (ocultos), depois pendentes por sequência
        const sortedClients = clientsWithStatus.sort((a, b) => {
          // Primeiro critério: Status (visitados vão para o início, mas serão "ocultos")
          const aVisited = a.status === 'positivado' || a.status === 'negativado';
          const bVisited = b.status === 'positivado' || b.status === 'negativado';
          
          if (aVisited && !bVisited) return -1; // a (visitado) vem antes
          if (!aVisited && bVisited) return 1;  // b (visitado) vem antes
          
          // Se ambos têm o mesmo status (ambos visitados ou ambos pendentes)
          if (aVisited && bVisited) {
            // Para visitados, ordenar por visit_sequence
            if (a.visit_sequence != null && b.visit_sequence != null) {
              if (a.visit_sequence !== b.visit_sequence) {
                return a.visit_sequence - b.visit_sequence;
              }
            }
            if (a.visit_sequence == null && b.visit_sequence != null) return 1;
            if (a.visit_sequence != null && b.visit_sequence == null) return -1;
            return a.name.localeCompare(b.name);
          }
          
          // Para pendentes, aplicar lógica original de ordenação
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

  const handleClientViewDetails = (filteredClients: Client[], initialIndex: number) => {
    console.log('👁️ Opening client full screen view:', {
      clientsCount: filteredClients.length,
      initialIndex,
      day
    });
    
    navigateToClientFullScreen(filteredClients, initialIndex, day);
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
            <div className="text-sm mt-2">Faça a primeira sincronização para continuar</div>
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
            onClientViewDetails={handleClientViewDetails}
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
