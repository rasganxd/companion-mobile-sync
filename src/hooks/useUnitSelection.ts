
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
      label: `${mainUnit} (Principal)`,
      code: mainUnit,
      price: basePrice,
      displayText: `${mainUnit} - R$ ${basePrice.toFixed(2)}`
    });

    // Add sub unit if available
    if (product.has_subunit && product.subunit && product.subunit_ratio && product.subunit_ratio > 1) {
      const subUnitPrice = basePrice / product.subunit_ratio;
      options.push({
        value: 'sub',
        label: `${product.subunit} (Secundária)`,
        code: product.subunit,
        price: subUnitPrice,
        displayText: `${product.subunit} - R$ ${subUnitPrice.toFixed(2)} (${product.subunit_ratio}/${mainUnit})`
      });
    }

    return options;
  }, [product]);

  const selectedUnit = useMemo(() => {
    return unitOptions.find(option => option.value === selectedUnitType) || unitOptions[0];
  }, [unitOptions, selectedUnitType]);

  const hasMultipleUnits = unitOptions.length > 1;

  return {
    unitOptions,
    selectedUnit,
    selectedUnitType,
    setSelectedUnitType,
    hasMultipleUnits
  };
};
