
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
  updateSyncStatus(table: string, id: string, status: 'synced' | 'pending_sync' | 'error'): Promise<void>;
  logSync(type: string, status: string, details?: string): Promise<void>;
  saveOrder(order: any): Promise<void>;
  updateClientStatus(clientId: string, status: string): Promise<void>;
  getClientById(clientId: string): Promise<any | null>;
  closeDatabase(): Promise<void>;
  // New methods for offline flow
  getPendingOrders(): Promise<any[]>;
  markOrderAsTransmitted(orderId: string): Promise<void>;
  getOfflineOrdersCount(): Promise<number>;
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
