
import React from 'react';
import { Package, AlertTriangle, Info } from 'lucide-react';

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

  // Calcular se há restrições de preço
  const hasMinPrice = product.min_price && product.min_price > 0;
  const hasMaxDiscount = product.max_discount_percent && product.max_discount_percent > 0;
  const hasAnyRestriction = hasMinPrice || hasMaxDiscount;

  // Calcular preço mínimo baseado no desconto máximo
  const salePrice = product.sale_price || product.price || 0;
  const minPriceByDiscount = hasMaxDiscount 
    ? salePrice * (1 - product.max_discount_percent! / 100)
    : 0;
  
  // Usar o maior entre min_price e preço calculado por desconto
  const effectiveMinPrice = Math.max(product.min_price || 0, minPriceByDiscount);

  console.log('🔍 ProductInfoCard - Dados de restrição de preço:', {
    productName: product.name,
    minPrice: product.min_price,
    maxDiscountPercent: product.max_discount_percent,
    salePrice,
    minPriceByDiscount,
    effectiveMinPrice,
    hasAnyRestriction
  });

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
      
      {/* Exibir informações de restrição de preço */}
      {hasAnyRestriction && (
        <div className="space-y-2">
          {/* Preço mínimo direto */}
          {hasMinPrice && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <div className="flex items-center gap-1 text-yellow-700">
                <AlertTriangle size={12} />
                <span className="font-medium">Preço mínimo: {formatPrice(product.min_price!)}</span>
              </div>
            </div>
          )}
          
          {/* Restrição por desconto máximo */}
          {hasMaxDiscount && (
            <div className="p-2 bg-orange-50 border border-orange-200 rounded text-xs">
              <div className="flex items-center gap-1 text-orange-700">
                <Info size={12} />
                <span className="font-medium">
                  Desconto máximo: {product.max_discount_percent!.toFixed(1)}%
                </span>
              </div>
              <div className="text-orange-600 mt-1">
                Preço mín. por desconto: {formatPrice(minPriceByDiscount)}
              </div>
            </div>
          )}
          
          {/* Preço mínimo efetivo (se há ambas as restrições) */}
          {effectiveMinPrice > 0 && hasMinPrice && hasMaxDiscount && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
              <div className="flex items-center gap-1 text-red-700">
                <AlertTriangle size={12} />
                <span className="font-medium">
                  Preço mínimo efetivo: {formatPrice(effectiveMinPrice)}
                </span>
              </div>
              <div className="text-red-600 mt-1">
                (maior entre preço mínimo e desconto máximo)
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductInfoCard;
