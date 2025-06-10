
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  sale_price?: number;
  min_price?: number;
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
    const minPriceExisting = product.min_price || 0;
    const maxDiscountPercent = product.max_discount_percent || 0;
    
    // Debug detalhado
    console.log('🔍 validatePrice - Debug detalhado:', {
      productId: product.id,
      productName: product.name,
      inputPrice,
      salePrice,
      minPriceExisting,
      maxDiscountPercent,
      'product.min_price': product.min_price,
      'product.max_discount_percent': product.max_discount_percent
    });
    
    // Calcular preço mínimo baseado no desconto máximo
    const minPriceByDiscount = maxDiscountPercent > 0 
      ? salePrice * (1 - maxDiscountPercent / 100) 
      : 0;
    
    // Usar o maior entre min_price e minPriceByDiscount
    const finalMinPrice = Math.max(minPriceExisting, minPriceByDiscount);
    
    console.log('🔍 validatePrice - Cálculos:', {
      minPriceByDiscount,
      finalMinPrice,
      'minPriceExisting > 0': minPriceExisting > 0,
      'maxDiscountPercent > 0': maxDiscountPercent > 0
    });
    
    // Calcular informações de desconto
    const { currentDiscount, isExceeded } = calculateDiscountInfo(inputPrice);

    // Validação de preço mínimo
    if (inputPrice < finalMinPrice && finalMinPrice > 0) {
      return {
        isValid: false,
        error: `Preço mínimo permitido: R$ ${finalMinPrice.toFixed(2)}`,
        minPrice: finalMinPrice,
        suggestedPrice: salePrice,
        maxDiscountPercent,
        currentDiscountPercent: currentDiscount,
        minPriceByDiscount,
        isDiscountExceeded: isExceeded
      };
    }

    // Validação de desconto máximo
    if (isExceeded) {
      return {
        isValid: false,
        error: `Desconto máximo permitido: ${maxDiscountPercent.toFixed(1)}%`,
        minPrice: finalMinPrice,
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
      minPrice: finalMinPrice,
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
    const minPriceExisting = product.min_price || 0;
    const maxDiscountPercent = product.max_discount_percent || 0;
    const salePrice = product.sale_price || product.price || 0;
    
    const minPriceByDiscount = maxDiscountPercent > 0 
      ? salePrice * (1 - maxDiscountPercent / 100) 
      : 0;
    
    const result = Math.max(minPriceExisting, minPriceByDiscount);
    
    console.log('🔍 getMinPrice - Debug:', {
      productId: product.id,
      minPriceExisting,
      maxDiscountPercent,
      salePrice,
      minPriceByDiscount,
      finalResult: result
    });
    
    return result;
  };

  const hasMinPriceRestriction = (): boolean => {
    const result = getMinPrice() > 0;
    console.log('🔍 hasMinPriceRestriction - Debug:', {
      productId: product?.id,
      minPrice: getMinPrice(),
      result,
      'product.min_price': product?.min_price,
      'product.max_discount_percent': product?.max_discount_percent
    });
    return result;
  };

  const getMaxDiscountPercent = (): number => {
    const result = product?.max_discount_percent || 0;
    console.log('🔍 getMaxDiscountPercent:', result);
    return result;
  };

  const hasDiscountRestriction = (): boolean => {
    const result = getMaxDiscountPercent() > 0;
    console.log('🔍 hasDiscountRestriction:', result, 'maxDiscount:', getMaxDiscountPercent());
    return result;
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
