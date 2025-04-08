
import React from 'react';
import Header from '@/components/Header';
import AppButton from '@/components/AppButton';
import { Calendar, Route, CheckCircle2, ArrowRight } from 'lucide-react';
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const VisitRoutes = () => {
  const { toast } = useToast();
  
  // Dados de exemplo zerados para as rotas - serão preenchidos pelo sistema desktop
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

  // Helper function to get progress percentage
  const getProgressPercentage = (visited: number, total: number) => {
    if (total === 0) return 0;
    return (visited / total) * 100;
  };

  const handleClose = () => {
    toast({
      title: "Fechando rotas",
      description: "Retornando ao menu principal"
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header title="Rotas (Visitas)" backgroundColor="orange" />
      
      <div className="p-4 flex-1">
        <Card className="mb-4 overflow-hidden shadow-sm border border-gray-100">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-3 border-b">
              <div className="grid grid-cols-4 gap-2 font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-orange-500" />
                  <span>Dia</span>
                </div>
                <div className="text-center">Visitados</div>
                <div className="text-center">Restam</div>
                <div className="text-center">Total</div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-100">
              {routes.map((route, index) => (
                <div key={index} className="hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-4 gap-2 p-3">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-800">{route.day}</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 size={16} className="text-gray-300" />
                        <span>{route.visited}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center text-blue-600 font-medium">{route.remaining}</div>
                    <div className="flex items-center justify-center font-medium">{route.total}</div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-1 w-full bg-gray-100">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-green-500" 
                      style={{ width: `${getProgressPercentage(route.visited, route.total)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-4 overflow-hidden shadow-sm border border-gray-100">
          <CardContent className="p-0">
            <div className="p-3 flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center gap-2">
                <Route size={18} className="text-blue-500" />
                <span className="font-medium">Todos</span>
              </div>
              <div className="font-bold text-xl text-blue-700">{totalVisits}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden shadow-sm border border-gray-100">
          <CardContent className="p-0">
            <div className="p-3 flex items-center justify-between bg-gradient-to-r from-red-50 to-red-100">
              <div className="flex items-center gap-2">
                <ArrowRight size={18} className="text-red-500" />
                <span className="font-medium">Negativos</span>
              </div>
              <div className="font-bold text-xl text-red-700">{totalNegatives}</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <AppButton 
          fullWidth
          className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white border-orange-500"
          onClick={handleClose}
        >
          Fechar
        </AppButton>
      </div>
    </div>
  );
};

export default VisitRoutes;
