
import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { SalesData } from '@/types/visit-routes';

interface DaySummaryCardProps {
  salesData: SalesData;
}

const DaySummaryCard: React.FC<DaySummaryCardProps> = ({ salesData }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-2 mb-2">
      <h2 className="text-base font-semibold mb-1 text-gray-800">Resumo do Dia</h2>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center flex flex-col justify-center">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <div className="text-lg font-bold text-green-700">{salesData.totalPositivados}</div>
          </div>
          <div className="text-xs font-medium text-green-600">Positivados</div>
          <div className="text-xs font-semibold text-green-700">R$ {salesData.positivadosValue.toFixed(0)}</div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center flex flex-col justify-center">
          <div className="flex items-center justify-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <div className="text-lg font-bold text-red-600">{salesData.totalNegativados}</div>
          </div>
          <div className="text-xs font-medium text-red-500">Negativados</div>
        </div>
      </div>
    </div>
  );
};

export default DaySummaryCard;
