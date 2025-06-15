
import React from 'react';
import { CalendarDays, DollarSign } from 'lucide-react';
import { RouteData } from '@/types/visit-routes';

interface RouteCardProps {
  route: RouteData;
  onVisitDay: (day: string) => void;
}

const RouteCard: React.FC<RouteCardProps> = ({ route, onVisitDay }) => {
  return (
    <div
      key={route.day}
      onClick={() => onVisitDay(route.day)}
      className="bg-white rounded-lg shadow-sm p-2 mb-1.5 cursor-pointer hover:bg-gray-50 active:scale-[0.98] transition-all duration-200"
    >
      <div className="flex items-center mb-1">
        <CalendarDays className="h-4 w-4 text-gray-500 mr-2" />
        <h3 className="font-bold text-base text-gray-800">{route.day}</h3>
        <span className="text-xs text-gray-500 ml-auto">({route.total} clientes)</span>
      </div>
      <div className="grid grid-cols-3 gap-x-2 text-xs py-1">
        <div className="flex items-center justify-center flex-col text-blue-600">
          <span className="font-bold text-sm">{route.pendentes}</span>
          <span className="font-medium text-gray-500 text-[10px]">Pendentes</span>
        </div>
        <div className="flex items-center justify-center flex-col text-green-600">
          <span className="font-bold text-sm">{route.positivados}</span>
          <span className="font-medium text-gray-500 text-[10px]">Positivados</span>
        </div>
        <div className="flex items-center justify-center flex-col text-red-600">
          <span className="font-bold text-sm">{route.negativados}</span>
          <span className="font-medium text-gray-500 text-[10px]">Negativados</span>
        </div>
      </div>
      {route.totalSales > 0 && (
        <div className="flex items-center border-t mt-1 pt-1">
          <DollarSign className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
          <span className="text-xs font-medium text-gray-600">Valor Positivado</span>
          <span className="font-bold text-base text-green-700 ml-auto">
            R$ {route.totalSales.toFixed(0)}
          </span>
        </div>
      )}
    </div>
  );
};

export default RouteCard;
