
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

  const formatWhileTyping = (value: string): string => {
    // Remove tudo exceto números
    let numbers = value.replace(/\D/g, '');
    
    // Se não tem números, retorna formato vazio
    if (!numbers) return 'R$ 0,00';
    
    // Converte para número considerando os últimos 2 dígitos como centavos
    let numValue = parseInt(numbers) / 100;
    
    // Formata com 2 casas decimais e vírgula
    return `R$ ${numValue.toFixed(2).replace('.', ',')}`;
  };

  const handleChange = useCallback((value: string) => {
    setIsTyping(true);
    
    // Aplica formatação automática durante a digitação
    const formattedValue = formatWhileTyping(value);
    setInputValue(formattedValue);
    
    // Retorna o valor numérico para o componente pai
    return parsePrice(formattedValue);
  }, []);

  const handleBlur = useCallback(() => {
    setIsTyping(false);
    // Já está formatado, não precisa reformatar
  }, []);

  const handleFocus = useCallback(() => {
    setIsTyping(true);
  }, []);

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
    handleFocus,
    setValue,
    getValue,
    formatPrice,
    parsePrice,
    isTyping
  };
};
