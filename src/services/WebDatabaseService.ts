import { openDB, IDBPDatabase } from 'idb';
import { DatabaseInitializer } from './database/DatabaseInitializer';
import type { SalesAppDBSchema, ValidTableName, DatabaseInstance } from './database/types';

class WebDatabaseService {
  private static instance: WebDatabaseService;
  private db: DatabaseInstance | null = null;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): WebDatabaseService {
    if (!WebDatabaseService.instance) {
      WebDatabaseService.instance = new WebDatabaseService();
    }
    return WebDatabaseService.instance;
  }

  async initDatabase(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise(async (resolve, reject) => {
      try {
        console.log('Initializing Web database...');
        this.db = await openDB<SalesAppDBSchema>('sales-app-db', 1, {
          upgrade(db, oldVersion, newVersion, transaction) {
            console.log(`Upgrading Web database from version ${oldVersion} to ${newVersion}...`);
            DatabaseInitializer.initializeDatabase(db, oldVersion, newVersion, transaction);
          },
          blocked() {
            console.warn('Web database blocked');
          },
          blocking() {
            console.warn('Web database blocking');
          },
          terminated() {
            console.warn('Web database terminated');
          },
        });
        console.log('Web database initialized successfully');
        resolve();
      } catch (error) {
        console.error('Error initializing Web database:', error);
        reject(error);
      } finally {
        this.initPromise = null;
      }
    });

    return this.initPromise;
  }

  private async ensureDatabaseInitialized(): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }
    if (!this.db) {
      throw new Error('Database initialization failed');
    }
  }

  async getClients(): Promise<any[]> {
    await this.ensureDatabaseInitialized();
    return this.db!.getAll('clients');
  }

  async getVisitRoutes(): Promise<any[]> {
    await this.ensureDatabaseInitialized();
    return this.db!.getAll('visit_routes');
  }

  async getOrders(clientId?: string): Promise<any[]> {
    await this.ensureDatabaseInitialized();
    if (clientId) {
      const tx = this.db!.transaction('orders', 'readonly');
      const index = tx.store.index('customer_id');
      return index.getAll(clientId);
    }
    return this.db!.getAll('orders');
  }

  async getProducts(): Promise<any[]> {
    await this.ensureDatabaseInitialized();
    return this.db!.getAll('products');
  }

  async getPendingSyncItems(table: string): Promise<any[]> {
    await this.ensureDatabaseInitialized();
    // This is a mock implementation. You'll need to adapt it to your IndexedDB schema.
    const allItems = await this.db!.getAll(table as ValidTableName);
    return allItems.filter(item => item.sync_status === 'pending_sync');
  }

  async updateSyncStatus(table: string, id: string, status: 'synced' | 'pending_sync' | 'error' | 'transmitted' | 'deleted'): Promise<void> {
    await this.ensureDatabaseInitialized();
    const item = await this.db!.get(table as ValidTableName, id);
    if (item) {
      item.sync_status = status;
      await this.db!.put(table as ValidTableName, item);
    } else {
      console.warn(`Item with id ${id} not found in table ${table}`);
    }
  }

  async logSync(type: string, status: string, details?: string): Promise<void> {
    await this.ensureDatabaseInitialized();
    const logEntry = {
      type,
      status,
      details,
      timestamp: new Date().toISOString()
    };
    await this.db!.add('sync_log', logEntry);
  }

  async saveOrder(order: any): Promise<void> {
    await this.ensureDatabaseInitialized();
    await this.db!.put('orders', order);
    
    // ✅ NOVO: Automaticamente positivar o cliente quando um pedido é salvo
    if (order.customer_id) {
      await this.updateClientStatus(order.customer_id, 'positivado');
    }
  }

  async updateOrder(orderId: string, order: any): Promise<void> {
    await this.ensureDatabaseInitialized();
    await this.db!.put('orders', { ...order, id: orderId });
  }

  async updateClientStatus(clientId: string, status: string): Promise<void> {
    await this.ensureDatabaseInitialized();
    const client = await this.getClientById(clientId);
    if (client) {
      client.status = status;
      await this.db!.put('clients', client);
    }
  }

  async getClientById(clientId: string): Promise<any | null> {
    await this.ensureDatabaseInitialized();
    return this.db!.get('clients', clientId);
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  async getPendingOrders(): Promise<any[]> {
    await this.ensureDatabaseInitialized();
    const allOrders = await this.db!.getAll('orders');
    return allOrders.filter(order => order.sync_status === 'pending_sync');
  }

  async markOrderAsTransmitted(orderId: string): Promise<void> {
    await this.ensureDatabaseInitialized();
    const order = await this.db!.get('orders', orderId);
    if (order) {
      order.sync_status = 'transmitted';
      await this.db!.put('orders', order);
    }
  }

  async getOfflineOrdersCount(): Promise<number> {
    await this.ensureDatabaseInitialized();
    const allOrders = await this.db!.getAll('orders');
    return allOrders.filter(order => order.sync_status !== 'synced').length;
  }

  async getClientOrders(clientId: string): Promise<any[]> {
    await this.ensureDatabaseInitialized();
    const tx = this.db!.transaction('orders', 'readonly');
    const index = tx.store.index('customer_id');
    return index.getAll(clientId);
  }

  async deleteOrder(orderId: string): Promise<void> {
    await this.ensureDatabaseInitialized();
    await this.db!.delete('orders', orderId);
  }

  async deleteAllOrders(): Promise<void> {
    await this.ensureDatabaseInitialized();
    const orders = await this.db!.getAllKeys('orders');
    for (const orderId of orders) {
      await this.db!.delete('orders', orderId);
    }
  }

  async getTransmittedOrders(): Promise<any[]> {
    await this.ensureDatabaseInitialized();
    const allOrders = await this.db!.getAll('orders');
    return allOrders.filter(order => order.sync_status === 'transmitted');
  }

  async getAllOrders(): Promise<any[]> {
     await this.ensureDatabaseInitialized();
     return await this.db!.getAll('orders');
  }

  async saveMobileOrder(order: any): Promise<void> {
    await this.ensureDatabaseInitialized();
    await this.db!.put('orders', order);
  }

  async saveClients(clientsArray: any[]): Promise<void> {
    console.log('💾 Saving clients to Web database...', clientsArray.length);
    
    if (!this.db) {
      await this.initDatabase();
    }

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const tx = this.db.transaction('clients', 'readwrite');
    const store = tx.objectStore('clients');

    try {
      for (const client of clientsArray) {
        console.log('💾 Saving client:', client.id, client.name);
        await store.put(client);
      }
      
      await tx.done;
      console.log('✅ Successfully saved', clientsArray.length, 'clients to Web database');
    } catch (error) {
      console.error('❌ Error saving clients:', error);
      throw error;
    }
  }

  async saveProducts(productsArray: any[]): Promise<void> {
    console.log('💾 Saving products to Web database...', productsArray.length);
    
    if (!this.db) {
      await this.initDatabase();
    }

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const tx = this.db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');

    try {
      for (const product of productsArray) {
        console.log('💾 Saving product:', product.id, product.name);
        await store.put(product);
      }
      
      await tx.done;
      console.log('✅ Successfully saved', productsArray.length, 'products to Web database');
    } catch (error) {
      console.error('❌ Error saving products:', error);
      throw error;
    }
  }

  async savePaymentTables(paymentTablesArray: any[]): Promise<void> {
    console.log('💾 Saving payment tables to Web database...', paymentTablesArray.length);
    
    if (!this.db) {
      await this.initDatabase();
    }

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const tx = this.db.transaction('payment_tables', 'readwrite');
    const store = tx.objectStore('payment_tables');

    try {
      for (const paymentTable of paymentTablesArray) {
        console.log('💾 Saving payment table:', paymentTable.id, paymentTable.name);
        await store.put(paymentTable);
      }
      
      await tx.done;
      console.log('✅ Successfully saved', paymentTablesArray.length, 'payment tables to Web database');
    } catch (error) {
      console.error('❌ Error saving payment tables:', error);
      throw error;
    }
  }

  async saveClient(client: any): Promise<void> {
    await this.ensureDatabaseInitialized();
    await this.db!.put('clients', client);
  }

  async saveProduct(product: any): Promise<void> {
    await this.ensureDatabaseInitialized();
    await this.db!.put('products', product);
  }

  async isClientNegated(clientId: string): Promise<boolean> {
    await this.ensureDatabaseInitialized();
    const client = await this.getClientById(clientId);
    return client?.status === 'negated';
  }

  async unnegateClient(clientId: string, reason: string): Promise<void> {
    await this.ensureDatabaseInitialized();
    const client = await this.getClientById(clientId);
    if (client) {
      client.status = 'active';
      client.negation_reason = reason;
      await this.db!.put('clients', client);
    }
  }

  async getClientStatusHistory(clientId: string): Promise<any[]> {
    await this.ensureDatabaseInitialized();
    // Mock implementation, replace with actual logic if needed
    return Promise.resolve([]);
  }

  async hasClientPendingOrders(clientId: string): Promise<boolean> {
    await this.ensureDatabaseInitialized();
    const orders = await this.getClientOrders(clientId);
    return orders.some(order => order.sync_status !== 'synced');
  }

  async canCreateOrderForClient(clientId: string): Promise<{ canCreate: boolean; reason?: string; existingOrder?: any }> {
    await this.ensureDatabaseInitialized();
    const client = await this.getClientById(clientId);

    if (!client) {
      return { canCreate: false, reason: 'Cliente não encontrado' };
    }

    if (client.status === 'negated') {
      return { canCreate: false, reason: 'Cliente negativado' };
    }

    const activePendingOrder = await this.getActivePendingOrder(clientId);
    if (activePendingOrder) {
      return { canCreate: false, reason: 'Já existe um pedido pendente para este cliente', existingOrder: activePendingOrder };
    }

    return { canCreate: true };
  }

  async getActivePendingOrder(clientId: string): Promise<any | null> {
    await this.ensureDatabaseInitialized();
    const tx = this.db!.transaction('orders', 'readonly');
    const index = tx.store.index('customer_id');
    const orders = await index.getAll(clientId);
    return orders.find(order => order.status === 'pending' && order.sync_status !== 'synced');
  }

  async getCustomers(): Promise<any[]> {
    await this.ensureDatabaseInitialized();
    return this.db!.getAll('clients');
  }

  async getPaymentTables(): Promise<any[]> {
    await this.ensureDatabaseInitialized();
    return this.db!.getAll('payment_tables');
  }

  async getOrderById(orderId: string): Promise<any | null> {
    await this.ensureDatabaseInitialized();
    return this.db!.get('orders', orderId);
  }

  async saveOrders(ordersArray: any[]): Promise<void> {
    console.log('💾 Saving orders to Web database...', ordersArray.length);
    
    if (!this.db) {
      await this.initDatabase();
    }

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const tx = this.db.transaction('orders', 'readwrite');
    const store = tx.objectStore('orders');

    try {
      for (const order of ordersArray) {
        console.log('💾 Saving order:', order.id, order.customer_name);
        await store.put(order);
      }
      
      await tx.done;
      console.log('✅ Successfully saved', ordersArray.length, 'orders to Web database');
    } catch (error) {
      console.error('❌ Error saving orders:', error);
      throw error;
    }
  }
}

export default WebDatabaseService;
