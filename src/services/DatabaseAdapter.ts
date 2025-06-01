
import WebDatabaseService from './WebDatabaseService';
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
  getTransmittedOrders(): Promise<any[]>;
  getAllOrders(): Promise<any[]>;
  // New method for mobile orders
  saveMobileOrder(order: any): Promise<void>;
  // ✅ NOVO: Métodos para salvar dados em batch
  saveClients(clientsArray: any[]): Promise<void>;
  saveProducts(productsArray: any[]): Promise<void>;
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
}

// Esta função determinará qual implementação de banco de dados usar
export function getDatabaseAdapter(): DatabaseAdapter {
  console.log('🔍 Determining database adapter...');
  
  // Para apps nativos, sempre tentar usar SQLite primeiro
  const isNative = Capacitor.isNativePlatform();
  
  console.log('🔍 Platform detection:', {
    isNative,
    platform: Capacitor.getPlatform(),
    isAndroid: Capacitor.getPlatform() === 'android',
    isIOS: Capacitor.getPlatform() === 'ios'
  });
  
  if (isNative) {
    console.log('📱 Native platform detected, using SQLite database service');
    try {
      const sqliteService = SQLiteDatabaseService.getInstance();
      return sqliteService;
    } catch (e) {
      console.error('❌ Failed to initialize SQLite on native platform:', e);
      console.log('🌐 Falling back to Web database service');
      return WebDatabaseService.getInstance();
    }
  } else {
    console.log('🌐 Web platform detected, using Web database service');
    return WebDatabaseService.getInstance();
  }
}

export default DatabaseAdapter;
