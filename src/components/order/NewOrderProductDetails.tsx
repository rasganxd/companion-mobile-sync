
import React from 'react';
import ProductHeader from './ProductHeader';
import ProductDetails from './ProductDetails';
import QuantityPriceForm from './QuantityPriceForm';
import ItemTotalCard from './ItemTotalCard';
import AddProductButton from './AddProductButton';
import DiscountInfoCard from './DiscountInfoCard';
import { useProductPriceValidation } from '@/hooks/useProductPriceValidation';

interface Product {
  id: string;
  name: string;
  price: number;
  sale_price?: number;
  code: number;
  stock: number;
  unit?: string;
  cost?: number;
  has_subunit?: boolean;
  subunit?: string;
  subunit_ratio?: number;
  max_discount_percent?: number;
}

interface UnitOption {
  value: 'main' | 'sub';
  label: string;
  code: string;
  price: number;
  displayText: string;
}

interface NewOrderProductDetailsProps {
  currentProduct: Product | null;
  quantity: number;
  unitPrice: number;
  selectedUnit: string;
  unitOptions: UnitOption[];
  selectedUnitType: 'main' | 'sub';
  hasMultipleUnits: boolean;
  onQuantityChange: (quantity: number) => void;
  onUnitPriceChange: (price: number) => void;
  onUnitChange: (unit: string) => void;
  onUnitTypeChange: (unitType: 'main' | 'sub') => void;
  onAddProduct: () => void;
}

const NewOrderProductDetails: React.FC<NewOrderProductDetailsProps> = ({
  currentProduct,
  quantity,
  unitPrice,
  selectedUnit,
  unitOptions,
  selectedUnitType,
  hasMultipleUnits,
  onQuantityChange,
  onUnitPriceChange,
  onUnitChange,
  onUnitTypeChange,
  onAddProduct
}) => {
  const {
    priceError,
    hasMinPriceRestriction,
    getMinPrice,
    hasDiscountRestriction
  } = useProductPriceValidation(currentProduct);

  if (!currentProduct) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum produto selecionado
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ProductHeader 
        product={currentProduct}
        currentProductIndex={0}
      />

      <ProductDetails product={currentProduct} />

      <QuantityPriceForm
        currentProduct={currentProduct}
        quantity={quantity}
        unitPrice={unitPrice}
        selectedUnit={selectedUnit}
        unitOptions={unitOptions}
        selectedUnitType={selectedUnitType}
        hasMultipleUnits={hasMultipleUnits}
        priceError={priceError}
        hasMinPriceRestriction={hasMinPriceRestriction}
        getMinPrice={getMinPrice}
        onQuantityChange={onQuantityChange}
        onUnitPriceChange={onUnitPriceChange}
        onUnitChange={onUnitChange}
        onUnitTypeChange={onUnitTypeChange}
      />

      <ItemTotalCard
        quantity={quantity}
        unitPrice={unitPrice}
        selectedUnit={selectedUnit}
        priceError={priceError}
      />

      {hasDiscountRestriction() && (
        <DiscountInfoCard 
          currentPrice={unitPrice}
          maxDiscountPercent={currentProduct.max_discount_percent || 0}
          originalPrice={currentProduct.sale_price || currentProduct.price || 0}
        />
      )}

      <AddProductButton
        quantity={quantity}
        unitPrice={unitPrice}
        priceError={priceError}
        onAddProduct={onAddProduct}
      />
    </div>
  );
};

export default NewOrderProductDetails;
