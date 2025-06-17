import { openDB, IDBPDatabase, DBSchema } from 'idb';
import { v4 as uuidv4 } from 'uuid';

export interface SalesAppDBSchema extends DBSchema {
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
    indexes: { customer_id: string };
  };
  products: {
    key: string;
    value: any;
  };
  payment_tables: {
    key: string;
    value: any;
  };
  sync_log: {
    key: string;
    value: any;
  };
}

class WebDatabaseService {
  private static instance: WebDatabaseService;
  private db: IDBPDatabase<SalesAppDBSchema> | null = null;
  private readonly DB_NAME = 'SalesAppDB';
  private readonly DB_VERSION = 3;

  private constructor() {}

  static getInstance(): WebDatabaseService {
    if (!WebDatabaseService.instance) {
      WebDatabaseService.instance = new WebDatabaseService();
    }
    return WebDatabaseService.instance;
  }

  async initDatabase(): Promise<void> {
    if (this.db) {
      console.log('🌐 Web database already initialized');
      return;
    }

    try {
      console.log('🌐 Initializing Web database...');
      this.db = await openDB<SalesAppDBSchema>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
          console.log(`🔄 Upgrading database from version ${oldVersion} to ${newVersion}`);
          
          if (oldVersion < 1) {
            console.log('Creating object store: clients');
            db.createObjectStore('clients');
            console.log('Creating object store: visit_routes');
            db.createObjectStore('visit_routes');
            console.log('Creating object store: orders');
            const ordersStore = db.createObjectStore('orders', { keyPath: 'id' });
            ordersStore.createIndex('customer_id', 'customer_id');
            console.log('Creating object store: products');
            db.createObjectStore('products');
            console.log('Creating object store: payment_tables');
            db.createObjectStore('payment_tables');
            console.log('Creating object store: sync_log');
            db.createObjectStore('sync_log');
          }

          if (oldVersion < 2) {
            console.log('🔄 Adding index customer_id to orders object store');
            const ordersStore = transaction.objectStore('orders');
            if (!ordersStore.indexNames.contains('customer_id')) {
              ordersStore.createIndex('customer_id', 'customer_id');
            }
          }

          if (oldVersion < 3) {
            console.log('🔄 Adding UUID to existing orders');
            const ordersStore = transaction.objectStore('orders');
            ordersStore.getAll().then(orders => {
              orders.forEach(order => {
                if (!order.id) {
                  order.id = uuidv4();
                  ordersStore.put(order, order.id);
                }
              });
            });
          }
        },
      });
      console.log('✅ Web database initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Web database:', error);
      throw error;
    }
  }

  async getClients(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAll('clients');
  }

  async getVisitRoutes(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAll('visit_routes');
  }

  async getOrders(clientId?: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    if (clientId) {
      const tx = this.db.transaction('orders', 'readonly');
      const index = tx.store.index('customer_id');
      return index.getAll(clientId);
    }
    return this.db.getAll('orders');
  }

  async getProducts(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAll('products');
  }

  async getPaymentTables(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAll('payment_tables');
  }

  async getPendingSyncItems(table: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    const allItems = await this.db.getAll('sync_log');
    return allItems.filter(item => item.type === table && item.status === 'pending_sync');
  }

  async updateSyncStatus(table: string, id: string, status: 'synced' | 'pending_sync' | 'error' | 'transmitted' | 'deleted'): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const tx = this.db.transaction('sync_log', 'readwrite');
    const store = tx.objectStore('sync_log');

    const item = await store.get(id);
    if (item) {
      item.status = status;
      await store.put(item, id);
    }

    await tx.done;
  }

  async logSync(type: string, status: string, details?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.put('sync_log', {
      id: uuidv4(),
      type,
      status,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  async saveOrder(order: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.put('orders', order);
  }

  async saveMobileOrder(order: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const orderToSave = {
      ...order,
      id: uuidv4(),
      sync_status: 'pending_sync',
      created_at: new Date().toISOString(),
    };

    await this.db.put('orders', orderToSave);
  }

  async updateClientStatus(clientId: string, status: string): Promise<void> {
     if (!this.db) throw new Error('Database not initialized');

    const client = await this.db.get('clients', clientId);
    if (client) {
      client.status = status;
      await this.db.put('clients', client, clientId);
    }
  }

  async getClientById(clientId: string): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.get('clients', clientId);
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  async getPendingOrders(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    const allOrders = await this.db.getAll('orders');
    return allOrders.filter(order => order.sync_status === 'pending_sync');
  }

  async markOrderAsTransmitted(orderId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const order = await this.db.get('orders', orderId);
    if (order) {
      order.sync_status = 'transmitted';
      await this.db.put('orders', order, orderId);
    }
  }

  async getOfflineOrdersCount(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const orders = await this.db.getAll('orders');
    return orders.filter(order => order.sync_status === 'pending_sync').length;
  }

  async getClientOrders(clientId: string): Promise<any[]> {
     if (!this.db) throw new Error('Database not initialized');
    const allOrders = await this.db.getAll('orders');
    return allOrders.filter(order => order.customer_id === clientId);
  }

  async deleteOrder(orderId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('orders', orderId);
  }

  async deleteAllOrders(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const tx = this.db.transaction('orders', 'readwrite');
    await tx.store.clear();
    await tx.done;
  }

  async getTransmittedOrders(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    const allOrders = await this.db.getAll('orders');
    return allOrders.filter(order => order.sync_status === 'transmitted' || order.sync_status === 'synced');
  }

  async getAllOrders(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAll('orders');
  }

  async saveClients(clientsArray: any[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    console.log(`💾 Salvando ${clientsArray.length} clientes no Web database...`);
    
    const tx = this.db.transaction('clients', 'readwrite');
    const store = tx.objectStore('clients');
    
    // Limpar clientes existentes primeiro
    await store.clear();
    console.log('🗑️ Clientes existentes removidos');
    
    // Salvar novos clientes
    for (const client of clientsArray) {
      const clientToSave = {
        ...client,
        // Garantir que visit_days seja string JSON se for array
        visit_days: Array.isArray(client.visit_days) 
          ? JSON.stringify(client.visit_days) 
          : client.visit_days || '[]'
      };
      
      await store.put(clientToSave, client.id);
    }
    
    await tx.done;
    console.log(`✅ ${clientsArray.length} clientes salvos no Web database`);
  }

  async saveProducts(productsArray: any[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    console.log(`💾 Salvando ${productsArray.length} produtos no Web database...`);

    const tx = this.db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');

    // Limpar produtos existentes primeiro
    await store.clear();
    console.log('🗑️ Produtos existentes removidos');

    // Salvar novos produtos
    for (const product of productsArray) {
      await store.put(product, product.id);
    }

    await tx.done;
    console.log(`✅ ${productsArray.length} produtos salvos no Web database`);
  }

  async savePaymentTables(paymentTablesArray: any[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    console.log(`💾 Salvando ${paymentTablesArray.length} tabelas de pagamento no Web database...`);

    const tx = this.db.transaction('payment_tables', 'readwrite');
    const store = tx.objectStore('payment_tables');

    // Limpar tabelas de pagamento existentes primeiro
    await store.clear();
    console.log('🗑️ Tabelas de pagamento existentes removidas');

    // Salvar novas tabelas de pagamento
    for (const paymentTable of paymentTablesArray) {
      await store.put(paymentTable, paymentTable.id);
    }

    await tx.done;
    console.log(`✅ ${paymentTablesArray.length} tabelas de pagamento salvas no Web database`);
  }

  async saveClient(client: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('clients', client, client.id);
  }

  async saveProduct(product: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('products', product, product.id);
  }

  async isClientNegated(clientId: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    const client = await this.db.get('clients', clientId);
    return client?.negated === true;
  }

  async unnegateClient(clientId: string, reason: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const client = await this.db.get('clients', clientId);
    if (client) {
      client.negated = false;
      client.negationReason = reason;
      await this.db.put('clients', client, clientId);
    }
  }

  async getClientStatusHistory(clientId: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    // This is a mock implementation. Replace with actual logic to fetch client status history.
    return Promise.resolve([]);
  }

  async hasClientPendingOrders(clientId: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    const orders = await this.getClientOrders(clientId);
    return orders.some(order => order.sync_status === 'pending_sync');
  }

  async canCreateOrderForClient(clientId: string): Promise<{ canCreate: boolean; reason?: string; existingOrder?: any }> {
    if (!this.db) throw new Error('Database not initialized');

    const client = await this.getClientById(clientId);
    if (!client) {
      return { canCreate: false, reason: 'Cliente não encontrado' };
    }

    if (client.negated) {
      return { canCreate: false, reason: `Cliente negativado. Motivo: ${client.negationReason}` };
    }

    const activeOrder = await this.getActivePendingOrder(clientId);
    if (activeOrder) {
      return { canCreate: false, reason: 'Já existe um pedido pendente para este cliente', existingOrder: activeOrder };
    }

    return { canCreate: true };
  }

  async getActivePendingOrder(clientId: string): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');
    const orders = await this.getClientOrders(clientId);
    return orders.find(order => order.sync_status === 'pending_sync');
  }

  async getCustomers(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    console.log('🌐 Getting customers from Web database...');
    
    const tx = this.db.transaction('clients', 'readonly');
    const store = tx.objectStore('clients');
    const allClients = await store.getAll();
    
    // Processar visit_days para garantir que seja array
    const processedClients = allClients.map(client => {
      let visitDays = client.visit_days;
      
      // Se for string, fazer parse para array
      if (typeof visitDays === 'string') {
        try {
          visitDays = JSON.parse(visitDays);
        } catch (error) {
          console.warn('⚠️ Erro ao fazer parse de visit_days:', error);
          visitDays = [];
        }
      }
      
      return {
        ...client,
        visit_days: Array.isArray(visitDays) ? visitDays : []
      };
    });
    
    console.log(`🌐 Retrieved ${processedClients.length} customers from Web database`);
    return processedClients;
  }

  async getOrderById(orderId: string): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.get('orders', orderId);
  }

  async clearMockData(): Promise<void> {
    console.warn('⚠️ clearMockData não implementado para WebDatabaseService');
  }

  async updateClientStatusAfterOrderDeletion(clientId: string): Promise<void> {
    console.warn('⚠️ updateClientStatusAfterOrderDeletion não implementado para WebDatabaseService');
  }

  async resetAllNegatedClientsStatus(): Promise<void> {
    console.warn('⚠️ resetAllNegatedClientsStatus não implementado para WebDatabaseService');
  }

  async getStorageStats(): Promise<{ clients: number; products: number; orders: number; paymentTables: number }> {
    if (!this.db) {
      return { clients: 0, products: 0, orders: 0, paymentTables: 0 };
    }

    try {
      const [clients, products, orders, paymentTables] = await Promise.all([
        this.db.count('clients'),
        this.db.count('products'),
        this.db.count('orders'),
        this.db.count('payment_tables')
      ]);

      return { clients, products, orders, paymentTables };
    } catch (error) {
      console.error('❌ Error getting storage stats:', error);
      return { clients: 0, products: 0, orders: 0, paymentTables: 0 };
    }
  }

  async forceClearCache(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    console.log('🗑️ Forçando limpeza completa do cache Web database...');
    
    const tx = this.db.transaction(['clients', 'products', 'payment_tables'], 'readwrite');
    
    await Promise.all([
      tx.objectStore('clients').clear(),
      tx.objectStore('products').clear(),
      tx.objectStore('payment_tables').clear()
    ]);
    
    await tx.done;
    console.log('✅ Cache Web database limpo completamente');
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    console.log('🗑️ Limpando TODOS os dados do Web database...');
    
    const tx = this.db.transaction(['clients', 'products', 'orders', 'payment_tables', 'sync_log'], 'readwrite');
    
    await Promise.all([
      tx.objectStore('clients').clear(),
      tx.objectStore('products').clear(),
      tx.objectStore('orders').clear(),
      tx.objectStore('payment_tables').clear(),
      tx.objectStore('sync_log').clear()
    ]);
    
    await tx.done;
    console.log('✅ Todos os dados limpos do Web database');
  }
}

export default WebDatabaseService;
