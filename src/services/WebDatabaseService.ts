import DatabaseAdapter from './DatabaseAdapter';
import { openDB, IDBPDatabase, DBSchema } from 'idb';

interface SalesAppDBSchema extends DBSchema {
  clients: {
    key: string;
    value: any;
  };
  visit_routes: {
    key: string;
    value: any;
  };
  orders: {
    key: string;
    value: any;
    indexes: { 'customer_id': string };
  };
  products: {
    key: string;
    value: any;
  };
  sync_log: {
    key: string;
    value: any;
  };
}

// Valid table names for the schema
type ValidTableName = keyof SalesAppDBSchema;

class WebDatabaseService implements DatabaseAdapter {
  private static instance: WebDatabaseService;
  private dbName = 'SalesAppDB';
  private version = 1;
  private db: IDBPDatabase<SalesAppDBSchema> | null = null;
  private isInitializing = false;

  private constructor() {}

  static getInstance(): WebDatabaseService {
    if (!WebDatabaseService.instance) {
      WebDatabaseService.instance = new WebDatabaseService();
    }
    return WebDatabaseService.instance;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.db) {
      return;
    }
    
    if (this.isInitializing) {
      // Aguardar a inicialização em curso
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return;
    }
    
    await this.initDatabase();
  }

  async initDatabase(): Promise<void> {
    if (this.db || this.isInitializing) {
      return;
    }

    try {
      this.isInitializing = true;
      this.db = await openDB<SalesAppDBSchema>(this.dbName, this.version, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('clients')) {
            db.createObjectStore('clients', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('visit_routes')) {
            db.createObjectStore('visit_routes', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('orders')) {
            const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
            orderStore.createIndex('customer_id', 'customer_id');
          }
          if (!db.objectStoreNames.contains('products')) {
            db.createObjectStore('products', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('sync_log')) {
            db.createObjectStore('sync_log', { keyPath: 'id' });
          }
        },
      });
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing database:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  async getClients(): Promise<any[]> {
    await this.ensureInitialized();
    return this.db!.getAll('clients');
  }

  async getVisitRoutes(): Promise<any[]> {
    await this.ensureInitialized();
    return this.db!.getAll('visit_routes');
  }

  async getOrders(clientId?: string): Promise<any[]> {
    await this.ensureInitialized();
    if (clientId) {
      const tx = this.db!.transaction('orders', 'readonly');
      const index = tx.store.index('customer_id');
      return index.getAll(clientId);
    } else {
      return this.db!.getAll('orders');
    }
  }

  async getProducts(): Promise<any[]> {
    await this.ensureInitialized();
    return this.db!.getAll('products');
  }

  async getPendingSyncItems(tableName: string): Promise<any[]> {
    await this.ensureInitialized();
    
    // Verificar se a tabela existe na lista de tabelas válidas
    const validTables: ValidTableName[] = ['clients', 'visit_routes', 'orders', 'products', 'sync_log'];
    if (!validTables.includes(tableName as ValidTableName)) {
      console.warn(`⚠️ Table ${tableName} does not exist`);
      return [];
    }
    
    const items = await this.db!.getAll(tableName as ValidTableName);
    return items.filter(item => item.sync_status === 'pending_sync');
  }

  async updateSyncStatus(tableName: string, id: string, status: 'synced' | 'pending_sync' | 'error' | 'transmitted' | 'deleted'): Promise<void> {
    await this.ensureInitialized();
    
    // Verificar se a tabela existe na lista de tabelas válidas
    const validTables: ValidTableName[] = ['clients', 'visit_routes', 'orders', 'products', 'sync_log'];
    if (!validTables.includes(tableName as ValidTableName)) {
      console.warn(`⚠️ Table ${tableName} does not exist`);
      return;
    }
    
    const tableKey = tableName as ValidTableName;
    const item = await this.db!.get(tableKey, id);
    if (item) {
      item.sync_status = status;
      await this.db!.put(tableKey, item);
      console.log(`✅ Sync status updated for ${tableName} with id ${id} to ${status}`);
    } else {
      console.warn(`⚠️ Item not found in ${tableName} with id ${id}`);
    }
  }

  async logSync(type: string, status: string, details?: string): Promise<void> {
    await this.ensureInitialized();
    const logEntry = {
      id: `sync_${Date.now()}`,
      type,
      status,
      details,
      timestamp: new Date().toISOString()
    };
    await this.db!.add('sync_log', logEntry);
    console.log(`📝 Sync log added: ${type} - ${status}`);
  }

  async saveOrder(order: any): Promise<void> {
    await this.ensureInitialized();
    await this.db!.put('orders', order);
    console.log('💾 Order saved/updated:', order);
  }

  async updateClientStatus(clientId: string, status: string): Promise<void> {
    await this.ensureInitialized();
    const client = await this.getClientById(clientId);
    if (client) {
      client.status = status;
      await this.db!.put('clients', client);
      console.log(`✅ Client ${clientId} status updated to ${status}`);
    } else {
      console.warn(`⚠️ Client not found with id ${clientId}`);
    }
  }

  async getClientById(clientId: string): Promise<any | null> {
    await this.ensureInitialized();
    return this.db!.get('clients', clientId);
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('🚪 Database connection closed');
    }
  }

  // New methods for offline flow
  async getPendingOrders(): Promise<any[]> {
    await this.ensureInitialized();
    const orders = await this.db!.getAll('orders');
    return orders.filter(order => order.sync_status === 'pending_sync');
  }

  async markOrderAsTransmitted(orderId: string): Promise<void> {
    await this.ensureInitialized();
    const order = await this.db!.get('orders', orderId);
    if (order) {
      order.sync_status = 'transmitted';
      await this.db!.put('orders', order);
      console.log(`✅ Order ${orderId} marked as transmitted`);
    } else {
      console.warn(`⚠️ Order not found with id ${orderId}`);
    }
  }

  async getOfflineOrdersCount(): Promise<number> {
    await this.ensureInitialized();
    const orders = await this.db!.getAll('orders');
    return orders.filter(order => order.sync_status === 'pending_sync').length;
  }

  // New methods for improved order management
  async getClientOrders(clientId: string): Promise<any[]> {
    await this.ensureInitialized();
    const tx = this.db!.transaction('orders', 'readonly');
    const index = tx.store.index('customer_id');
    return index.getAll(clientId);
  }

  async deleteOrder(orderId: string): Promise<void> {
    await this.ensureInitialized();
    await this.db!.delete('orders', orderId);
    console.log(`🗑️ Order ${orderId} deleted`);
  }

  async getTransmittedOrders(): Promise<any[]> {
    await this.ensureInitialized();
    const orders = await this.db!.getAll('orders');
    return orders.filter(order => order.sync_status === 'transmitted');
  }

  async getAllOrders(): Promise<any[]> {
    await this.ensureInitialized();
    return this.db!.getAll('orders');
  }
  
  async saveMobileOrder(order: any): Promise<void> {
    await this.ensureInitialized();
    await this.db!.put('orders', order);
    console.log('📱 Mobile order saved locally:', order);
  }

  // ✅ NOVO: Métodos para salvar dados em batch
  async saveClients(clientsArray: any[]): Promise<void> {
    await this.ensureInitialized();
    const tx = this.db!.transaction('clients', 'readwrite');
    clientsArray.forEach(client => {
      tx.store.put(client);
    });
    await tx.done;
    console.log(`✅ Saved ${clientsArray.length} clients in batch`);
  }

  async saveProducts(productsArray: any[]): Promise<void> {
    await this.ensureInitialized();
    const tx = this.db!.transaction('products', 'readwrite');
    productsArray.forEach(product => {
      tx.store.put(product);
    });
    await tx.done;
    console.log(`✅ Saved ${productsArray.length} products in batch`);
  }

  async saveClient(client: any): Promise<void> {
    await this.ensureInitialized();
    await this.db!.put('clients', client);
    console.log('✅ Client saved:', client);
  }

  async saveProduct(product: any): Promise<void> {
    await this.ensureInitialized();
    await this.db!.put('products', product);
    console.log('✅ Product saved:', product);
  }

  async isClientNegated(clientId: string): Promise<boolean> {
    try {
      const client = await this.getClientById(clientId);
      return client?.status === 'Negativado' || client?.status === 'negativado';
    } catch (error) {
      console.error('Error checking if client is negated:', error);
      return false;
    }
  }

  async unnegateClient(clientId: string, reason: string): Promise<void> {
    try {
      await this.updateClientStatus(clientId, 'Pendente');
      
      const logEntry = {
        id: `unnegate_${Date.now()}`,
        client_id: clientId,
        action: 'unnegate',
        reason: reason,
        date: new Date().toISOString(),
        sync_status: 'pending_sync'
      };
      
      console.log('📝 Client unnegation logged:', logEntry);
    } catch (error) {
      console.error('Error unnegating client:', error);
      throw error;
    }
  }

  async getClientStatusHistory(clientId: string): Promise<any[]> {
    return [];
  }

  async hasClientPendingOrders(clientId: string): Promise<boolean> {
    try {
      const orders = await this.getClientOrders(clientId);
      return orders.some(order => 
        order.sync_status === 'pending_sync' && order.status !== 'cancelled'
      );
    } catch (error) {
      console.error('Error checking client pending orders:', error);
      return false;
    }
  }

  async getActivePendingOrder(clientId: string): Promise<any | null> {
    try {
      const orders = await this.getClientOrders(clientId);
      const pendingOrders = orders.filter(order => 
        order.sync_status === 'pending_sync' && order.status !== 'cancelled'
      );
      
      if (pendingOrders.length > 0) {
        return pendingOrders.sort((a, b) => 
          new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()
        )[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error getting active pending order:', error);
      return null;
    }
  }

  async canCreateOrderForClient(clientId: string): Promise<{ canCreate: boolean; reason?: string; existingOrder?: any }> {
    try {
      const isNegated = await this.isClientNegated(clientId);
      if (isNegated) {
        return {
          canCreate: false,
          reason: 'Cliente está negativado'
        };
      }

      const activePendingOrder = await this.getActivePendingOrder(clientId);
      if (activePendingOrder) {
        return {
          canCreate: false,
          reason: 'Cliente já possui um pedido pendente',
          existingOrder: activePendingOrder
        };
      }

      return { canCreate: true };
    } catch (error) {
      console.error('Error validating client for order creation:', error);
      return {
        canCreate: false,
        reason: 'Erro ao validar cliente'
      };
    }
  }
}

export default WebDatabaseService;
