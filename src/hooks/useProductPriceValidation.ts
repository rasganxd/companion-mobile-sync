
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

  // Log detalhado do produto quando ele for selecionado
  useEffect(() => {
    if (product) {
      console.log('🔍 PRODUTO SELECIONADO - Dados completos:', {
        id: product.id,
        name: product.name,
        code: product.code,
        price: product.price,
        sale_price: product.sale_price,
        max_discount_percent: product.max_discount_percent,
        hasDiscountRestriction: (product.max_discount_percent && product.max_discount_percent > 0),
        stock: product.stock,
        has_subunit: product.has_subunit,
        subunit_ratio: product.subunit_ratio
      });
    }
  }, [product]);

  // ✅ NOVA FUNÇÃO: Converter preço da subunidade para preço equivalente da unidade principal
  const convertToMainUnitPrice = (inputPrice: number, selectedUnitType: 'main' | 'sub' = 'main'): number => {
    if (!product || selectedUnitType === 'main') {
      return inputPrice;
    }

    // Se vendendo por subunidade, converter para preço equivalente da unidade principal
    if (product.has_subunit && product.subunit_ratio && product.subunit_ratio > 1) {
      const equivalentMainUnitPrice = inputPrice * product.subunit_ratio;
      console.log('💰 convertToMainUnitPrice:', {
        inputPrice,
        subunitRatio: product.subunit_ratio,
        equivalentMainUnitPrice,
        calculation: `${inputPrice} × ${product.subunit_ratio} = ${equivalentMainUnitPrice}`
      });
      return equivalentMainUnitPrice;
    }

    return inputPrice;
  };

  const calculateDiscountInfo = (inputPrice: number, selectedUnitType: 'main' | 'sub' = 'main') => {
    if (!product) {
      console.log('❌ calculateDiscountInfo: Produto não definido');
      return { currentDiscount: 0, isExceeded: false };
    }
    
    const salePrice = product.sale_price || product.price || 0;
    const maxDiscount = product.max_discount_percent || 0;
    
    // ✅ CORREÇÃO: Sempre calcular desconto baseado no preço da unidade principal
    const equivalentMainUnitPrice = convertToMainUnitPrice(inputPrice, selectedUnitType);
    
    console.log('🔍 calculateDiscountInfo - Dados de entrada:', {
      productName: product.name,
      inputPrice,
      selectedUnitType,
      equivalentMainUnitPrice,
      salePrice,
      maxDiscount
    });
    
    if (salePrice <= 0) {
      console.log('❌ calculateDiscountInfo: Preço de venda inválido');
      return { currentDiscount: 0, isExceeded: false };
    }
    
    // ✅ CORREÇÃO: Usar preço equivalente da unidade principal para calcular desconto
    const currentDiscount = ((salePrice - equivalentMainUnitPrice) / salePrice) * 100;
    const isExceeded = maxDiscount > 0 && currentDiscount > maxDiscount;
    
    console.log('📊 calculateDiscountInfo - Resultado:', {
      currentDiscount: Math.max(0, currentDiscount),
      isExceeded,
      calculationDetails: {
        formula: `((${salePrice} - ${equivalentMainUnitPrice}) / ${salePrice}) * 100`,
        result: currentDiscount
      }
    });
    
    return { currentDiscount: Math.max(0, currentDiscount), isExceeded };
  };

  const validatePrice = (inputPrice: number, selectedUnitType: 'main' | 'sub' = 'main'): PriceValidationResult => {
    console.log('🔍 validatePrice INICIADO:', {
      inputPrice,
      selectedUnitType,
      productName: product?.name || 'Nenhum produto'
    });

    if (!product) {
      console.log('❌ validatePrice: Produto não selecionado');
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
    
    console.log('🔍 validatePrice - Dados do produto:', {
      productName: product.name,
      productCode: product.code,
      inputPrice,
      selectedUnitType,
      salePrice,
      maxDiscountPercent,
      hasDiscountRestriction: maxDiscountPercent > 0
    });
    
    // Calcular preço mínimo baseado APENAS no desconto máximo para a unidade principal
    const minPriceByDiscount = maxDiscountPercent > 0 
      ? salePrice * (1 - maxDiscountPercent / 100) 
      : 0;
    
    console.log('💰 validatePrice - Cálculos de preço:', {
      minPriceByDiscount,
      calculationFormula: maxDiscountPercent > 0 ? `${salePrice} * (1 - ${maxDiscountPercent} / 100)` : 'Sem restrição'
    });
    
    // ✅ CORREÇÃO: Calcular informações de desconto com unidade correta
    const { currentDiscount, isExceeded } = calculateDiscountInfo(inputPrice, selectedUnitType);

    // Validação APENAS por desconto máximo
    if (maxDiscountPercent > 0 && currentDiscount > maxDiscountPercent) {
      const errorMessage = `❌ DESCONTO EXCEDIDO: ${currentDiscount.toFixed(1)}% > ${maxDiscountPercent.toFixed(1)}% (máximo)`;
      console.log('❌ validatePrice - VALIDAÇÃO FALHOU:', errorMessage);
      
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

    console.log('✅ validatePrice - VALIDAÇÃO PASSOU:', {
      inputPrice,
      selectedUnitType,
      maxDiscountPercent,
      currentDiscount,
      isValid: true
    });

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

  const checkPriceAndNotify = (inputPrice: number, selectedUnitType: 'main' | 'sub' = 'main'): boolean => {
    console.log('🔍 checkPriceAndNotify INICIADO:', {
      inputPrice,
      selectedUnitType,
      productName: product?.name || 'Nenhum produto'
    });

    const result = validatePrice(inputPrice, selectedUnitType);
    setValidationResult(result);

    if (!result.isValid && result.error) {
      const toastMessage = `❌ ${result.error}`;
      console.log('🚨 checkPriceAndNotify - MOSTRANDO TOAST:', toastMessage);
      toast.error(toastMessage);
      return false;
    }

    console.log('✅ checkPriceAndNotify - PREÇO VÁLIDO');
    return true;
  };

  const getMinPrice = (): number => {
    if (!product) return 0;
    const maxDiscountPercent = product.max_discount_percent || 0;
    const salePrice = product.sale_price || product.price || 0;
    
    const result = maxDiscountPercent > 0 
      ? salePrice * (1 - maxDiscountPercent / 100) 
      : 0;
    
    console.log('💰 getMinPrice:', {
      productName: product.name,
      maxDiscountPercent,
      salePrice,
      calculatedMinPrice: result
    });
    
    return result;
  };

  const hasMinPriceRestriction = (): boolean => {
    if (!product) return false;
    
    const hasMaxDiscount = (product.max_discount_percent || 0) > 0;
    
    console.log('🔍 hasMinPriceRestriction:', {
      productName: product.name,
      maxDiscountPercent: product.max_discount_percent,
      hasMaxDiscount,
      hasRestriction: hasMaxDiscount
    });
    
    return hasMaxDiscount;
  };

  const getMaxDiscountPercent = (): number => {
    return product?.max_discount_percent || 0;
  };

  const hasDiscountRestriction = (): boolean => {
    const hasRestriction = getMaxDiscountPercent() > 0;
    console.log('🔍 hasDiscountRestriction:', {
      productName: product?.name || 'Nenhum produto',
      maxDiscountPercent: getMaxDiscountPercent(),
      hasRestriction
    });
    return hasRestriction;
  };

  const getCurrentDiscountPercent = (inputPrice: number, selectedUnitType: 'main' | 'sub' = 'main'): number => {
    return calculateDiscountInfo(inputPrice, selectedUnitType).currentDiscount;
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
    getMinPriceByDiscount,
    convertToMainUnitPrice // ✅ NOVA: Expor função de conversão
  };
};
