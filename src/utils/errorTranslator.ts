/**
 * Traduz erros comuns de inglês para português
 */
export function translateError(error: string): string {
  if (!error) return error;

  const errorTranslations: Record<string, string> = {
    // Authentication errors
    'Invalid authentication: Mobile session token expired': 'Sessão expirada. Faça login novamente.',
    'Invalid authentication': 'Erro de autenticação. Faça login novamente.',
    'Mobile session token expired': 'Sessão expirada. Faça login novamente.',
    'Token de sessão expirado': 'Sessão expirada. Faça login novamente.',
    'Unauthorized': 'Não autorizado. Faça login novamente.',
    'Access denied': 'Acesso negado. Faça login novamente.',
    
    // Network errors
    'Network Error': 'Erro de conexão. Verifique sua internet.',
    'Failed to fetch': 'Falha na conexão. Verifique sua internet.',
    'Request timeout': 'Tempo limite da solicitação. Tente novamente.',
    'Connection refused': 'Conexão recusada. Verifique sua internet.',
    'Network request failed': 'Falha na requisição de rede.',
    
    // Sales rep errors
    'Sales representative not found': 'Vendedor não encontrado. Entre em contato com o administrador.',
    'Vendedor não identificado': 'Vendedor não identificado. Entre em contato com o administrador.',
    'Invalid sales representative': 'Vendedor inválido. Entre em contato com o administrador.',
    
    // Server errors
    'Internal Server Error': 'Erro interno do servidor. Tente novamente mais tarde.',
    'Service Unavailable': 'Serviço indisponível. Tente novamente mais tarde.',
    'Bad Gateway': 'Erro de conexão com o servidor. Tente novamente.',
    'Gateway Timeout': 'Tempo limite do servidor. Tente novamente.',
    
    // Data validation errors
    'Invalid data format': 'Formato de dados inválido.',
    'Missing required fields': 'Campos obrigatórios não preenchidos.',
    'Invalid order data': 'Dados do pedido inválidos.',
    'Order validation failed': 'Validação do pedido falhou.',
    
    // Generic errors
    'Something went wrong': 'Algo deu errado. Tente novamente.',
    'An error occurred': 'Ocorreu um erro. Tente novamente.',
    'Operation failed': 'Operação falhou. Tente novamente.',
  };

  // Busca tradução exata primeiro
  if (errorTranslations[error]) {
    return errorTranslations[error];
  }

  // Busca por palavras-chave no erro
  const lowerError = error.toLowerCase();
  
  if (lowerError.includes('session') && (lowerError.includes('expired') || lowerError.includes('invalid'))) {
    return 'Sessão expirada. Faça login novamente.';
  }
  
  if (lowerError.includes('network') || lowerError.includes('fetch') || lowerError.includes('connection')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }
  
  if (lowerError.includes('unauthorized') || lowerError.includes('authentication')) {
    return 'Erro de autenticação. Faça login novamente.';
  }
  
  if (lowerError.includes('sales rep') || lowerError.includes('vendedor')) {
    return 'Erro relacionado ao vendedor. Entre em contato com o administrador.';
  }
  
  if (lowerError.includes('timeout')) {
    return 'Tempo limite excedido. Tente novamente.';
  }
  
  if (lowerError.includes('server error') || lowerError.includes('500')) {
    return 'Erro interno do servidor. Tente novamente mais tarde.';
  }

  // Se não encontrar tradução, retorna o erro original
  return error;
}