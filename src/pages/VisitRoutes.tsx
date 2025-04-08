
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import AppButton from '@/components/AppButton';
import { useToast } from "@/hooks/use-toast";
import { Calendar, ArrowLeft, X } from 'lucide-react';
import { Card } from '@/components/ui/card';

const VisitRoutes = () => {
  const { toast } = useToast();
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

  // No clients for all days - empty state
  const hasClients = routes.some(route => route.total > 0);

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
  
  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="Rotas de Visitas" backgroundColor="blue" />
      
      <div className="p-4 flex-1">
        {/* Cartão de programação de visitas - seguindo o design da imagem */}
        <Card className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center">
            <Calendar className="text-app-blue mr-3" size={24} />
            <div>
              <h2 className="font-medium text-gray-800">Programação de Visitas</h2>
              <p className="text-sm text-gray-500">Selecione um dia para ver os clientes</p>
            </div>
          </div>
        </Card>
        
        {hasClients ? (
          // Se tiver clientes, mostra a tabela
          <>
            {/* Cabeçalho da tabela */}
            <div className="grid grid-cols-4 gap-2 mb-2 font-medium text-center text-sm bg-app-blue text-white p-3 rounded-t-lg shadow-sm">
              <div className="text-left">Dia</div>
              <div>Visitados</div>
              <div>Restantes</div>
              <div>Total</div>
            </div>
            
            {/* Linhas da tabela */}
            <div className="space-y-2">
              {routes.map((route, index) => (
                <div 
                  key={index} 
                  className="grid grid-cols-4 gap-2 p-4 bg-white rounded-lg font-medium text-center shadow-sm cursor-pointer hover:bg-slate-100 transition-colors border border-slate-100"
                  onClick={() => handleDaySelect(route.day)}
                >
                  <div className="text-left">{route.day}</div>
                  <div className="text-green-600">{route.visited}</div>
                  <div className="text-blue-600">{route.remaining}</div>
                  <div className="text-gray-800">{route.total}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          // Estado vazio - sem clientes
          <div className="flex flex-col items-center justify-center mt-8 text-center p-6">
            <div className="text-gray-400 mb-4">
              <Calendar size={48} />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">Sem clientes cadastrados</h3>
            <p className="text-sm text-gray-500">
              Não há clientes cadastrados para visitas. Quando houver, eles aparecerão aqui.
            </p>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-white border-t space-y-3">
        <AppButton 
          fullWidth
          onClick={handleClose}
          variant="blue"
          className="flex justify-center items-center gap-2"
        >
          <X size={18} />
          <span>Fechar</span>
        </AppButton>
        
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

export default VisitRoutes;
