
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

class WebDatabaseService implements DatabaseAdapter {
  private static instance: WebDatabaseService;
  private dbName = 'SalesAppDB';
  private version = 1;
  private db: IDBPDatabase<SalesAppDBSchema> | null = null;

  private constructor() {}

  static getInstance(): WebDatabaseService {
    if (!WebDatabaseService.instance) {
      WebDatabaseService.instance = new WebDatabaseService();
    }
    return WebDatabaseService.instance;
  }

  async initDatabase(): Promise<void> {
    try {
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
    }
  }

  async getClients(): Promise<any[]> {
    if (!this.db) {
      await this.initDatabase();
    }
    return this.db!.getAll('clients');
  }

  async getVisitRoutes(): Promise<any[]> {
    if (!this.db) {
      await this.initDatabase();
    }
    return this.db!.getAll('visit_routes');
  }

  async getOrders(clientId?: string): Promise<any[]> {
    if (!this.db) {
      await this.initDatabase();
    }
    if (clientId) {
      const tx = this.db!.transaction('orders', 'readonly');
      const index = tx.store.index('customer_id');
      return index.getAll(clientId);
    } else {
      return this.db!.getAll('orders');
    }
  }

  async getProducts(): Promise<any[]> {
    if (!this.db) {
      await this.initDatabase();
    }
    return this.db!.getAll('products');
  }

  async getPendingSyncItems(table: string): Promise<any[]> {
    if (!this.db) {
      await this.initDatabase();
    }
    const items = await this.db!.getAll(table);
    return items.filter(item => item.sync_status === 'pending_sync');
  }

  async updateSyncStatus(table: string, id: string, status: 'synced' | 'pending_sync' | 'error' | 'transmitted' | 'deleted'): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }
    const item = await this.db!.get(table, id);
    if (item) {
      item.sync_status = status;
      await this.db!.put(table, item);
      console.log(`✅ Sync status updated for ${table} with id ${id} to ${status}`);
    } else {
      console.warn(`⚠️ Item not found in ${table} with id ${id}`);
    }
  }

  async logSync(type: string, status: string, details?: string): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }
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
    if (!this.db) {
      await this.initDatabase();
    }
    await this.db!.put('orders', order);
    console.log('💾 Order saved/updated:', order);
  }

  async updateClientStatus(clientId: string, status: string): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }
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
    if (!this.db) {
      await this.initDatabase();
    }
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
    if (!this.db) {
      await this.initDatabase();
    }
    const orders = await this.db!.getAll('orders');
    return orders.filter(order => order.sync_status === 'pending_sync');
  }

  async markOrderAsTransmitted(orderId: string): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }
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
    if (!this.db) {
      await this.initDatabase();
    }
    const orders = await this.db!.getAll('orders');
    return orders.filter(order => order.sync_status === 'pending_sync').length;
  }

  // New methods for improved order management
  async getClientOrders(clientId: string): Promise<any[]> {
    if (!this.db) {
      await this.initDatabase();
    }
    const tx = this.db!.transaction('orders', 'readonly');
    const index = tx.store.index('customer_id');
    return index.getAll(clientId);
  }

  async deleteOrder(orderId: string): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }
    await this.db!.delete('orders', orderId);
    console.log(`🗑️ Order ${orderId} deleted`);
  }

  async getTransmittedOrders(): Promise<any[]> {
     if (!this.db) {
      await this.initDatabase();
    }
    const orders = await this.db!.getAll('orders');
    return orders.filter(order => order.sync_status === 'transmitted');
  }

  async getAllOrders(): Promise<any[]> {
    if (!this.db) {
      await this.initDatabase();
    }
    return this.db!.getAll('orders');
  }
  
  async saveMobileOrder(order: any): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }
    await this.db!.put('orders', order);
    console.log('📱 Mobile order saved locally:', order);
  }

  // ✅ NOVO: Métodos para salvar dados em batch
  async saveClients(clientsArray: any[]): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }
    const tx = this.db!.transaction('clients', 'readwrite');
    clientsArray.forEach(client => {
      tx.store.put(client);
    });
    await tx.done;
    console.log(`✅ Saved ${clientsArray.length} clients in batch`);
  }

  async saveProducts(productsArray: any[]): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }
    const tx = this.db!.transaction('products', 'readwrite');
    productsArray.forEach(product => {
      tx.store.put(product);
    });
    await tx.done;
    console.log(`✅ Saved ${productsArray.length} products in batch`);
  }

  async saveClient(client: any): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }
    await this.db!.put('clients', client);
    console.log('✅ Client saved:', client);
  }

  async saveProduct(product: any): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }
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
      
      // Log the unnegation
      const logEntry = {
        id: `unnegate_${Date.now()}`,
        client_id: clientId,
        action: 'unnegate',
        reason: reason,
        date: new Date().toISOString(),
        sync_status: 'pending_sync'
      };
      
      // Save to a status history if needed
      console.log('📝 Client unnegation logged:', logEntry);
    } catch (error) {
      console.error('Error unnegating client:', error);
      throw error;
    }
  }

  async getClientStatusHistory(clientId: string): Promise<any[]> {
    // Implementation for status history - can be added later if needed
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
        // Return the most recent pending order
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
      // 1. Check if client is negated
      const isNegated = await this.isClientNegated(clientId);
      if (isNegated) {
        return {
          canCreate: false,
          reason: 'Cliente está negativado'
        };
      }

      // 2. Check if client has pending orders
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
