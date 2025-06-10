
import React from 'react';
import { Info, AlertTriangle } from 'lucide-react';

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

  const isDiscountExceeded = maxDiscountPercent > 0 && currentDiscountPercent > maxDiscountPercent;

  return (
    <div className="bg-white border border-blue-200 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <Info size={16} className="text-blue-500" />
        <span className="text-sm font-medium text-gray-700">Informações de Desconto</span>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">Preço de referência:</span>
          <span className="font-medium">{formatPrice(salePrice)}</span>
        </div>
        
        {maxDiscountPercent > 0 && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-600">Desconto máximo:</span>
              <span className="font-medium text-orange-600">{maxDiscountPercent.toFixed(1)}%</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Desconto atual:</span>
              <span className={`font-medium ${isDiscountExceeded ? 'text-red-600' : 'text-green-600'}`}>
                {currentDiscountPercent.toFixed(1)}%
              </span>
            </div>
            
            {getMinPriceByDiscount() > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Preço mín. por desconto:</span>
                <span className="font-medium">{formatPrice(getMinPriceByDiscount())}</span>
              </div>
            )}
            
            {isDiscountExceeded && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 mt-1">
                <div className="flex items-center gap-1">
                  <AlertTriangle size={12} />
                  <span>O desconto excede o limite máximo permitido!</span>
                </div>
                <div className="mt-1 text-red-600">
                  O desconto é calculado baseado na unidade principal do produto.
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DiscountInfoCard;
