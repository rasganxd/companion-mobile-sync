
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
  
  const handleClientSelect = (clientId: string) => {
    navigate('/cliente-detalhes', { state: { clientId } });
  };
  
  const handleGoBack = () => {
    navigate('/');
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
                  onClick={() => handleClientSelect(client.id)}
                >
                  <div className="bg-blue-100 p-2 rounded-full">
                    <User className="h-5 w-5 text-app-blue" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div className="font-medium">{client.fantasia}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        client.status === 'Ativo' ? 'bg-green-100 text-green-800' : 
                        client.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
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
