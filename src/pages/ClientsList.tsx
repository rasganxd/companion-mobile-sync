
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import Header from '@/components/Header';
import AppButton from '@/components/AppButton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';

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
    const loadClients = async () => {
      try {
        setLoading(true);
        console.log(`📅 Loading clients for: ${day}`);
        
        // Encontrar a chave em inglês correspondente ao dia em português
        const englishDay = Object.keys(dayMapping).find(key => dayMapping[key] === day);
        
        if (!englishDay) {
          console.log(`❌ No English day found for ${day}`);
          setClients([]);
          return;
        }
        
        console.log(`🔍 Fetching customers for ${day} (${englishDay}) from Supabase...`);
        
        // Buscar clientes ativos com dias de visita definidos para o dia específico
        const { data: customers, error: customersError } = await supabase
          .from('customers')
          .select('id, name, company_name, code, active, phone, address, city, state, visit_days')
          .eq('active', true)
          .not('visit_days', 'is', null);
        
        if (customersError) {
          console.error('❌ Error fetching customers:', customersError);
          throw customersError;
        }
        
        // Filtrar clientes que têm esse dia nas suas visit_days
        const dayClients = customers?.filter(customer => 
          customer.visit_days && 
          Array.isArray(customer.visit_days) && 
          customer.visit_days.includes(englishDay)
        ) || [];
        
        // Buscar pedidos do dia atual para estes clientes (online)
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
          // Continuar sem os dados de pedidos online
        }
        
        // Buscar pedidos locais para estes clientes (incluindo transmitidos)
        const db = getDatabaseAdapter();
        const localOrders = await db.getAllOrders();
        
        console.log('👥 Day clients:', dayClients);
        console.log('📋 Online orders for today:', orders);
        console.log('📱 Local orders:', localOrders);
        
        // Determinar status de cada cliente baseado nos pedidos (online + local incluindo transmitidos)
        const clientsWithStatus = dayClients.map(client => {
          const clientOnlineOrders = orders?.filter(order => order.customer_id === client.id) || [];
          
          // Incluir pedidos locais válidos (pending_sync, transmitted, synced)
          const clientLocalOrders = localOrders.filter(order => 
            order.customer_id === client.id && 
            (order.sync_status === 'pending_sync' || 
             order.sync_status === 'transmitted' || 
             order.sync_status === 'synced')
          );
          
          // Separar por tipo de pedido local
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
          
          // Verificar pedidos online primeiro
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
          
          // Se não há pedidos online, verificar TODOS os pedidos locais (incluindo transmitidos)
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
        
        console.log(`✅ Clients with status for ${day} (including transmitted):`, clientsWithStatus);
        setClients(clientsWithStatus);
        
      } catch (error) {
        console.error('❌ Error loading clients:', error);
        setClients([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadClients();
  }, [day]);
  
  const handleClientSelect = (client: Client) => {
    console.log('👤 Selected client:', client);
    console.log('📅 Day:', day);
    
    // Navegar para a tela de atividades passando todas as informações necessárias
    navigate('/client-activities', {
      state: {
        clientName: client.company_name || client.name, // Priorizar nome fantasia
        clientId: client.id,
        day: day
      }
    });
  };
  
  const handleGoBack = () => {
    console.log('🔙 Going back to visit routes');
    goBack();
  };
  
  // Helper to determine status color and text
  const getStatusInfo = (client: Client) => {
    const localInfo = client.hasLocalOrders ? ` (${client.localOrdersCount} local)` : '';
    const transmittedInfo = client.hasTransmittedOrders ? ` (${client.transmittedOrdersCount} transmitido)` : '';
    
    switch (client.status) {
      case 'positivado':
        return {
          color: 'bg-green-100 text-green-800',
          text: `Positivado${localInfo}${transmittedInfo}`
        };
      case 'negativado':
        return {
          color: 'bg-red-100 text-red-800',
          text: `Negativado${localInfo}${transmittedInfo}`
        };
      case 'pendente':
      default:
        return {
          color: (client.hasLocalOrders || client.hasTransmittedOrders) ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800',
          text: `Pendente${localInfo}${transmittedInfo}`
        };
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title={`Clientes de ${day}`} showBackButton backgroundColor="blue" />
      
      <div className="flex-1 p-4">
        <ScrollArea className="h-full">
          {loading ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-lg">Carregando clientes...</div>
              <div className="text-sm mt-2">Buscando clientes para {day}</div>
            </div>
          ) : clients.length > 0 ? (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-3">
                {clients.length} cliente{clients.length !== 1 ? 's' : ''} encontrado{clients.length !== 1 ? 's' : ''} para {day}
              </div>
              
              {clients.map(client => {
                const statusInfo = getStatusInfo(client);
                
                return (
                  <div 
                    key={client.id}
                    className="bg-white rounded-lg shadow p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleClientSelect(client)}
                  >
                    <div className="bg-blue-100 p-2 rounded-full">
                      <User className="h-5 w-5 text-app-blue" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div className="font-medium">{client.company_name || client.name}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                          {statusInfo.text}
                        </span>
                      </div>
                      {client.company_name && client.name && (
                        <div className="text-sm text-gray-500">Razão Social: {client.name}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        Código: {client.code || 'N/A'}
                        {client.address && (
                          <span className="ml-2">• {client.address}</span>
                        )}
                        {(client.status === 'positivado' && client.orderTotal && client.orderTotal > 0) && (
                          <span className="ml-2 text-green-600 font-medium">
                            • {formatCurrency(client.orderTotal)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-lg mb-2">Nenhum cliente registrado</div>
              <div className="text-sm">Não há clientes cadastrados para {day}</div>
            </div>
          )}
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
