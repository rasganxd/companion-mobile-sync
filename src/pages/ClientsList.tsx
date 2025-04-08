
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, Building2, MapPin } from 'lucide-react';
import Header from '@/components/Header';
import AppButton from '@/components/AppButton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';

const ClientsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { day } = location.state || { day: 'Segunda' };
  
  // Dados de exemplo para clientes daquele dia da semana
  const clients = [
    { 
      id: '179',
      name: 'GILMAR ELIAS TAZONIERO',
      fantasyName: 'CANCHA DE BOCHA DO PILA',
      address: 'RUA MARECHAL DEODORO 2325',
      city: 'CHAPECO',
      status: 'Pendente'
    },
    { 
      id: '243',
      name: 'MARIA APARECIDA SANTOS',
      fantasyName: 'MERCADO BOA COMPRA',
      address: 'AV FERNANDO MACHADO 1500',
      city: 'CHAPECO',
      status: 'Visitado'
    },
    { 
      id: '301',
      name: 'JOÃO CARLOS DA SILVA',
      fantasyName: 'PADARIA PÃO QUENTE',
      address: 'RUA NEREU RAMOS 789',
      city: 'CHAPECO',
      status: 'Pendente'
    },
    { 
      id: '422',
      name: 'ANTÔNIO FERREIRA',
      fantasyName: 'MINI MERCADO DO BAIRRO',
      address: 'RUA GUAPORÉ 456',
      city: 'CHAPECO',
      status: 'Pendente'
    }
  ];
  
  const handleClientSelect = (clientId: string) => {
    navigate('/clientes');
  };
  
  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title={`Clientes de ${day}`} showBackButton backgroundColor="blue" />
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {clients.map((client) => (
            <Card 
              key={client.id}
              className="overflow-hidden cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => handleClientSelect(client.id)}
            >
              <div className="bg-gradient-to-r from-app-blue to-app-blue-dark p-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="bg-white text-app-blue p-1 rounded-lg font-bold text-sm">
                    {client.id}
                  </div>
                  <span className="text-white text-sm">{client.status}</span>
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
                
                <div className="flex items-start gap-2">
                  <Building2 size={16} className="text-app-blue mt-1" />
                  <div>
                    <div className="text-xs text-gray-500">Fantasia:</div>
                    <div className="font-medium text-sm">{client.fantasyName}</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-app-blue mt-1" />
                  <div>
                    <div className="text-xs text-gray-500">Endereço:</div>
                    <div className="text-sm text-app-blue">{client.address}</div>
                    <div className="text-sm">{client.city}</div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
      
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
