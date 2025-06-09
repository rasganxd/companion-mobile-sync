
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPriceInput(value: string): { formatted: string; numeric: number } {
  // Remove todos os caracteres que não são números, vírgula ou ponto
  let cleaned = value.replace(/[^\d,.-]/g, '');
  
  // Substitui vírgula por ponto para padronização
  cleaned = cleaned.replace(',', '.');
  
  // Remove pontos extras, mantendo apenas o último
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limita a 2 casas decimais
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
