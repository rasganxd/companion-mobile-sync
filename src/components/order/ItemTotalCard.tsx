
import React from 'react';

interface ItemTotalCardProps {
  quantity: number;
  unitPrice: number;
  selectedUnit: string;
  priceError: string | null;
}

const ItemTotalCard: React.FC<ItemTotalCardProps> = ({
  quantity,
  unitPrice,
  selectedUnit,
  priceError
}) => {
  const formatPrice = (value: number): string => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-green-900">Total do Item:</span>
        <span className={`font-bold ${priceError ? 'text-red-600' : 'text-green-600'}`}>
          R$ {(quantity * unitPrice).toFixed(2).replace('.', ',')}
        </span>
      </div>
      {quantity > 0 && (
        <div className="text-xs text-green-700 mt-1">
          {quantity} {selectedUnit} × {formatPrice(unitPrice)}
        </div>
      )}
    </div>
  );
};

export default ItemTotalCard;
