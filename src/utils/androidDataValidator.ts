
/**
 * Utilitário para validação e normalização de dados específico para Android
 */

export const ensureArray = <T = any>(data: any): T[] => {
  if (Array.isArray(data)) {
    return data as T[];
  }
  
  if (data === null || data === undefined) {
    return [];
  }
  
  if (typeof data === 'object' && data.values) {
    return Array.isArray(data.values) ? (data.values as T[]) : [];
  }
  
  return [];
};

export const safeJsonParse = (jsonString: string | null | undefined): any => {
  if (!jsonString || typeof jsonString !== 'string') {
    return null;
  }
  
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parse error:', error);
    return null;
  }
};

export const validateOrderData = (order: any) => {
  if (!order) {
    return null;
  }
  
  if (order.items) {
    if (typeof order.items === 'string') {
      order.items = safeJsonParse(order.items) || [];
    } else if (!Array.isArray(order.items)) {
      order.items = [];
    }
  } else {
    order.items = [];
  }
  
  return order;
};

export const safeCast = <T>(data: any): T | null => {
  if (!data || typeof data !== 'object') {
    return null;
  }
  return data as T;
};

export const ensureTypedArray = <T>(data: any, validator?: (item: any) => boolean): T[] => {
  const array = ensureArray<T>(data);
  
  if (validator) {
    return array.filter(validator);
  }
  
  return array;
};
