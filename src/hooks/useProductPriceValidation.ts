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
  suggestedPrice: number;
  maxDiscountPercent: number;
  currentDiscountPercent: number;
  isDiscountExceeded: boolean;
}

// ✅ MODIFICADO: Hook agora recebe o tipo de unidade selecionado para ser determinístico
export const useProductPriceValidation = (product: Product | null, selectedUnitType: 'main' | 'sub' = 'main') => {
  const [validationResult, setValidationResult] = useState<PriceValidationResult>({
    isValid: true,
    error: null,
    suggestedPrice: 0,
    maxDiscountPercent: 0,
    currentDiscountPercent: 0,
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
        stock: product.stock
      });
    }
  }, [product]);

  // ✅ MODIFICADO: A lógica de desconto agora usa o `selectedUnitType` para converter o preço da sub-unidade para o preço da unidade principal ANTES de calcular o desconto. Isso remove a "adivinhação" anterior.
  const calculateDiscountInfo = (inputPrice: number) => {
    if (!product) {
      console.log('❌ calculateDiscountInfo: Produto não definido');
      return { currentDiscount: 0, isExceeded: false };
    }
    
    const salePrice = product.sale_price || product.price || 0; // Preço de venda da unidade PRINCIPAL
    const maxDiscount = product.max_discount_percent || 0;
    
    // Converte o preço de entrada para o equivalente da unidade principal para um cálculo de desconto consistente.
    let mainUnitEquivalentPrice = inputPrice;
    
    if (selectedUnitType === 'sub' && product.has_subunit && product.subunit_ratio && product.subunit_ratio > 1) {
      mainUnitEquivalentPrice = inputPrice * product.subunit_ratio;
      console.log('🔄 Convertendo preço da subunidade para unidade principal para cálculo do desconto:', {
        productName: product.name,
        inputPrice,
        subUnitPrice: inputPrice,
        ratio: product.subunit_ratio,
        mainUnitEquivalentPrice
      });
    }
    
    console.log('🔍 calculateDiscountInfo - Dados de entrada:', {
      productName: product.name,
      inputPrice,
      mainUnitEquivalentPrice,
      salePrice,
      maxDiscount
    });
    
    if (salePrice <= 0) {
      console.log('❌ calculateDiscountInfo: Preço de venda inválido');
      return { currentDiscount: 0, isExceeded: false };
    }
    
    const currentDiscount = ((salePrice - mainUnitEquivalentPrice) / salePrice) * 100;
    const isExceeded = maxDiscount > 0 && currentDiscount > maxDiscount;
    
    console.log('📊 calculateDiscountInfo - Resultado:', {
      currentDiscount: Math.max(0, currentDiscount),
      isExceeded,
      calculationDetails: {
        formula: `((${salePrice} - ${mainUnitEquivalentPrice}) / ${salePrice}) * 100`,
        result: currentDiscount
      }
    });
    
    return { currentDiscount: Math.max(0, currentDiscount), isExceeded };
  };

  const validatePrice = (inputPrice: number): PriceValidationResult => {
    console.log('🔍 validatePrice INICIADO:', {
      inputPrice,
      productName: product?.name || 'Nenhum produto'
    });

    if (!product) {
      console.log('❌ validatePrice: Produto não selecionado');
      return {
        isValid: false,
        error: 'Produto não selecionado',
        suggestedPrice: 0,
        maxDiscountPercent: 0,
        currentDiscountPercent: 0,
        isDiscountExceeded: false
      };
    }

    const salePrice = product.sale_price || product.price || 0;
    const maxDiscountPercent = product.max_discount_percent || 0;
    
    console.log('🔍 validatePrice - Dados do produto:', {
      productName: product.name,
      productCode: product.code,
      inputPrice,
      salePrice,
      maxDiscountPercent,
      hasDiscountRestriction: maxDiscountPercent > 0
    });
    
    // Calcular informações de desconto (sempre baseado na unidade principal)
    const { currentDiscount, isExceeded } = calculateDiscountInfo(inputPrice);

    // Validação APENAS por desconto máximo
    if (maxDiscountPercent > 0 && currentDiscount > maxDiscountPercent) {
      const errorMessage = `❌ DESCONTO EXCEDIDO: ${currentDiscount.toFixed(1)}% > ${maxDiscountPercent.toFixed(1)}% (máximo)`;
      console.log('❌ validatePrice - VALIDAÇÃO FALHOU:', errorMessage);
      
      return {
        isValid: false,
        error: `Desconto máximo permitido: ${maxDiscountPercent.toFixed(1)}%`,
        suggestedPrice: salePrice,
        maxDiscountPercent,
        currentDiscountPercent: currentDiscount,
        isDiscountExceeded: true
      };
    }

    console.log('✅ validatePrice - VALIDAÇÃO PASSOU:', {
      inputPrice,
      maxDiscountPercent,
      currentDiscount,
      isValid: true
    });

    return {
      isValid: true,
      error: null,
      suggestedPrice: salePrice,
      maxDiscountPercent,
      currentDiscountPercent: currentDiscount,
      isDiscountExceeded: false
    };
  };

  const checkPriceAndNotify = (inputPrice: number): boolean => {
    console.log('🔍 checkPriceAndNotify INICIADO:', {
      inputPrice,
      productName: product?.name || 'Nenhum produto'
    });

    const result = validatePrice(inputPrice);
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

  const getCurrentDiscountPercent = (inputPrice: number): number => {
    return calculateDiscountInfo(inputPrice).currentDiscount;
  };

  // ✅ MODIFICADO: Esta função agora usa o `selectedUnitType` para determinar o preço mínimo para a unidade CORRETA (principal ou subunidade), sem adivinhações baseadas no preço.
  const getMinPriceForCurrentUnit = (): number => {
    if (!product || !hasDiscountRestriction()) return 0;
    
    const salePrice = product.sale_price || product.price || 0;
    const maxDiscount = product.max_discount_percent || 0;
    const minMainUnitPrice = salePrice * (1 - maxDiscount / 100);
    
    // Se a unidade selecionada for a sub-unidade, calcula o preço mínimo para ela.
    if (selectedUnitType === 'sub' && product.has_subunit && product.subunit_ratio && product.subunit_ratio > 1) {
      const minSubUnitPrice = minMainUnitPrice / product.subunit_ratio;
      console.log('💰 getMinPriceForCurrentUnit (Sub-unidade):', {
        productName: product.name,
        minMainUnitPrice,
        ratio: product.subunit_ratio,
        minSubUnitPrice
      });
      return minSubUnitPrice;
    }
    
    console.log('💰 getMinPriceForCurrentUnit (Unidade Principal):', {
        productName: product.name,
        minMainUnitPrice
    });
    return minMainUnitPrice;
  };

  return {
    validatePrice,
    checkPriceAndNotify,
    validationResult,
    getMinPrice,
    getMaxDiscountPercent,
    hasDiscountRestriction,
    getCurrentDiscountPercent,
    getMinPriceForCurrentUnit
  };
};
