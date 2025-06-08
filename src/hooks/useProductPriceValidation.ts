
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  sale_price?: number;
  min_price?: number;
  code: number;
  stock: number;
  unit?: string;
  cost?: number;
  has_subunit?: boolean;
  subunit?: string;
  subunit_ratio?: number;
}

interface PriceValidationResult {
  isValid: boolean;
  error: string | null;
  minPrice: number;
  suggestedPrice: number;
}

export const useProductPriceValidation = (product: Product | null) => {
  const [validationResult, setValidationResult] = useState<PriceValidationResult>({
    isValid: true,
    error: null,
    minPrice: 0,
    suggestedPrice: 0
  });

  const validatePrice = (inputPrice: number): PriceValidationResult => {
    if (!product) {
      return {
        isValid: false,
        error: 'Produto não selecionado',
        minPrice: 0,
        suggestedPrice: 0
      };
    }

    const minPrice = product.min_price || 0;
    const suggestedPrice = product.sale_price || product.price || 0;

    if (inputPrice < minPrice && minPrice > 0) {
      return {
        isValid: false,
        error: `Preço mínimo permitido: R$ ${minPrice.toFixed(2)}`,
        minPrice,
        suggestedPrice
      };
    }

    return {
      isValid: true,
      error: null,
      minPrice,
      suggestedPrice
    };
  };

  const checkPriceAndNotify = (inputPrice: number): boolean => {
    const result = validatePrice(inputPrice);
    setValidationResult(result);

    if (!result.isValid && result.error) {
      toast.error(`❌ ${result.error}`);
      return false;
    }

    return true;
  };

  const getMinPrice = (): number => {
    return product?.min_price || 0;
  };

  const hasMinPriceRestriction = (): boolean => {
    return (product?.min_price || 0) > 0;
  };

  return {
    validatePrice,
    checkPriceAndNotify,
    validationResult,
    getMinPrice,
    hasMinPriceRestriction
  };
};
