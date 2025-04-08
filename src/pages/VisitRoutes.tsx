
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import AppButton from '@/components/AppButton';
import { useToast } from "@/hooks/use-toast";

const VisitRoutes = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Dados de exemplo conforme imagem - serão preenchidos pelo sistema desktop
  const routes = [
    { day: 'Segunda', visited: 0, remaining: 30, total: 30 },
    { day: 'Terça', visited: 0, remaining: 24, total: 24 },
    { day: 'Quarta', visited: 0, remaining: 27, total: 27 },
    { day: 'Quinta', visited: 0, remaining: 25, total: 25 },
    { day: 'Sexta', visited: 0, remaining: 21, total: 21 },
    { day: 'Sábado', visited: 0, remaining: 12, total: 12 },
  ];

  const totalVisits = routes.reduce((sum, route) => sum + route.total, 0);
  const totalNegatives = 0;

  const handleClose = () => {
    toast({
      title: "Fechando rotas",
      description: "Retornando ao menu principal"
    });
    navigate('/');
  };

  const handleDaySelect = (day: string) => {
    // Quando seleciona um dia, vai para a tela de clientes
    navigate('/clientes');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header title="Rotas (Visitas)" backgroundColor="orange" />
      
      <div className="p-4 flex-1">
        {/* Cabeçalho da tabela */}
        <div className="grid grid-cols-4 gap-2 mb-2 font-medium text-center bg-white p-3 rounded-t-lg shadow-sm">
          <div className="text-left">Dia</div>
          <div>Visitados</div>
          <div>Restam</div>
          <div>Total</div>
        </div>
        
        {/* Linhas da tabela */}
        <div className="space-y-2">
          {routes.map((route, index) => (
            <div 
              key={index} 
              className="grid grid-cols-4 gap-2 p-3 bg-gray-200 rounded-lg font-medium text-center shadow-sm cursor-pointer hover:bg-gray-300 transition-colors"
              onClick={() => handleDaySelect(route.day)}
            >
              <div className="text-left">{route.day}</div>
              <div>{route.visited}</div>
              <div>{route.remaining}</div>
              <div>{route.total}</div>
            </div>
          ))}
        </div>
        
        {/* Totais */}
        <div className="grid grid-cols-4 gap-2 p-3 bg-gray-200 rounded-lg font-medium text-center mt-2 shadow-sm">
          <div className="text-left">Todos</div>
          <div></div>
          <div></div>
          <div>{totalVisits}</div>
        </div>
        
        {/* Negativos */}
        <div className="grid grid-cols-4 gap-2 p-3 bg-gray-200 rounded-lg font-medium text-center mt-2 shadow-sm">
          <div className="text-left">Info</div>
          <div className="col-span-2 text-left">Negativos</div>
          <div>{totalNegatives}</div>
        </div>
      </div>
      
      <div className="p-4">
        <AppButton 
          fullWidth
          onClick={handleClose}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          Fechar
        </AppButton>
      </div>
    </div>
  );
};

export default VisitRoutes;
