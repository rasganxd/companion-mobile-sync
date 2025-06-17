
import MobileDatabaseService from './MobileDatabaseService';
import { Capacitor } from '@capacitor/core';

interface DatabaseAdapter {
  initDatabase(): Promise<void>;
  getClients(): Promise<any[]>;
  getVisitRoutes(): Promise<any[]>;
  getOrders(clientId?: string): Promise<any[]>;
  getProducts(): Promise<any[]>;
  getPendingSyncItems(table: string): Promise<any[]>;
  updateSyncStatus(table: string, id: string, status: 'synced' | 'pending_sync' | 'error' | 'transmitted' | 'deleted'): Promise<void>;
  logSync(type: string, status: string, details?: string): Promise<void>;
  saveOrder(order: any): Promise<void>;
  updateClientStatus(clientId: string, status: string): Promise<void>;
  getClientById(clientId: string): Promise<any | null>;
  closeDatabase(): Promise<void>;
  // New methods for offline flow
  getPendingOrders(): Promise<any[]>;
  markOrderAsTransmitted(orderId: string): Promise<void>;
  getOfflineOrdersCount(): Promise<number>;
  // New methods for improved order management
  getClientOrders(clientId: string): Promise<any[]>;
  deleteOrder(orderId: string): Promise<void>;
  deleteAllOrders(): Promise<void>;
  getTransmittedOrders(): Promise<any[]>;
  getAllOrders(): Promise<any[]>;
  // New method for mobile orders
  saveMobileOrder(order: any): Promise<void>;
  // ✅ NOVO: Métodos para salvar dados em batch
  saveClients(clientsArray: any[]): Promise<void>;
  saveProducts(productsArray: any[]): Promise<void>;
  savePaymentTables(paymentTablesArray: any[]): Promise<void>;
  saveClient(client: any): Promise<void>;
  saveProduct(product: any): Promise<void>;
  // ✅ NOVOS métodos para validações e controle de status
  isClientNegated(clientId: string): Promise<boolean>;
  unnegateClient(clientId: string, reason: string): Promise<void>;
  getClientStatusHistory(clientId: string): Promise<any[]>;
  hasClientPendingOrders(clientId: string): Promise<boolean>;
  canCreateOrderForClient(clientId: string): Promise<{ canCreate: boolean; reason?: string; existingOrder?: any }>;
  // ✅ NOVO: Método específico para verificar pedido ativo único
  getActivePendingOrder(clientId: string): Promise<any | null>;
  // ✅ NOVOS métodos adicionados para corrigir os erros
  getCustomers(): Promise<any[]>;
  getPaymentTables(): Promise<any[]>;
  // ✅ NOVO: Método para obter pedido por ID
  getOrderById(orderId: string): Promise<any | null>;
  // ✅ NOVO: Método para limpar dados mock
  clearMockData?(): Promise<void>;
  // ✅ NOVOS: Métodos para atualização inteligente de status
  updateClientStatusAfterOrderDeletion?(clientId: string): Promise<void>;
  resetAllNegatedClientsStatus?(): Promise<void>;
  // ✅ NOVOS: Métodos para diagnóstico mobile
  getDatabaseDiagnostics(): Promise<any>;
  validateDatabaseIntegrity(): Promise<boolean>;
}

// Esta função sempre retorna o MobileDatabaseService com detecção inteligente de ambiente
export function getDatabaseAdapter(): DatabaseAdapter {
  console.log('📱 Initializing database adapter...');
  
  const platform = Capacitor.getPlatform();
  const isNative = Capacitor.isNativePlatform();
  
  console.log('📱 Environment details:', {
    platform,
    isNative,
    userAgent: navigator.userAgent.substring(0, 100),
    timestamp: new Date().toISOString()
  });
  
  try {
    const mobileService = MobileDatabaseService.getInstance();
    console.log('✅ Mobile database service initialized successfully');
    console.log('🔧 Service will auto-detect and use appropriate storage (SQLite/LocalStorage)');
    return mobileService;
  } catch (error) {
    console.error('❌ Critical error initializing database service:', error);
    
    // Even if there's an error, return the service - it will handle fallbacks internally
    console.log('⚠️ Returning service anyway - fallback mechanisms will handle errors');
    return MobileDatabaseService.getInstance();
  }
}

export default DatabaseAdapter;
