
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { AspectRatio } from '@/components/ui/aspect-ratio';

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

  const totalVisits = routes.reduce((sum, route) => sum + route.total, 0);
  const totalNegatives = routes.reduce((sum, route) => sum + Math.floor(route.visited * 0.2), 0); // Exemplo: 20% das visitas resultam em vendas negativas

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
        title="Rotas de Visitas" 
        backgroundColor="blue" 
        showBackButton={true} 
      />
      
      <div className="p-3 flex-1 flex flex-col">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="overview" className="flex-1">Visão Geral</TabsTrigger>
            <TabsTrigger value="clients" className="flex-1">Clientes por Dia</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-0">
            {/* Cabeçalho da tabela */}
            <div className="grid grid-cols-4 gap-2 mb-1 font-medium text-center text-sm bg-app-blue text-white p-2 rounded-t-lg shadow-sm">
              <div className="text-left">Dia</div>
              <div>Visitados</div>
              <div>Restantes</div>
              <div>Total</div>
            </div>
            
            {/* Linhas da tabela */}
            <div className="space-y-1">
              {routes.map((route, index) => (
                <div 
                  key={index} 
                  className="grid grid-cols-4 gap-2 py-3 px-3 bg-white rounded-lg font-medium text-center shadow-sm cursor-pointer hover:bg-slate-100 transition-colors border border-slate-100"
                  onClick={() => handleDaySelect(route.day)}
                >
                  <div className="text-left">
                    <span>{route.day}</span>
                  </div>
                  <div className="text-green-600">{route.visited}</div>
                  <div className="text-blue-600">{route.remaining}</div>
                  <div className="text-gray-800">{route.total}</div>
                </div>
              ))}
            </div>
            
            {/* Totais e info em cards */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                <h3 className="text-gray-700 font-medium mb-1">Total de Visitas</h3>
                <div className="text-xl font-bold text-app-blue">{totalVisits}</div>
              </div>
              
              <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                <h3 className="text-gray-700 font-medium mb-1">Vendas Negativas</h3>
                <div className="text-xl font-bold text-red-500">{totalNegatives}</div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="clients" className="mt-0 overflow-hidden">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VisitRoutes;
