
import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { useUnitSelection } from '@/hooks/useUnitSelection';
import { useProductPriceValidation } from '@/hooks/useProductPriceValidation';
import ProductInfoCard from './ProductInfoCard';
import QuantityPriceForm from './QuantityPriceForm';
import DiscountInfoCard from './DiscountInfoCard';
import ItemTotalCard from './ItemTotalCard';
import AddProductButton from './AddProductButton';

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

interface NewOrderProductDetailsProps {
  currentProduct: Product | null;
  quantity: number;
  unitPrice: number;
  selectedUnit?: string;
  onQuantityChange: (quantity: number) => void;
  onUnitPriceChange: (price: number) => void;
  onUnitChange?: (unit: string) => void;
  onAddProduct: () => void;
}

const NewOrderProductDetails: React.FC<NewOrderProductDetailsProps> = ({
  currentProduct,
  quantity,
  unitPrice,
  selectedUnit = 'UN',
  onQuantityChange,
  onUnitPriceChange,
  onUnitChange,
  onAddProduct
}) => {
  const { unitOptions, selectedUnitType, setSelectedUnitType, hasMultipleUnits } = useUnitSelection(currentProduct);
  const { 
    validatePrice, 
    hasMinPriceRestriction, 
    getMinPrice,
    hasDiscountRestriction,
    getMaxDiscountPercent,
    getCurrentDiscountPercent,
    getMinPriceByDiscount
  } = useProductPriceValidation(currentProduct);
  
  const [priceError, setPriceError] = useState<string | null>(null);

  // Validar preço sempre que mudar
  useEffect(() => {
    const result = validatePrice(unitPrice);
    setPriceError(result.error);
  }, [unitPrice, validatePrice]);

  if (!currentProduct) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <p className="text-gray-500">Nenhum produto selecionado</p>
      </div>
    );
  }

  const handleUnitTypeChange = (unitType: 'main' | 'sub') => {
    setSelectedUnitType(unitType);
    const unit = unitOptions.find(opt => opt.value === unitType);
    if (unit && onUnitChange) {
      onUnitChange(unit.code);
      onUnitPriceChange(unit.price);
    }
  };

  const currentDiscountPercent = getCurrentDiscountPercent(unitPrice);
  const maxDiscountPercent = getMaxDiscountPercent();
  const salePrice = currentProduct.sale_price || currentProduct.price || 0;

  // Debug logs para verificar valores
  console.log('🔍 NewOrderProductDetails - hasDiscountRestriction():', hasDiscountRestriction());
  console.log('🔍 NewOrderProductDetails - hasMinPriceRestriction():', hasMinPriceRestriction());

  return (
    <div className="space-y-4">
      <ProductInfoCard product={currentProduct} />

      <QuantityPriceForm
        currentProduct={currentProduct}
        quantity={quantity}
        unitPrice={unitPrice}
        selectedUnit={selectedUnit}
        unitOptions={unitOptions}
        selectedUnitType={selectedUnitType}
        hasMultipleUnits={hasMultipleUnits}
        priceError={priceError}
        hasMinPriceRestriction={hasMinPriceRestriction() === true}
        getMinPrice={getMinPrice}
        onQuantityChange={onQuantityChange}
        onUnitPriceChange={onUnitPriceChange}
        onUnitChange={onUnitChange}
        onUnitTypeChange={handleUnitTypeChange}
      />

      {hasDiscountRestriction() === true && (
        <DiscountInfoCard
          salePrice={salePrice}
          maxDiscountPercent={maxDiscountPercent}
          currentDiscountPercent={currentDiscountPercent}
          getMinPriceByDiscount={getMinPriceByDiscount}
        />
      )}

      <ItemTotalCard
        quantity={quantity}
        unitPrice={unitPrice}
        selectedUnit={selectedUnit}
        priceError={priceError}
      />

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
