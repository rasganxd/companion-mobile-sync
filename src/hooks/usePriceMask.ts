
import { useState, useCallback } from 'react';

export const usePriceMask = (initialValue: number = 0) => {
  const formatPrice = (value: number): string => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const parsePrice = (maskedValue: string): number => {
    const cleanValue = maskedValue.replace(/[R$\s]/g, '').replace(',', '.');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  };

  const [maskedValue, setMaskedValue] = useState(() => formatPrice(initialValue));

  const handleChange = useCallback((value: string) => {
    // Remove caracteres não numéricos exceto vírgula e ponto
    const cleanValue = value.replace(/[^0-9,\.]/g, '');
    
    // Converte vírgula para ponto para parsing
    const normalizedValue = cleanValue.replace(',', '.');
    
    // Valida se é um número válido
    const numericValue = parseFloat(normalizedValue);
    if (!isNaN(numericValue) && numericValue >= 0) {
      setMaskedValue(formatPrice(numericValue));
      return numericValue;
    }
    
    // Se inválido, mantém o valor anterior
    return parsePrice(maskedValue);
  }, [maskedValue]);

  const setValue = useCallback((value: number) => {
    setMaskedValue(formatPrice(value));
  }, []);

  const getValue = useCallback(() => {
    return parsePrice(maskedValue);
  }, [maskedValue]);

  return {
    maskedValue,
    handleChange,
    setValue,
    getValue,
    formatPrice,
    parsePrice
  };
};
