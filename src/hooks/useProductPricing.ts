
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
}

export const useProductPricing = (product: Product) => {
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

    // Se o produto tem subunidade (ex: Caixa com 23 UN)
    if (product.has_subunit && product.subunit_ratio && product.subunit_ratio > 1) {
      const unitPrice = product.price / product.subunit_ratio;
      
      return {
        unitPrice, // Preço por unidade menor (R$ 3,00)
        displayUnit: product.subunit || 'UN', // Unidade menor (UN)
        mainUnit: product.unit || 'CX', // Unidade principal (CX)
        subUnit: product.subunit || 'UN', // Unidade menor (UN)
        ratio: product.subunit_ratio, // Quantas unidades menores cabem na principal (23)
        pricePerMainUnit: product.price // Preço da unidade principal (R$ 69,00)
      };
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
  }, [product]);

  return pricing;
};
