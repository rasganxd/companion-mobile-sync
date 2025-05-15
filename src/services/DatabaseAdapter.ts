
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
  updateSyncStatus(table: string, id: string, status: 'synced' | 'pending' | 'error'): Promise<void>;
  logSync(type: string, status: string, details?: string): Promise<void>;
  saveOrder(order: any): Promise<void>;
  updateClientStatus(clientId: string, status: string): Promise<void>;
  getClientById(clientId: string): Promise<any | null>;
  closeDatabase(): Promise<void>;
}

// This function will determine which database implementation to use
export function getDatabaseAdapter(): DatabaseAdapter {
  // Check if running on native platform
  const isNative = Capacitor.isNativePlatform();
  
  if (isNative) {
    // Use SQLite implementation on native platforms
    return SQLiteDatabaseService.getInstance();
  } else {
    // Use web implementation for web platforms
    return WebDatabaseService.getInstance();
  }
}

export default DatabaseAdapter;
