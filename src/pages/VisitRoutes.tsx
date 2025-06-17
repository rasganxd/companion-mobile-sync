
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useVisitRoutesData } from '@/hooks/useVisitRoutesData';
import LoadingState from '@/components/visit-routes/LoadingState';
import NoSalesRepState from '@/components/visit-routes/NoSalesRepState';
import DaySummaryCard from '@/components/visit-routes/DaySummaryCard';
import RouteList from '@/components/visit-routes/RouteList';

const VisitRoutes = () => {
  console.log('🧭 VisitRoutes component - RENDER START');
  
  const navigate = useNavigate();
  const { routes, salesData, loading, salesRep } = useVisitRoutesData();

  console.log('🧭 VisitRoutes state:', {
    loading,
    salesRep: salesRep ? `${salesRep.name} (${salesRep.id})` : 'null',
    routesCount: routes.length
  });

  const handleVisitDay = (day: string) => {
    console.log('🧭 VisitRoutes.handleVisitDay:', day);
    navigate('/clients-list', {
      state: { day }
    });
  };

  if (loading) {
    console.log('🧭 VisitRoutes - showing loading state');
    return <LoadingState />;
  }

  if (!salesRep) {
    console.log('🧭 VisitRoutes - no sales rep, showing no sales rep state');
    return <NoSalesRepState />;
  }

  console.log('🧭 VisitRoutes - rendering main content');
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="Rotas de Visita" showBackButton backgroundColor="blue" />
      <div className="p-2 flex-1">
        <DaySummaryCard salesData={salesData} />
        <RouteList routes={routes} onVisitDay={handleVisitDay} />
      </div>
    </div>
  );
};

export default VisitRoutes;
