import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import Header from '@/components/Header';
import AppButton from '@/components/AppButton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
}

const ClientsList = () => {
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
        const { data: customers, error } = await supabase
          .from('customers')
          .select('id, name, company_name, code, active, phone, address, city, state, visit_days')
          .eq('active', true)
          .not('visit_days', 'is', null);
        
        if (error) {
          console.error('❌ Error fetching customers:', error);
          throw error;
        }
        
        console.log('👥 All customers fetched:', customers);
        
        // Filtrar clientes que têm esse dia nas suas visit_days
        const dayClients = customers?.filter(customer => 
          customer.visit_days && 
          Array.isArray(customer.visit_days) && 
          customer.visit_days.includes(englishDay)
        ) || [];
        
        console.log(`✅ Filtered clients for ${day} (${englishDay}):`, dayClients);
        setClients(dayClients);
        
      } catch (error) {
        console.error('❌ Error loading clients:', error);
        toast.error("Falha ao carregar lista de clientes");
        setClients([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadClients();
  }, [day]);
  
  const handleClientSelect = (client: Client) => {
    console.log('👤 Selected client:', client);
    // Navegar para a tela de atividades (Index) passando os dados do cliente
    navigate('/', { 
      state: { 
        clientId: client.id, 
        clientName: client.company_name || client.name,
        day: day
      } 
    });
  };
  
  const handleGoBack = () => {
    // Navigate back to visit routes page
    navigate('/visit-routes');
  };
  
  // Helper to determine status color - usando 'active' como status
  const getStatusColor = (active: boolean) => {
    return active 
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
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
              
              {clients.map(client => (
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
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(client.active)}`}>
                        {client.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">{client.name}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Código: {client.code || 'N/A'}
                      {client.address && (
                        <span className="ml-2">• {client.address}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
