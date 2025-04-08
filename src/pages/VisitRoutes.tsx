
import React from 'react';
import Header from '@/components/Header';
import AppButton from '@/components/AppButton';

const VisitRoutes = () => {
  // Dados de exemplo para as rotas
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header title="Rotas (Visitas)" backgroundColor="orange" />
      
      <div className="p-4 flex-1">
        <div className="grid grid-cols-4 gap-2 font-medium mb-4">
          <div></div>
          <div className="text-center">Visitados</div>
          <div className="text-center">Restam</div>
          <div className="text-center">Total</div>
        </div>
        
        {routes.map((route, index) => (
          <div key={index} className="grid grid-cols-4 gap-2 mb-4">
            <AppButton>{route.day}</AppButton>
            <div className="flex items-center justify-center">{route.visited}</div>
            <div className="flex items-center justify-center">{route.remaining}</div>
            <div className="flex items-center justify-center">{route.total}</div>
          </div>
        ))}
        
        <div className="grid grid-cols-4 gap-2 mb-4">
          <AppButton>Todos</AppButton>
          <div className="col-span-3 flex items-center justify-end font-medium">
            {totalVisits}
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-2 mb-4">
          <AppButton>Info</AppButton>
          <div className="col-span-2 flex items-center font-bold">
            Negativos
          </div>
          <div className="flex items-center justify-center">
            {totalNegatives}
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <AppButton fullWidth>Fechar</AppButton>
      </div>
    </div>
  );
};

export default VisitRoutes;
