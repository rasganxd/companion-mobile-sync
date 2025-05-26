
import WebDatabaseService from './WebDatabaseService';
import SQLiteDatabaseService from './SQLiteDatabaseService';

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

// Esta função determinará qual implementação de banco de dados usar
export function getDatabaseAdapter(): DatabaseAdapter {
  console.log('Determining database adapter...');
  
  // Detectar o ambiente atual
  const isMobileApp = (): boolean => {
    try {
      // Check if we're in a Capacitor environment
      const hasCapacitor = !!(window as any).Capacitor;
      console.log('Capacitor environment detected:', hasCapacitor);
      return hasCapacitor;
    } catch (e) {
      console.log('Error checking Capacitor environment:', e);
      return false;
    }
  };

  try {
    // Se estamos em um ambiente móvel (Capacitor), tenta usar SQLite
    if (isMobileApp()) {
      console.log('Using SQLite database service for mobile');
      return SQLiteDatabaseService.getInstance();
    }
  } catch (e) {
    console.log('Erro ao detectar plataforma ou inicializar SQLite, usando WebDatabase:', e);
  }
  
  // Fallback para WebDatabaseService
  console.log('Using Web database service');
  return WebDatabaseService.getInstance();
}

export default DatabaseAdapter;
