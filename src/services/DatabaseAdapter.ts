
import WebDatabaseService from './WebDatabaseService';
import SQLiteDatabaseService from './SQLiteDatabaseService';

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
  
  // Detectar o ambiente atual de forma mais robusta
  const isMobileApp = (): boolean => {
    try {
      console.log('🔍 Checking environment...');
      
      // Verificar se estamos no browser
      if (typeof window === 'undefined') {
        console.log('❌ No window object - not in browser');
        return false;
      }
      
      // Verificar se é um ambiente Capacitor real
      const hasCapacitor = !!(window as any).Capacitor;
      const isCapacitorNative = hasCapacitor && (window as any).Capacitor.isNativePlatform && (window as any).Capacitor.isNativePlatform();
      
      console.log('🔍 Environment check:', {
        hasCapacitor,
        isCapacitorNative,
        userAgent: navigator.userAgent,
        platform: (window as any).Capacitor?.getPlatform?.() || 'unknown'
      });
      
      // Só considerar mobile se for realmente nativo
      return hasCapacitor && isCapacitorNative;
    } catch (e) {
      console.log('❌ Error checking environment:', e);
      return false;
    }
  };

  const isNative = isMobileApp();
  
  if (isNative) {
    console.log('📱 Using SQLite database service for native mobile');
    try {
      return SQLiteDatabaseService.getInstance();
    } catch (e) {
      console.log('❌ Failed to initialize SQLite, falling back to WebDatabase:', e);
      console.log('🌐 Using Web database service (fallback)');
      return WebDatabaseService.getInstance();
    }
  } else {
    console.log('🌐 Using Web database service for browser');
    return WebDatabaseService.getInstance();
  }
}

export default DatabaseAdapter;
