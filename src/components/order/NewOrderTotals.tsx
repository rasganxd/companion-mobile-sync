import React from 'react';
interface NewOrderTotalsProps {
  total: string;
}
const NewOrderTotals: React.FC<NewOrderTotalsProps> = ({
  total
}) => {
  return <div className="bg-white rounded-lg shadow p-4 py-[8px]">
      <div className="space-y-2">
        <div className="flex justify-between items-center text-lg">
          <span className="font-semibold text-sm">Total Bruto:</span>
          <span className="font-bold text-sm text-green-600">R$ {total}</span>
        </div>
        
      </div>
    </div>;
};
export default NewOrderTotals;