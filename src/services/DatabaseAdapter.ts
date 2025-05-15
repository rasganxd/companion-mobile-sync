
import WebDatabaseService from './WebDatabaseService';
import SQLiteDatabaseService from './SQLiteDatabaseService';
import { Platform } from 'react-native';

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
  // Verifica se estamos em ambiente nativo (Android ou iOS)
  // Se o Platform.OS for 'android' ou 'ios', usamos SQLite, caso contrário, usamos WebDB
  try {
    // Se estamos no ambiente web, Platform será undefined ou 'web'
    if (Platform?.OS === 'android' || Platform?.OS === 'ios') {
      return SQLiteDatabaseService.getInstance();
    }
  } catch (e) {
    console.log('Erro ao detectar plataforma ou inicializar SQLite:', e);
  }
  
  // Fallback para WebDatabaseService
  return WebDatabaseService.getInstance();
}

export default DatabaseAdapter;
