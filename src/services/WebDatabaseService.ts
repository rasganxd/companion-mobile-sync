import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { SalesAppDBSchema, ValidTableName, isValidTableName, DatabaseInstance } from './database/types';

class WebDatabaseService implements DatabaseAdapter {
  private static instance: WebDatabaseService | null = null;
  private db: DatabaseInstance | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): WebDatabaseService {
    if (!WebDatabaseService.instance) {
      WebDatabaseService.instance = new WebDatabaseService();
    }
    return WebDatabaseService.instance;
  }

  async initDatabase(): Promise<void> {
    if (this.isInitialized && this.db) {
      console.log('🌐 Web database already initialized');
      return;
    }

    try {
      console.log('🌐 Initializing Web IndexedDB database...');
      
      this.db = await openDB<SalesAppDBSchema>('sales-app-db', 2, {
        upgrade(db, oldVersion) {
          console.log('🔧 Creating/updating database schema...');
          
          // Create clients table
          if (!db.objectStoreNames.contains('clients')) {
            db.createObjectStore('clients', { keyPath: 'id' });
          }
          
          // Create visit_routes table
          if (!db.objectStoreNames.contains('visit_routes')) {
            db.createObjectStore('visit_routes', { keyPath: 'id' });
          }
          
          // Create orders table with customer_id index
          if (!db.objectStoreNames.contains('orders')) {
            const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
            orderStore.createIndex('customer_id', 'customer_id');
          }
          
          // Create products table
          if (!db.objectStoreNames.contains('products')) {
            db.createObjectStore('products', { keyPath: 'id' });
          }
          
          // Create payment_tables table (NEW)
          if (!db.objectStoreNames.contains('payment_tables')) {
            db.createObjectStore('payment_tables', { keyPath: 'id' });
            console.log('✅ Criada tabela payment_tables no IndexedDB');
          }
          
          // Create sync_log table
          if (!db.objectStoreNames.contains('sync_log')) {
            db.createObjectStore('sync_log', { keyPath: 'id' });
          }
        },
      });

      this.isInitialized = true;
      console.log('✅ Web database initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Web database:', error);
      throw error;
    }
  }

  async getClients(): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('🌐 Getting clients from Web database...');
      return await this.db!.getAll('clients');
    } catch (error) {
      console.error('❌ Error getting clients:', error);
      return [];
    }
  }

  async getVisitRoutes(): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('🌐 Getting visit routes from Web database...');
      return await this.db!.getAll('visit_routes');
    } catch (error) {
      console.error('❌ Error getting visit routes:', error);
      return [];
    }
  }

  async getOrders(clientId?: string): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`🌐 Getting orders from Web database for client ID: ${clientId}`);
      if (clientId) {
        const index = this.db!.transaction('orders').store.index('customer_id');
        return await index.getAll(clientId);
      } else {
        return await this.db!.getAll('orders');
      }
    } catch (error) {
      console.error('❌ Error getting orders:', error);
      return [];
    }
  }

  async getProducts(): Promise<any[]> {
    console.log('🔍 WebDatabaseService - Getting products from IndexedDB');
    
    try {
      const tx = this.db!.transaction(['products', 'product_categories', 'product_groups', 'product_brands'], 'readonly');
      const productStore = tx.objectStore('products');
      const categoryStore = tx.objectStore('product_categories');
      const groupStore = tx.objectStore('product_groups');
      const brandStore = tx.objectStore('product_brands');
      
      const products = await productStore.getAll();
      const categories = await categoryStore.getAll();
      const groups = await groupStore.getAll();
      const brands = await brandStore.getAll();
      
      // Create lookup maps
      const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));
      const groupMap = new Map(groups.map(group => [group.id, group.name]));
      const brandMap = new Map(brands.map(brand => [brand.id, brand.name]));
      
      // Enrich products with category, group, and brand names
      const enrichedProducts = products.map(product => ({
        ...product,
        category_name: product.category_id ? categoryMap.get(product.category_id) : null,
        group_name: product.group_id ? groupMap.get(product.group_id) : null,
        brand_name: product.brand_id ? brandMap.get(product.brand_id) : null
      }));
      
      console.log('📦 WebDatabaseService - Products loaded with categories/groups:', enrichedProducts.length);
      return enrichedProducts;
    } catch (error) {
      console.error('❌ Error getting products from IndexedDB:', error);
      return [];
    }
  }

  async getPendingSyncItems(table: string): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    if (!isValidTableName(table)) {
      console.error(`❌ Invalid table name: ${table}`);
      return [];
    }

    try {
      console.log(`🌐 Getting pending sync items from ${table}...`);
      const items = await this.db!.getAll(table);
      return items.filter(item => item.sync_status === 'pending_sync');
    } catch (error) {
      console.error(`❌ Error getting pending sync items from ${table}:`, error);
      return [];
    }
  }

  async updateSyncStatus(table: string, id: string, status: 'synced' | 'pending_sync' | 'error' | 'transmitted' | 'deleted'): Promise<void> {
    if (!this.db) await this.initDatabase();

    if (!isValidTableName(table)) {
      console.error(`❌ Invalid table name: ${table}`);
      return;
    }

    try {
      console.log(`🌐 Updating sync status for ${table} with ID ${id} to ${status}...`);
      const item = await this.db!.get(table, id);
      if (item) {
        item.sync_status = status;
        await this.db!.put(table, item);
        console.log(`✅ Sync status updated for ${table} with ID ${id} to ${status}`);
      } else {
        console.warn(`⚠️ Item with ID ${id} not found in ${table}`);
      }
    } catch (error) {
      console.error(`❌ Error updating sync status for ${table} with ID ${id}:`, error);
    }
  }

  async logSync(type: string, status: string, details?: string): Promise<void> {
    if (!this.db) await this.initDatabase();

    try {
      const logEntry = {
        id: new Date().toISOString(),
        type,
        status,
        details,
        timestamp: new Date().toISOString()
      };
      console.log('Logging sync event:', logEntry);
      await this.db!.put('sync_log', logEntry);
      console.log('✅ Sync event logged');
    } catch (error) {
      console.error('❌ Error logging sync event:', error);
    }
  }

  async saveOrder(order: any): Promise<void> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('🌐 Saving order to Web database:', order);
      await this.db!.put('orders', order);
      console.log('✅ Order saved to Web database');
    } catch (error) {
      console.error('❌ Error saving order:', error);
    }
  }

  async updateClientStatus(clientId: string, status: string): Promise<void> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`🌐 [DEBUG] Atualizando status do cliente ${clientId} para ${status}...`);
      
      // Primeiro verificar se o cliente existe
      const clientBefore = await this.getClientById(clientId);
      console.log(`🌐 [DEBUG] Cliente antes da atualização:`, clientBefore);
      
      if (clientBefore) {
        clientBefore.status = status;
        clientBefore.updated_at = new Date().toISOString();
        await this.db!.put('clients', clientBefore);
        
        // Verificar se a atualização foi persistida
        const clientAfter = await this.getClientById(clientId);
        console.log(`🌐 [DEBUG] Cliente após a atualização:`, clientAfter);
        
        if (clientAfter?.status !== status) {
          console.error(`❌ [DEBUG] Status não foi persistido! Esperado: ${status}, Atual: ${clientAfter?.status}`);
        } else {
          console.log(`✅ [DEBUG] Cliente status atualizado para ${clientId} -> ${status}`);
        }
      } else {
        console.warn(`⚠️ [DEBUG] Cliente com ID ${clientId} não encontrado`);
      }
    } catch (error) {
      console.error(`❌ [DEBUG] Erro ao atualizar status do cliente ${clientId}:`, error);
    }
  }

  async getClientById(clientId: string): Promise<any | null> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`🌐 Getting client by ID: ${clientId}`);
      const client = await this.db!.get('clients', clientId);
      if (client) {
        console.log('✅ Client found:', client);
        return client;
      } else {
        console.log('❌ Client not found');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting client by ID:', error);
      return null;
    }
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
      console.log('🌐 Web database closed');
    }
  }

  async getPendingOrders(): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('🌐 Getting pending orders from Web database...');
      const orders = await this.db!.getAll('orders');
      return orders.filter(order => order.sync_status === 'pending_sync');
    } catch (error) {
      console.error('❌ Error getting pending orders:', error);
      return [];
    }
  }

  async markOrderAsTransmitted(orderId: string): Promise<void> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`🌐 Marking order ${orderId} as transmitted...`);
      const order = await this.db!.get('orders', orderId);
      if (order) {
        order.sync_status = 'transmitted';
        await this.db!.put('orders', order);
        console.log(`✅ Order ${orderId} marked as transmitted`);
      } else {
        console.warn(`⚠️ Order with ID ${orderId} not found`);
      }
    } catch (error) {
      console.error(`❌ Error marking order ${orderId} as transmitted:`, error);
    }
  }

  async getOfflineOrdersCount(): Promise<number> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('🌐 Getting offline orders count from Web database...');
      const orders = await this.db!.getAll('orders');
      const offlineOrders = orders.filter(order => order.sync_status === 'pending_sync' || order.sync_status === 'error');
      return offlineOrders.length;
    } catch (error) {
      console.error('❌ Error getting offline orders count:', error);
      return 0;
    }
  }

  async getClientOrders(clientId: string): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`🌐 Getting orders for client ID: ${clientId}`);
      const index = this.db!.transaction('orders').store.index('customer_id');
      return await index.getAll(clientId);
    } catch (error) {
      console.error('❌ Error getting client orders:', error);
      return [];
    }
  }

  async deleteOrder(orderId: string): Promise<void> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`🌐 Deleting order with ID: ${orderId}`);
      await this.db!.delete('orders', orderId);
      console.log(`✅ Order with ID ${orderId} deleted`);
    } catch (error) {
      console.error(`❌ Error deleting order with ID ${orderId}:`, error);
    }
  }

  async getTransmittedOrders(): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('🌐 Getting transmitted orders from Web database...');
      const orders = await this.db!.getAll('orders');
      return orders.filter(order => order.sync_status === 'transmitted');
    } catch (error) {
      console.error('❌ Error getting transmitted orders:', error);
      return [];
    }
  }

  async getAllOrders(): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('🌐 Getting all orders from Web database...');
      return await this.db!.getAll('orders');
    } catch (error) {
      console.error('❌ Error getting all orders:', error);
      return [];
    }
  }

  async saveMobileOrder(order: any): Promise<void> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('🌐 Saving mobile order to Web database:', order);
      await this.db!.put('orders', order);
      console.log('✅ Mobile order saved to Web database');
    } catch (error) {
      console.error('❌ Error saving mobile order:', error);
    }
  }

  async saveClients(clientsArray: any[]): Promise<void> {
    if (!this.db) await this.initDatabase();
    
    const tx = this.db!.transaction('clients', 'readwrite');
    const store = tx.objectStore('clients');
    
    for (const client of clientsArray) {
      await store.put(client);
    }
    
    await tx.done;
    console.log(`✅ Saved ${clientsArray.length} clients to Web database`);
  }

  async saveProducts(productsArray: any[]): Promise<void> {
    if (!this.db) await this.initDatabase();
    
    const tx = this.db!.transaction('products', 'readwrite');
    const store = tx.objectStore('products');
    
    for (const product of productsArray) {
      await store.put(product);
    }
    
    await tx.done;
    console.log(`✅ Saved ${productsArray.length} products to Web database`);
  }

  async saveClient(client: any): Promise<void> {
    if (!this.db) await this.initDatabase();
    
    const tx = this.db!.transaction('clients', 'readwrite');
    await tx.objectStore('clients').put(client);
    await tx.done;
  }

  async saveProduct(product: any): Promise<void> {
    if (!this.db) await this.initDatabase();
    
    const tx = this.db!.transaction('products', 'readwrite');
    await tx.objectStore('products').put(product);
    await tx.done;
  }

  async isClientNegated(clientId: string): Promise<boolean> {
    if (!this.db) await this.initDatabase();

    try {
      const client = await this.getClientById(clientId);
      if (client && client.status === 'negativado') {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking if client is negated:', error);
      return false;
    }
  }

  async unnegateClient(clientId: string, reason: string): Promise<void> {
     if (!this.db) await this.initDatabase();

    try {
      console.log(`🌐 Unnegating client with ID: ${clientId}, reason: ${reason}`);
      const client = await this.getClientById(clientId);
      if (client) {
        client.status = 'ativo';
        await this.db!.put('clients', client);
        console.log(`✅ Client with ID ${clientId} unnegated`);
      } else {
        console.warn(`⚠️ Client with ID ${clientId} not found`);
      }
    } catch (error) {
      console.error(`❌ Error unnegating client with ID ${clientId}:`, error);
    }
  }

  async getClientStatusHistory(clientId: string): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`🌐 Getting client status history for client ID: ${clientId}`);
      // Since IndexedDB doesn't support complex queries, we'll just return a mock history for now
      return [
        { status: 'ativo', date: new Date().toISOString(), reason: 'Initial status' }
      ];
    } catch (error) {
      console.error('❌ Error getting client status history:', error);
      return [];
    }
  }

  async hasClientPendingOrders(clientId: string): Promise<boolean> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`🌐 Checking if client ${clientId} has pending orders...`);
      const orders = await this.getClientOrders(clientId);
      const pendingOrders = orders.filter(order => order.status === 'pending');
      return pendingOrders.length > 0;
    } catch (error) {
      console.error('❌ Error checking for pending orders:', error);
      return false;
    }
  }

  async canCreateOrderForClient(clientId: string): Promise<{ canCreate: boolean; reason?: string; existingOrder?: any }> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`🌐 Checking if can create order for client ${clientId}...`);

      const client = await this.getClientById(clientId);
      if (!client) {
        return { canCreate: false, reason: 'Cliente não encontrado' };
      }

      if (client.status === 'negativado') {
        return { canCreate: false, reason: 'Cliente negativado' };
      }

      const activePendingOrder = await this.getActivePendingOrder(clientId);
      if (activePendingOrder) {
        return { canCreate: false, reason: 'Já existe um pedido pendente para este cliente', existingOrder: activePendingOrder };
      }

      return { canCreate: true };
    } catch (error) {
      console.error('❌ Error checking if can create order:', error);
      return { canCreate: false, reason: 'Erro ao verificar elegibilidade' };
    }
  }

  async getActivePendingOrder(clientId: string): Promise<any | null> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`🌐 Getting active pending order for client ${clientId}...`);
      const orders = await this.getClientOrders(clientId);
      const pendingOrder = orders.find(order => order.status === 'pending');
      return pendingOrder || null;
    } catch (error) {
      console.error('❌ Error getting active pending order:', error);
      return null;
    }
  }

  async getCustomers(): Promise<any[]> {
    return this.getClients();
  }

  async getPaymentTables(): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('🌐 Getting payment tables from Web database...');
      const paymentTables = await this.db!.getAll('payment_tables');
      console.log(`💳 Encontradas ${paymentTables.length} tabelas de pagamento no banco local`);
      
      // Log das tabelas encontradas
      paymentTables.forEach((table, index) => {
        console.log(`💳 Tabela ${index + 1}:`, {
          id: table.id,
          name: table.name,
          type: table.type,
          active: table.active
        });
      });
      
      return paymentTables;
    } catch (error) {
      console.error('❌ Error getting payment tables:', error);
      return [];
    }
  }

  async savePaymentTables(paymentTablesArray: any[]): Promise<void> {
    if (!this.db) await this.initDatabase();
    
    try {
      console.log(`💳 Salvando ${paymentTablesArray.length} tabelas de pagamento no Web database...`);
      
      // Limpar tabelas existentes antes de salvar novas
      const tx = this.db!.transaction('payment_tables', 'readwrite');
      const store = tx.objectStore('payment_tables');
      await store.clear();
      
      // Salvar novas tabelas
      for (const paymentTable of paymentTablesArray) {
        await store.put(paymentTable);
        console.log(`💳 Tabela salva: ${paymentTable.name} (${paymentTable.id})`);
      }
      
      await tx.done;
      console.log(`✅ Saved ${paymentTablesArray.length} payment tables to Web database`);
    } catch (error) {
      console.error('❌ Error saving payment tables:', error);
      throw error;
    }
  }

  async getOrderById(orderId: string): Promise<any | null> {
    if (!this.db) await this.initDatabase();
    
    try {
      console.log(`🔍 Getting order by ID: ${orderId}`);
      const order = await this.db!.get('orders', orderId);
      
      if (order) {
        console.log('✅ Order found:', order);
        return order;
      } else {
        console.log('❌ Order not found');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting order by ID:', error);
      return null;
    }
  }

  async clearMockData(): Promise<void> {
    if (!this.db) await this.initDatabase();
    
    console.log('🧹 Clearing mock data from Web database...');
    
    const tx = this.db!.transaction(['clients', 'visit_routes', 'orders', 'products', 'payment_tables'], 'readwrite');
    
    await Promise.all([
      tx.objectStore('clients').clear(),
      tx.objectStore('visit_routes').clear(),
      tx.objectStore('orders').clear(),
      tx.objectStore('products').clear(),
      tx.objectStore('payment_tables').clear()
    ]);
    
    await tx.done;
    console.log('✅ Mock data cleared from Web database');
  }
}

export default WebDatabaseService;
