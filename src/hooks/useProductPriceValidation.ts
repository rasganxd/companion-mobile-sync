
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  sale_price?: number;
  max_discount_percent?: number;
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
  maxDiscountPercent: number;
  currentDiscountPercent: number;
  minPriceByDiscount: number;
  isDiscountExceeded: boolean;
}

export const useProductPriceValidation = (product: Product | null) => {
  const [validationResult, setValidationResult] = useState<PriceValidationResult>({
    isValid: true,
    error: null,
    minPrice: 0,
    suggestedPrice: 0,
    maxDiscountPercent: 0,
    currentDiscountPercent: 0,
    minPriceByDiscount: 0,
    isDiscountExceeded: false
  });

  const calculateDiscountInfo = (inputPrice: number) => {
    if (!product) return { currentDiscount: 0, isExceeded: false };
    
    const salePrice = product.sale_price || product.price || 0;
    const maxDiscount = product.max_discount_percent || 0;
    
    if (salePrice <= 0) return { currentDiscount: 0, isExceeded: false };
    
    const currentDiscount = ((salePrice - inputPrice) / salePrice) * 100;
    const isExceeded = maxDiscount > 0 && currentDiscount > maxDiscount;
    
    return { currentDiscount: Math.max(0, currentDiscount), isExceeded };
  };

  const validatePrice = (inputPrice: number): PriceValidationResult => {
    if (!product) {
      return {
        isValid: false,
        error: 'Produto não selecionado',
        minPrice: 0,
        suggestedPrice: 0,
        maxDiscountPercent: 0,
        currentDiscountPercent: 0,
        minPriceByDiscount: 0,
        isDiscountExceeded: false
      };
    }

    const salePrice = product.sale_price || product.price || 0;
    const maxDiscountPercent = product.max_discount_percent || 0;
    
    console.log('🔍 Validando preço - APENAS max_discount_percent:', {
      productName: product.name,
      inputPrice,
      salePrice,
      maxDiscountPercent
    });
    
    // Calcular preço mínimo baseado APENAS no desconto máximo
    const minPriceByDiscount = maxDiscountPercent > 0 
      ? salePrice * (1 - maxDiscountPercent / 100) 
      : 0;
    
    console.log('🔍 Cálculos de validação:', {
      minPriceByDiscount,
      hasDiscountRestriction: maxDiscountPercent > 0
    });
    
    // Calcular informações de desconto
    const { currentDiscount, isExceeded } = calculateDiscountInfo(inputPrice);

    // Validação APENAS por desconto máximo
    if (maxDiscountPercent > 0 && currentDiscount > maxDiscountPercent) {
      return {
        isValid: false,
        error: `Desconto máximo permitido: ${maxDiscountPercent.toFixed(1)}%`,
        minPrice: minPriceByDiscount,
        suggestedPrice: minPriceByDiscount,
        maxDiscountPercent,
        currentDiscountPercent: currentDiscount,
        minPriceByDiscount,
        isDiscountExceeded: true
      };
    }

    return {
      isValid: true,
      error: null,
      minPrice: minPriceByDiscount,
      suggestedPrice: salePrice,
      maxDiscountPercent,
      currentDiscountPercent: currentDiscount,
      minPriceByDiscount,
      isDiscountExceeded: false
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
    if (!product) return 0;
    const maxDiscountPercent = product.max_discount_percent || 0;
    const salePrice = product.sale_price || product.price || 0;
    
    const result = maxDiscountPercent > 0 
      ? salePrice * (1 - maxDiscountPercent / 100) 
      : 0;
    
    console.log('🔍 getMinPrice - APENAS max_discount_percent:', {
      productName: product.name,
      maxDiscountPercent,
      salePrice,
      calculatedMinPrice: result
    });
    
    return result;
  };

  const hasMinPriceRestriction = (): boolean => {
    if (!product) return false;
    
    // Considerar que há restrição APENAS se há max_discount_percent > 0
    const hasMaxDiscount = (product.max_discount_percent || 0) > 0;
    
    console.log('🔍 Verificando restrições de preço - APENAS max_discount_percent:', {
      productName: product.name,
      maxDiscountPercent: product.max_discount_percent,
      hasMaxDiscount,
      hasAnyRestriction: hasMaxDiscount
    });
    
    return hasMaxDiscount;
  };

  const getMaxDiscountPercent = (): number => {
    return product?.max_discount_percent || 0;
  };

  const hasDiscountRestriction = (): boolean => {
    return getMaxDiscountPercent() > 0;
  };

  const getCurrentDiscountPercent = (inputPrice: number): number => {
    return calculateDiscountInfo(inputPrice).currentDiscount;
  };

  const getMinPriceByDiscount = (): number => {
    if (!product || !hasDiscountRestriction()) return 0;
    const salePrice = product.sale_price || product.price || 0;
    const maxDiscount = product.max_discount_percent || 0;
    return salePrice * (1 - maxDiscount / 100);
  };

  return {
    validatePrice,
    checkPriceAndNotify,
    validationResult,
    getMinPrice,
    hasMinPriceRestriction,
    getMaxDiscountPercent,
    hasDiscountRestriction,
    getCurrentDiscountPercent,
    getMinPriceByDiscount
  };
};
