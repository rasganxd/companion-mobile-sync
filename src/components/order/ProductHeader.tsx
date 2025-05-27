
import React from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  code?: number;
  stock: number;
  unit?: string;
  cost?: number;
}

interface ProductHeaderProps {
  product: Product;
  currentProductIndex: number;
}

const ProductHeader: React.FC<ProductHeaderProps> = ({
  product,
  currentProductIndex
}) => {
  return (
    <div className="bg-gray-100 border border-gray-200 p-1 rounded-lg mb-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-gray-500 h-4 w-4 flex items-center justify-center mr-1.5 text-white rounded-full text-xs">
            <span className="font-bold">{currentProductIndex + 1}</span>
          </div>
          <div className="flex-1">
            <div className="font-medium text-xs text-gray-800 truncate max-w-[200px]">
              {product?.name || 'Nenhum produto'}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-gray-800">
            R$ {product?.price.toFixed(2) || '0,00'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductHeader;
