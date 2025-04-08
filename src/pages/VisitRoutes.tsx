
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import AppButton from '@/components/AppButton';
import { ArrowLeft, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const VisitRoutes = () => {
  const navigate = useNavigate();
  
  // Dados de exemplo zerados conforme solicitado
  const routes = [
    { day: 'Segunda', visited: 0, remaining: 0, total: 0 },
    { day: 'Terça', visited: 0, remaining: 0, total: 0 },
    { day: 'Quarta', visited: 0, remaining: 0, total: 0 },
    { day: 'Quinta', visited: 0, remaining: 0, total: 0 },
    { day: 'Sexta', visited: 0, remaining: 0, total: 0 },
    { day: 'Sábado', visited: 0, remaining: 0, total: 0 },
  ];

  const totalVisits = routes.reduce((sum, route) => sum + route.total, 0);
  const totalNegatives = 0;

  const handleClose = () => {
    navigate('/menu');
  };

  const handleDaySelect = (day: string) => {
    navigate('/clientes-lista', { state: { day } });
  };
  
  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="Rotas de Visitas" backgroundColor="blue" />
      
      <div className="p-3 flex-1">
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
      </div>
      
      <div className="p-3 bg-white border-t space-y-2">
        <button 
          onClick={handleClose}
          className="w-full py-3 bg-app-blue text-white rounded-lg flex items-center justify-center gap-2"
        >
          <X size={18} />
          <span>Fechar</span>
        </button>
        
        <AppButton 
          fullWidth
          onClick={handleGoBack}
          variant="gray"
          className="flex justify-center items-center gap-2"
        >
          <ArrowLeft size={18} />
          <span>Voltar</span>
        </AppButton>
      </div>
    </div>
  );
};

export default VisitRoutes;
