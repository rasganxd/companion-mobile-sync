
import React from 'react';
import { RouteData } from '@/types/visit-routes';
import RouteCard from './RouteCard';

interface RouteListProps {
  routes: RouteData[];
  onVisitDay: (day: string) => void;
}

const RouteList: React.FC<RouteListProps> = ({ routes, onVisitDay }) => {
  return (
    <div>
      <h2 className="text-base font-semibold mb-1 text-gray-700">Rotas da Semana</h2>
      {routes.map(route => (
        <RouteCard key={route.day} route={route} onVisitDay={onVisitDay} />
      ))}
    </div>
  );
};

export default RouteList;
