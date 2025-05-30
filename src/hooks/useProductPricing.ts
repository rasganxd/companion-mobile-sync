
import { useMemo } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  code?: number;
  stock: number;
  unit?: string;
  cost?: number;
  has_subunit?: boolean;
  subunit?: string;
  subunit_ratio?: number;
  min_price?: number;
  max_price?: number;
}

export const useProductPricing = (product: Product, selectedUnit?: 'main' | 'sub') => {
  const pricing = useMemo(() => {
    if (!product) {
      return {
        unitPrice: 0,
        displayUnit: 'UN',
        mainUnit: 'UN',
        subUnit: null,
        ratio: 1,
        pricePerMainUnit: 0
      };
    }

    // Se o produto tem subunidade
    if (product.has_subunit && product.subunit_ratio && product.subunit_ratio > 1 && product.subunit) {
      const pricePerSubUnit = product.price / product.subunit_ratio;
      
      // Se a unidade selecionada é a principal (main)
      if (selectedUnit === 'main') {
        return {
          unitPrice: product.price, // Preço da unidade principal
          displayUnit: product.unit || 'CX', // Unidade principal
          mainUnit: product.unit || 'CX', // Unidade principal
          subUnit: product.subunit, // Unidade menor
          ratio: product.subunit_ratio, // Ratio
          pricePerMainUnit: product.price // Preço da unidade principal
        };
      } else {
        // Default para subunidade (sub)
        return {
          unitPrice: pricePerSubUnit, // Preço por unidade menor
          displayUnit: product.subunit, // Unidade menor
          mainUnit: product.unit || 'CX', // Unidade principal
          subUnit: product.subunit, // Unidade menor
          ratio: product.subunit_ratio, // Ratio
          pricePerMainUnit: product.price // Preço da unidade principal
        };
      }
    }

    // Se o produto não tem subunidade
    return {
      unitPrice: product.price,
      displayUnit: product.unit || 'UN',
      mainUnit: product.unit || 'UN',
      subUnit: null,
      ratio: 1,
      pricePerMainUnit: product.price
    };
  }, [product, selectedUnit]);

  return pricing;
};
