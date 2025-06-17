
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useVisitRoutesData } from '@/hooks/useVisitRoutesData';
import LoadingState from '@/components/visit-routes/LoadingState';
import NoSalesRepState from '@/components/visit-routes/NoSalesRepState';
import DaySummaryCard from '@/components/visit-routes/DaySummaryCard';
import RouteList from '@/components/visit-routes/RouteList';

const VisitRoutes = () => {
  const navigate = useNavigate();
  const { routes, salesData, loading, salesRep } = useVisitRoutesData();

  const handleVisitDay = (day: string) => {
    navigate('/clients-list', {
      state: { day }
    });
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!salesRep) {
    return <NoSalesRepState />;
  }

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
