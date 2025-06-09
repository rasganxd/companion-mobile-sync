
import { useState, useCallback } from 'react';

export const usePriceMask = (initialValue: number = 0) => {
  const [displayValue, setDisplayValue] = useState(() => formatPrice(initialValue));
  const [numericValue, setNumericValue] = useState(initialValue);

  const formatPrice = useCallback((value: number): string => {
    if (isNaN(value) || value === 0) return 'R$ 0,00';
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }, []);

  const parsePrice = useCallback((formattedValue: string): number => {
    // Remove tudo exceto números e vírgula/ponto
    const cleaned = formattedValue.replace(/[^\d,\.]/g, '');
    
    // Se estiver vazio, retorna 0
    if (!cleaned) return 0;
    
    // Substitui vírgula por ponto para conversão
    const normalized = cleaned.replace(',', '.');
    
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  }, []);

  const handleInputChange = useCallback((value: string) => {
    // Remove caracteres inválidos, mantém apenas números, vírgula e ponto
    const cleaned = value.replace(/[^\d,\.]/g, '');
    
    // Se começar com vírgula ou ponto, adiciona 0 na frente
    const normalized = cleaned.startsWith(',') || cleaned.startsWith('.') 
      ? '0' + cleaned 
      : cleaned;
    
    // Limita a apenas uma vírgula ou ponto decimal
    const parts = normalized.split(/[,\.]/);
    if (parts.length > 2) {
      return; // Ignora entrada se há mais de um separador decimal
    }
    
    // Formata para exibição com R$
    const displayFormatted = normalized ? `R$ ${normalized}` : 'R$ ';
    setDisplayValue(displayFormatted);
    
    // Converte para número
    const numeric = parsePrice(displayFormatted);
    setNumericValue(numeric);
  }, [parsePrice]);

  const setValue = useCallback((newValue: number) => {
    setNumericValue(newValue);
    setDisplayValue(formatPrice(newValue));
  }, [formatPrice]);

  const handleBlur = useCallback(() => {
    // Formata corretamente ao perder o foco
    setDisplayValue(formatPrice(numericValue));
  }, [numericValue, formatPrice]);

  return {
    displayValue,
    numericValue,
    handleInputChange,
    handleBlur,
    setValue,
    formatPrice
  };
};
