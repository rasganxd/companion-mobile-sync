
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPriceInput(value: string): { formatted: string; numeric: number } {
  // Se o valor está vazio, permite que continue vazio
  if (!value || value === '') {
    return {
      formatted: '',
      numeric: 0
    };
  }

  // Remove apenas caracteres que claramente não são números, vírgula ou ponto
  // Mas preserva o valor durante a edição para permitir backspace/delete
  let cleaned = value.replace(/[^\d,.-]/g, '');
  
  // Se após a limpeza ficou vazio, retorna vazio
  if (!cleaned) {
    return {
      formatted: '',
      numeric: 0
    };
  }
  
  // Substitui vírgula por ponto para padronização
  cleaned = cleaned.replace(',', '.');
  
  // Remove pontos extras, mantendo apenas o último
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limita a 2 casas decimais apenas se há um ponto
  const dotIndex = cleaned.indexOf('.');
  if (dotIndex !== -1 && cleaned.length > dotIndex + 3) {
    cleaned = cleaned.substring(0, dotIndex + 3);
  }
  
  // Converte para número para validações
  const numeric = parseFloat(cleaned) || 0;
  
  return {
    formatted: cleaned,
    numeric: numeric
  };
}
