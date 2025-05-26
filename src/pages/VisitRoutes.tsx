
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import AppButton from '@/components/AppButton';
import { Progress } from '@/components/ui/progress';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { toast } from 'sonner';

interface RouteData {
  day: string;
  visited: number;
  remaining: number;
  total: number;
  clients: string[];
}

const VisitRoutes = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadRoutesData = async () => {
      try {
        setLoading(true);
        const db = getDatabaseAdapter();
        await db.initDatabase();
        
        // Get visit routes and clients data
        const visitRoutes = await db.getVisitRoutes();
        const allClients = await db.getClients();
        
        console.log('📊 Loaded visit routes:', visitRoutes);
        console.log('👥 Loaded clients:', allClients);
        
        // Define all days of the week
        const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        
        // Process routes data
        const processedRoutes: RouteData[] = weekDays.map(day => {
          const dayRoute = visitRoutes.find(route => route.day === day);
          
          if (dayRoute && dayRoute.clients && Array.isArray(dayRoute.clients)) {
            const dayClients = dayRoute.clients;
            const total = dayClients.length;
            
            // For now, assume no visits completed (can be enhanced later)
            const visited = 0;
            const remaining = total;
            
            return {
              day,
              visited,
              remaining,
              total,
              clients: dayClients
            };
          }
          
          return {
            day,
            visited: 0,
            remaining: 0,
            total: 0,
            clients: []
          };
        });
        
        setRoutes(processedRoutes);
        console.log('📋 Processed routes:', processedRoutes);
        
      } catch (error) {
        console.error('❌ Error loading routes data:', error);
        toast.error('Erro ao carregar dados das rotas');
        
        // Fallback to empty data
        const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        setRoutes(weekDays.map(day => ({
          day,
          visited: 0,
          remaining: 0,
          total: 0,
          clients: []
        })));
      } finally {
        setLoading(false);
      }
    };
    
    loadRoutesData();
  }, []);

  const totalVisits = routes.reduce((sum, route) => sum + route.total, 0);
  const totalNegatives = 0; // This can be enhanced later with actual negative sales data

  const handleDaySelect = (day: string) => {
    console.log(`🗓️ Selected day: ${day}`);
    navigate('/clientes-lista', { state: { day } });
  };

  const handleGoBack = () => {
    navigate('/home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header 
          title="Rotas de Visitas" 
          backgroundColor="blue" 
          showBackButton={true}
        />
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg text-gray-600">Carregando rotas...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Rotas de Visitas" 
        backgroundColor="blue" 
        showBackButton={true}
      />
      
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
              className={`grid grid-cols-4 gap-2 py-3 px-3 bg-white rounded-lg font-medium text-center shadow-sm border border-slate-100 ${
                route.total > 0 
                  ? 'cursor-pointer hover:bg-slate-100 transition-colors' 
                  : 'opacity-60'
              }`}
              onClick={() => route.total > 0 && handleDaySelect(route.day)}
            >
              <div className="text-left">
                <span>{route.day}</span>
                {route.total > 0 && (
                  <div className="text-xs text-blue-600 mt-0.5">
                    {route.clients.length} cliente{route.clients.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
              <div className="text-green-600">{route.visited}</div>
              <div className="text-blue-600">{route.remaining}</div>
              <div className="text-gray-800 font-bold">{route.total}</div>
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
    </div>
  );
};

export default VisitRoutes;
