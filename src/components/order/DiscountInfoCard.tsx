
import React from 'react';
import { Info } from 'lucide-react';

interface DiscountInfoCardProps {
  salePrice: number;
  maxDiscountPercent: number;
  currentDiscountPercent: number;
  getMinPriceByDiscount: () => number;
}

const DiscountInfoCard: React.FC<DiscountInfoCardProps> = ({
  salePrice,
  maxDiscountPercent,
  currentDiscountPercent,
  getMinPriceByDiscount
}) => {
  const formatPrice = (value: number): string => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  return (
    <div className="bg-white border border-blue-200 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <Info size={14} className="text-blue-500" />
        <span className="text-sm font-medium text-gray-700">Informações de Desconto</span>
      </div>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">Preço de venda:</span>
          <span className="font-medium">{formatPrice(salePrice)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Desconto máximo:</span>
          <span className="font-medium text-orange-600">{maxDiscountPercent.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Desconto atual:</span>
          <span className={`font-medium ${
            currentDiscountPercent > maxDiscountPercent ? 'text-red-600' : 'text-green-600'
          }`}>
            {currentDiscountPercent.toFixed(1)}%
          </span>
        </div>
        {getMinPriceByDiscount() > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Preço mín. por desconto:</span>
            <span className="font-medium">{formatPrice(getMinPriceByDiscount())}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscountInfoCard;
