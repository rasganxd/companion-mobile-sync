
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
  // Detectar o ambiente atual sem depender diretamente de react-native
  const isMobileApp = (): boolean => {
    try {
      // Check if we're in a Capacitor environment
      return !!(window as any).Capacitor;
    } catch (e) {
      return false;
    }
  };

  try {
    // Se estamos em um ambiente móvel (Capacitor), usamos SQLite
    if (isMobileApp()) {
      return SQLiteDatabaseService.getInstance();
    }
  } catch (e) {
    console.log('Erro ao detectar plataforma ou inicializar SQLite:', e);
  }
  
  // Fallback para WebDatabaseService
  return WebDatabaseService.getInstance();
}

export default DatabaseAdapter;
