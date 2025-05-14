
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import Header from '@/components/Header';
import AppButton from '@/components/AppButton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { toast } from '@/components/ui/use-toast';

interface Client {
  id: string;
  nome: string;
  fantasia: string;
  codigo: string;
  status: string;
}

const ClientsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { day } = location.state || { day: 'Segunda' };
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoading(true);
        const db = getDatabaseAdapter();
        // First get the visit routes for the day
        const routes = await db.getVisitRoutes();
        const dayRoute = routes.find(route => route.day === day);
        
        if (dayRoute && dayRoute.clients && dayRoute.clients.length > 0) {
          // Get all clients
          const allClients = await db.getClients();
          // Filter clients for this route
          const routeClients = allClients.filter(client => 
            dayRoute.clients.includes(client.id)
          );
          setClients(routeClients);
        } else {
          setClients([]);
        }
      } catch (error) {
        console.error('Error loading clients:', error);
        toast({
          title: "Erro",
          description: "Falha ao carregar lista de clientes",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadClients();
  }, [day]);
  
  const handleClientSelect = (client: Client) => {
    navigate('/cliente-detalhes', { state: { clientId: client.id } });
  };
  
  const handleGoBack = () => {
    // Changed to return to the routes page instead of home
    navigate('/rotas');
  };
  
  // Helper to determine status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ativo':
        return 'bg-green-100 text-green-800';
      case 'positivado':
        return 'bg-green-100 text-green-800';
      case 'negativado':
        return 'bg-red-100 text-red-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'inativo':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title={`Clientes de ${day}`} showBackButton backgroundColor="blue" />
      
      <div className="flex-1 p-4">
        <ScrollArea className="h-full">
          {loading ? (
            <div className="text-center text-gray-500 py-8">
              Carregando clientes...
            </div>
          ) : clients.length > 0 ? (
            <div className="space-y-3">
              {clients.map(client => (
                <div 
                  key={client.id}
                  className="bg-white rounded-lg shadow p-3 flex items-center gap-3 cursor-pointer"
                  onClick={() => handleClientSelect(client)}
                >
                  <div className="bg-blue-100 p-2 rounded-full">
                    <User className="h-5 w-5 text-app-blue" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div className="font-medium">{client.fantasia}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(client.status)}`}>
                        {client.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">{client.nome}</div>
                    <div className="text-xs text-gray-400 mt-1">Código: {client.codigo}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Nenhum cliente registrado para este dia.
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
          <span>Voltar</span>
        </AppButton>
      </div>
    </div>
  );
};

export default ClientsList;
