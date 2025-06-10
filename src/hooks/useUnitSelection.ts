
import { useState, useMemo, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  sale_price?: number;
  code: number;
  stock: number;
  unit?: string;
  has_subunit?: boolean;
  subunit?: string;
  subunit_ratio?: number;
  min_price?: number;
}

interface UnitOption {
  value: 'main' | 'sub';
  label: string;
  code: string;
  price: number;
  displayText: string;
}

export const useUnitSelection = (product: Product | null) => {
  const [selectedUnitType, setSelectedUnitType] = useState<'main' | 'sub'>('main');

  // Reset to main unit when product changes
  useEffect(() => {
    if (product) {
      setSelectedUnitType('main');
    }
  }, [product?.id]);

  const unitOptions = useMemo((): UnitOption[] => {
    if (!product) return [];

    const options: UnitOption[] = [];
    const basePrice = product.sale_price || product.price || 0;

    // Always add main unit
    const mainUnit = product.unit || 'UN';
    options.push({
      value: 'main',
      label: mainUnit,
      code: mainUnit,
      price: basePrice,
      displayText: mainUnit
    });

    // Add sub unit if available
    if (product.has_subunit && product.subunit && product.subunit_ratio && product.subunit_ratio > 1) {
      const subUnitPrice = basePrice / product.subunit_ratio;
      options.push({
        value: 'sub',
        label: product.subunit,
        code: product.subunit,
        price: subUnitPrice,
        displayText: product.subunit
      });
    }

    return options;
  }, [product]);

  const selectedUnit = useMemo(() => {
    return unitOptions.find(option => option.value === selectedUnitType) || unitOptions[0];
  }, [unitOptions, selectedUnitType]);

  const hasMultipleUnits = unitOptions.length > 1;

  // Function to get current unit price
  const getCurrentPrice = () => {
    return selectedUnit?.price || 0;
  };

  // Function to get current unit code
  const getCurrentUnitCode = () => {
    return selectedUnit?.code || 'UN';
  };

  // ✅ NOVO: Função para mudança de unidade com callback de preço
  const handleUnitTypeChange = (unitType: 'main' | 'sub', onPriceChange?: (price: number) => void) => {
    console.log('🔄 useUnitSelection - Mudando tipo de unidade para:', unitType);
    
    setSelectedUnitType(unitType);
    
    // Encontrar a unidade selecionada e chamar callback imediatamente
    const unit = unitOptions.find(opt => opt.value === unitType);
    if (unit && onPriceChange) {
      console.log('💰 useUnitSelection - Atualizando preço para:', unit.price);
      onPriceChange(unit.price);
    }
  };

  return {
    unitOptions,
    selectedUnit,
    selectedUnitType,
    setSelectedUnitType,
    hasMultipleUnits,
    getCurrentPrice,
    getCurrentUnitCode,
    handleUnitTypeChange // ✅ NOVO: Expor função com callback
  };
};
