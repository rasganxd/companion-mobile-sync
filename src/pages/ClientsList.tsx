
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, Building2, MapPin, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import Header from '@/components/Header';
import AppButton from '@/components/AppButton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { ClientRepository, useConnectionStore, ConnectionStatus, SyncStatus } from '@/lib/sync';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Temporary mock for authentication
const MOCK_TOKEN = "mock-token";
const MOCK_SALES_REP_ID = "1";

const ClientsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { day } = location.state || { day: 'Segunda' };
  const [clients, setClients] = useState<ClientRepository.Client[]>([]);
  const [loading, setLoading] = useState(true);
  const connectionStatus = useConnectionStore(state => state.status);
  
  useEffect(() => {
    loadClients();
  }, []);
  
  const loadClients = async () => {
    setLoading(true);
    try {
      const allClients = await ClientRepository.getAllClients();
      setClients(allClients);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error("Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  };
  
  const handleClientSelect = (client: ClientRepository.Client) => {
    navigate('/fazer-pedidos', { 
      state: { 
        client: {
          id: client.id,
          name: client.name,
          fantasyName: client.fantasy_name
        } 
      }
    });
  };
  
  const handleGoBack = () => {
    navigate('/');
  };
  
  const handleSyncComplete = () => {
    loadClients();
    toast.success("Dados atualizados com sucesso");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title={`Clientes de ${day}`} 
        showBackButton 
        backgroundColor="blue"
        rightContent={
          <SyncStatus 
            token={MOCK_TOKEN}
            salesRepId={MOCK_SALES_REP_ID}
          />
        }
      />
      
      <div className="bg-app-blue text-white px-3 py-1 text-xs flex items-center justify-between">
        <span>Clientes: {clients.length}</span>
        <div className={connectionStatus === ConnectionStatus.ONLINE ? 'text-green-300' : 'text-orange-300'}>
          {connectionStatus === ConnectionStatus.ONLINE ? (
            <div className="flex items-center">
              <Wifi size={12} className="mr-1" /> Online
            </div>
          ) : (
            <div className="flex items-center">
              <WifiOff size={12} className="mr-1" /> Offline
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 p-4">
        <ScrollArea className="h-full">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <RefreshCw size={24} className="animate-spin text-gray-400" />
            </div>
          ) : clients.length > 0 ? (
            <div className="space-y-3">
              {clients.map((client) => (
                <Card 
                  key={client.id}
                  className="overflow-hidden cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => handleClientSelect(client)}
                >
                  <div className="bg-gradient-to-r from-app-blue to-app-blue-dark p-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="bg-white text-app-blue p-1 rounded-lg font-bold text-sm">
                        {client.id}
                      </div>
                      <span className="text-white text-sm">{client.status || 'Pendente'}</span>
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <User size={16} className="text-app-blue mt-1" />
                      <div>
                        <div className="text-xs text-gray-500">Cliente:</div>
                        <div className="font-medium text-sm">{client.name}</div>
                      </div>
                    </div>
                    
                    {client.fantasy_name && (
                      <div className="flex items-start gap-2">
                        <Building2 size={16} className="text-app-blue mt-1" />
                        <div>
                          <div className="text-xs text-gray-500">Fantasia:</div>
                          <div className="font-medium text-sm">{client.fantasy_name}</div>
                        </div>
                      </div>
                    )}
                    
                    {client.address && (
                      <div className="flex items-start gap-2">
                        <MapPin size={16} className="text-app-blue mt-1" />
                        <div>
                          <div className="text-xs text-gray-500">Endereço:</div>
                          <div className="text-sm text-app-blue">{client.address}</div>
                          <div className="text-sm">{client.city}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8 space-y-3">
              <p>Nenhum cliente registrado para este dia.</p>
              
              <Button 
                variant="outline" 
                onClick={loadClients}
                className="mx-auto"
              >
                <RefreshCw size={14} className="mr-2" />
                Recarregar
              </Button>
            </div>
          )}
        </ScrollArea>
      </div>
      
      <div className="p-3 bg-white border-t">
        <div className="space-y-3">
          {/* Sync status information */}
          <SyncStatus 
            token={MOCK_TOKEN}
            salesRepId={MOCK_SALES_REP_ID}
            showFullStatus={true}
            onSync={handleSyncComplete}
          />
          
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
    </div>
  );
};

export default ClientsList;
