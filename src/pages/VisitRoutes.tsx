import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

// Example client data structure
interface Client {
  id: string;
  name: string;
  address: string;
  status: 'pending' | 'visited' | 'skipped';
}

const VisitRoutes = () => {
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  
  // Dados de exemplo para rotas
  const routes = [
    { day: 'Segunda', visited: 5, remaining: 7, total: 12 },
    { day: 'Terça', visited: 3, remaining: 9, total: 12 },
    { day: 'Quarta', visited: 0, remaining: 10, total: 10 },
    { day: 'Quinta', visited: 2, remaining: 8, total: 10 },
    { day: 'Sexta', visited: 0, remaining: 15, total: 15 },
    { day: 'Sábado', visited: 0, remaining: 8, total: 8 },
  ];

  // Exemplo de clientes por dia
  const clientsByDay: Record<string, Client[]> = {
    'Segunda': [
      { id: '1', name: 'Supermercado ABC', address: 'Rua das Flores, 123', status: 'visited' },
      { id: '2', name: 'Padaria Bom Pão', address: 'Av. Central, 456', status: 'visited' },
      { id: '3', name: 'Farmácia Popular', address: 'Rua dos Remédios, 789', status: 'pending' },
      { id: '4', name: 'Lanchonete Sabor', address: 'Praça da Alimentação, 101', status: 'pending' },
      { id: '5', name: 'Mercadinho do Zé', address: 'Rua do Comércio, 212', status: 'visited' },
    ],
    'Terça': [
      { id: '6', name: 'Restaurante Casa Nova', address: 'Av. das Nações, 303', status: 'visited' },
      { id: '7', name: 'Açougue Boi Feliz', address: 'Rua da Carne, 404', status: 'visited' },
      { id: '8', name: 'Peixaria Mar Azul', address: 'Av. Beira Mar, 505', status: 'visited' },
      { id: '9', name: 'Loja de Conveniência', address: 'Rua Principal, 606', status: 'pending' },
    ],
    'Quarta': [
      { id: '10', name: 'Supermercado Grande', address: 'Av. das Américas, 707', status: 'pending' },
      { id: '11', name: 'Mini Mercado Bairro', address: 'Rua do Bairro, 808', status: 'pending' },
      { id: '12', name: 'Empório Natureba', address: 'Rua das Plantas, 909', status: 'pending' },
    ],
    'Quinta': [
      { id: '13', name: 'Distribuidora de Bebidas', address: 'Rua da Sede, 1010', status: 'visited' },
      { id: '14', name: 'Pizzaria Don Pizza', address: 'Av. da Pizza, 1111', status: 'pending' },
      { id: '15', name: 'Sorveteria Gelada', address: 'Alameda Doce, 1212', status: 'pending' },
    ],
    'Sexta': [
      { id: '16', name: 'Bar do Zeca', address: 'Travessa da Cerveja, 1313', status: 'pending' },
      { id: '17', name: 'Cafeteria Aroma', address: 'Rua do Café, 1414', status: 'pending' },
      { id: '18', name: 'Doceria Gostosuras', address: 'Av. dos Doces, 1515', status: 'pending' },
    ],
    'Sábado': [
      { id: '19', name: 'Mercado Fim de Semana', address: 'Rua do Sábado, 1616', status: 'pending' },
      { id: '20', name: 'Padaria Pão Quente', address: 'Av. do Forno, 1717', status: 'pending' },
    ]
  };

  const handleDaySelect = (day: string) => {
    setSelectedDay(day);
  };
  
  const handleClientSelect = (clientId: string) => {
    navigate('/clientes', { state: { clientId } });
    toast({
      title: "Cliente selecionado",
      description: "Abrindo detalhes do cliente " + clientId
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Clientes por Dia" 
        backgroundColor="blue" 
        showBackButton={true} 
      />
      
      <div className="p-3 flex-1 flex flex-col">
        <div className="mb-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
            <h3 className="font-medium text-lg mb-2">Selecione um dia</h3>
            <div className="grid grid-cols-3 gap-2">
              {routes.map((route, index) => (
                <Button 
                  key={index}
                  variant={selectedDay === route.day ? "default" : "outline"}
                  onClick={() => handleDaySelect(route.day)}
                  className="justify-start"
                >
                  {route.day}
                  <span className="ml-auto bg-blue-100 text-blue-800 px-2 rounded-full text-xs">
                    {route.total}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        {selectedDay ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-3 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
              <h3 className="font-medium">Clientes de {selectedDay}</h3>
              <div className="text-sm text-blue-700">
                {clientsByDay[selectedDay]?.length || 0} clientes
              </div>
            </div>
            
            <ScrollArea className="h-[calc(100vh-350px)]">
              {clientsByDay[selectedDay] && clientsByDay[selectedDay].length > 0 ? (
                <div className="divide-y">
                  {clientsByDay[selectedDay].map((client) => (
                    <div 
                      key={client.id}
                      onClick={() => handleClientSelect(client.id)}
                      className="p-3 hover:bg-slate-50 cursor-pointer"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <User size={20} className="text-blue-700" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{client.name}</h4>
                          <p className="text-sm text-gray-500">{client.address}</p>
                        </div>
                        <div>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            client.status === 'visited' 
                              ? 'bg-green-100 text-green-800' 
                              : client.status === 'skipped'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}>
                            {client.status === 'visited' 
                              ? 'Visitado' 
                              : client.status === 'skipped'
                                ? 'Pulado'
                                : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  Nenhum cliente registrado para {selectedDay}.
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-8 text-center shadow-sm border border-slate-100">
            <p className="text-gray-500">Selecione um dia para ver os clientes</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitRoutes;
