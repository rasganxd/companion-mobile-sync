
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

  // Calcular se há restrições de preço (apenas desconto máximo)
  const hasMaxDiscount = product.max_discount_percent && product.max_discount_percent > 0;

  // Calcular preço mínimo baseado no desconto máximo
  const salePrice = product.sale_price || product.price || 0;
  const minPriceByDiscount = hasMaxDiscount 
    ? salePrice * (1 - product.max_discount_percent! / 100)
    : 0;

  console.log('🔍 ProductInfoCard - Dados de restrição de preço:', {
    productName: product.name,
    maxDiscountPercent: product.max_discount_percent,
    salePrice,
    minPriceByDiscount,
    hasMaxDiscount
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
      {hasMaxDiscount && (
        <div className="space-y-2">
          {/* Restrição por desconto máximo */}
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
        </div>
      )}
    </div>
  );
};

export default ProductInfoCard;
