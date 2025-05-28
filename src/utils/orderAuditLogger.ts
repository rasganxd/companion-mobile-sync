
interface AuditLogEntry {
  action: string;
  orderId: string;
  orderCode?: string;
  salesRepId?: string;
  salesRepName?: string;
  customerName?: string;
  syncStatus?: string;
  timestamp: string;
  details?: any;
}

export const logOrderAction = (entry: Omit<AuditLogEntry, 'timestamp'>) => {
  const logEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date().toISOString()
  };
  
  console.log('🔍 ORDER AUDIT LOG:', logEntry);
  
  // Aqui você pode adicionar lógica para enviar logs para um serviço de auditoria
  // Por exemplo, salvar no localStorage ou enviar para uma API
  try {
    const existingLogs = JSON.parse(localStorage.getItem('order_audit_logs') || '[]');
    existingLogs.push(logEntry);
    
    // Manter apenas os últimos 1000 logs
    if (existingLogs.length > 1000) {
      existingLogs.splice(0, existingLogs.length - 1000);
    }
    
    localStorage.setItem('order_audit_logs', JSON.stringify(existingLogs));
  } catch (error) {
    console.error('Erro ao salvar log de auditoria:', error);
  }
};

export const getAuditLogs = (): AuditLogEntry[] => {
  try {
    return JSON.parse(localStorage.getItem('order_audit_logs') || '[]');
  } catch (error) {
    console.error('Erro ao carregar logs de auditoria:', error);
    return [];
  }
};

export const clearAuditLogs = () => {
  localStorage.removeItem('order_audit_logs');
  console.log('🗑️ Logs de auditoria limpos');
};
