
import React from 'react';
import { Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  code: number;
  stock: number;
  unit?: string;
  has_subunit?: boolean;
  subunit?: string;
  subunit_ratio?: number;
  min_price?: number;
  sale_price?: number;
  max_discount_percent?: number;
}

interface ProductInfoCardProps {
  product: Product;
}

const ProductInfoCard: React.FC<ProductInfoCardProps> = ({ product }) => {
  const formatPrice = (value: number): string => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-2">
        <Package className="text-blue-600" size={20} />
        <div>
          <h3 className="font-semibold text-blue-900">{product.name}</h3>
          <p className="text-sm text-blue-700">
            Código: {product.code} • Estoque: {product.stock}
          </p>
        </div>
      </div>
      
      {product.min_price && product.min_price > 0 && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-xs text-yellow-700">
            ⚠️ Preço mínimo: {formatPrice(product.min_price)}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductInfoCard;
