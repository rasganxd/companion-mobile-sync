
import WebDatabaseService from './WebDatabaseService';
import { SQLiteDatabaseService } from './SQLiteDatabaseService';
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
  updateOrder(orderId: string, order: any): Promise<void>;
  updateClientStatus(clientId: string, status: string): Promise<void>;
  getClientById(clientId: string): Promise<any | null>;
  closeDatabase(): Promise<void>;
  getPendingOrders(): Promise<any[]>;
  markOrderAsTransmitted(orderId: string): Promise<void>;
  getOfflineOrdersCount(): Promise<number>;
  getClientOrders(clientId: string): Promise<any[]>;
  deleteOrder(orderId: string): Promise<void>;
  deleteAllOrders(): Promise<void>;
  getTransmittedOrders(): Promise<any[]>;
  getAllOrders(): Promise<any[]>;
  saveMobileOrder(order: any): Promise<void>;
  saveClients(clientsArray: any[]): Promise<void>;
  saveProducts(productsArray: any[]): Promise<void>;
  savePaymentTables(paymentTablesArray: any[]): Promise<void>;
  saveClient(client: any): Promise<void>;
  saveProduct(product: any): Promise<void>;
  isClientNegated(clientId: string): Promise<boolean>;
  unnegateClient(clientId: string, reason: string): Promise<void>;
  getClientStatusHistory(clientId: string): Promise<any[]>;
  hasClientPendingOrders(clientId: string): Promise<boolean>;
  canCreateOrderForClient(clientId: string): Promise<{ canCreate: boolean; reason?: string; existingOrder?: any }>;
  getActivePendingOrder(clientId: string): Promise<any | null>;
  getCustomers(): Promise<any[]>;
  getPaymentTables(): Promise<any[]>;
  getOrderById(orderId: string): Promise<any | null>;
  clearMockData?(): Promise<void>;
  updateClientStatusAfterOrderDeletion?(clientId: string): Promise<void>;
  resetAllNegatedClientsStatus?(): Promise<void>;
  saveOrders(ordersArray: any[]): Promise<void>;
  getOrdersToSync(salesRepId: string): Promise<any[]>;
  updateOrderStatus(orderId: string, status: string, reason?: string): Promise<void>;
}

export function getDatabaseAdapter(): DatabaseAdapter {
  console.log('🔍 Determining database adapter...');
  
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
