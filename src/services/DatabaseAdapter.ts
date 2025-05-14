
import WebDatabaseService from './WebDatabaseService';

interface DatabaseAdapter {
  initDatabase(): Promise<void>;
  getClients(): Promise<any[]>;
  getVisitRoutes(): Promise<any[]>;
  getOrders(clientId?: string): Promise<any[]>;
  getPendingSyncItems(table: string): Promise<any[]>;
  updateSyncStatus(table: string, id: string, status: 'synced' | 'pending' | 'error'): Promise<void>;
  logSync(type: string, status: string, details?: string): Promise<void>;
  closeDatabase(): Promise<void>;
}

// This function will determine which database implementation to use
export function getDatabaseAdapter(): DatabaseAdapter {
  // For now, we're only supporting web
  return WebDatabaseService.getInstance();
}

export default DatabaseAdapter;
