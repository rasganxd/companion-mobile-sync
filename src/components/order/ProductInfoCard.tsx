
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

  // Debug logs para verificar valores
  console.log('🔍 ProductInfoCard - Debug dados do produto:', {
    id: product.id,
    name: product.name,
    min_price: product.min_price,
    min_price_type: typeof product.min_price,
    max_discount_percent: product.max_discount_percent,
    sale_price: product.sale_price,
    price: product.price
  });

  const hasMinPrice = product.min_price && product.min_price > 0;
  console.log('🔍 ProductInfoCard - hasMinPrice:', hasMinPrice);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <Package className="text-blue-600 flex-shrink-0" size={18} />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-blue-900 text-sm truncate">{product.name}</h3>
          <p className="text-xs text-blue-700">
            Código: {product.code} • Estoque: {product.stock}
          </p>
        </div>
      </div>
      
      {/* Debug: Sempre mostrar informações de preço mínimo para testes */}
      <div className="p-2 bg-gray-100 border border-gray-300 rounded text-xs text-gray-600 mb-2">
        DEBUG: min_price = {product.min_price || 'undefined'} | max_discount = {product.max_discount_percent || 'undefined'}
      </div>
      
      {hasMinPrice && (
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
          ⚠️ Preço mínimo: {formatPrice(product.min_price)}
        </div>
      )}
    </div>
  );
};

export default ProductInfoCard;
