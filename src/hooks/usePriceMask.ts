
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

  const [inputValue, setInputValue] = useState(() => formatPrice(initialValue));
  const [isTyping, setIsTyping] = useState(false);

  const handleChange = useCallback((value: string) => {
    setIsTyping(true);
    
    // Se o usuário está apagando tudo, permite valor vazio
    if (value === '' || value === 'R$ ') {
      setInputValue('R$ ');
      return 0;
    }

    // Remove caracteres não numéricos exceto vírgula e ponto
    let cleanValue = value.replace(/[^0-9,\.]/g, '');
    
    // Se não tem números, retorna 0
    if (!/\d/.test(cleanValue)) {
      setInputValue('R$ ');
      return 0;
    }

    // Substitui vírgula por ponto para cálculos
    const normalizedValue = cleanValue.replace(',', '.');
    const numericValue = parseFloat(normalizedValue);
    
    if (!isNaN(numericValue) && numericValue >= 0) {
      // Durante a digitação, mantém o formato mais simples
      if (cleanValue.includes(',') || cleanValue.includes('.')) {
        setInputValue(`R$ ${cleanValue}`);
      } else {
        setInputValue(`R$ ${cleanValue}`);
      }
      return numericValue;
    }
    
    // Se inválido, mantém o valor anterior
    return parsePrice(inputValue);
  }, [inputValue]);

  const handleBlur = useCallback(() => {
    setIsTyping(false);
    const numericValue = parsePrice(inputValue);
    setInputValue(formatPrice(numericValue));
  }, [inputValue]);

  const setValue = useCallback((value: number) => {
    setIsTyping(false);
    setInputValue(formatPrice(value));
  }, []);

  const getValue = useCallback(() => {
    return parsePrice(inputValue);
  }, [inputValue]);

  return {
    maskedValue: inputValue,
    handleChange,
    handleBlur,
    setValue,
    getValue,
    formatPrice,
    parsePrice,
    isTyping
  };
};
