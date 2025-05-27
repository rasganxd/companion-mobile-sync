
import React from 'react';
import { Label } from '@/components/ui/label';

interface Product {
  id: string;
  name: string;
  price: number;
  code?: number;
  stock: number;
  unit?: string;
  cost?: number;
}

interface ProductDetailsProps {
  product: Product;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product }) => {
  return (
    <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-800">
        <div>
          <span className="text-gray-600 font-medium">P. unit:</span>
          <span className="ml-1">{(product.cost || 0).toFixed(2)}</span>
        </div>
        <div>
          <span className="text-gray-600 font-medium">Estq:</span>
          <span className="ml-1">{product.stock || 0}</span>
        </div>
        <div>
          <span className="text-gray-600 font-medium">Código:</span>
          <span className="ml-1">{product.code || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
