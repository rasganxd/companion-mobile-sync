
/**
 * Utilitário para validação e normalização de dados específico para Android
 */

export const ensureArray = <T>(data: any): T[] => {
  if (Array.isArray(data)) {
    return data;
  }
  
  console.warn('🔧 [ANDROID] Data is not an array, converting:', typeof data, data);
  
  if (data === null || data === undefined) {
    return [];
  }
  
  if (typeof data === 'object' && data.values) {
    return Array.isArray(data.values) ? data.values : [];
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
    console.error('🔧 [ANDROID] JSON parse error:', error, 'Data:', jsonString);
    return null;
  }
};

export const validateOrderData = (order: any) => {
  if (!order) {
    console.warn('🔧 [ANDROID] Order is null/undefined');
    return null;
  }
  
  // Garantir que items seja sempre um array
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

export const logAndroidDebug = (context: string, data: any) => {
  console.log(`🔧 [ANDROID DEBUG] ${context}:`, {
    type: typeof data,
    isArray: Array.isArray(data),
    length: data?.length,
    hasValues: !!data?.values,
    valuesType: typeof data?.values,
    isValuesArray: Array.isArray(data?.values),
    data: data
  });
};
