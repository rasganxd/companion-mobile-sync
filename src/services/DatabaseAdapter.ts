
import SQLiteDatabaseService from './SQLiteDatabaseService';
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

// Esta função sempre retorna SQLite para ambiente mobile
export function getDatabaseAdapter(): DatabaseAdapter {
  console.log('📱 Mobile-only app: Using SQLite database service');
  
  const platform = Capacitor.getPlatform();
  console.log('📱 Platform details:', {
    platform,
    isNative: Capacitor.isNativePlatform(),
    timestamp: new Date().toISOString()
  });
  
  try {
    const sqliteService = SQLiteDatabaseService.getInstance();
    console.log('✅ SQLite database service initialized successfully');
    return sqliteService;
  } catch (error) {
    console.error('❌ Critical error initializing SQLite database:', error);
    throw new Error(`Failed to initialize mobile database: ${error}`);
  }
}

export default DatabaseAdapter;
