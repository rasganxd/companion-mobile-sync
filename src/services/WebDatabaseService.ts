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

// Valid table names for the schema - explicitly define to avoid issues with indexes
type ValidTableName = 'clients' | 'visit_routes' | 'orders' | 'products' | 'sync_log';

// Type guard to check if a string is a valid table name
function isValidTableName(tableName: string): tableName is ValidTableName {
  const validTables: ValidTableName[] = ['clients', 'visit_routes', 'orders', 'products', 'sync_log'];
  return validTables.includes(tableName as ValidTableName);
}

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
      
      // Automaticamente limpar dados mock após inicialização
      await this.forceClearMockData();
      
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing database:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  private isMockClient(client: any): boolean {
    if (!client) return false;
    
    const mockPatterns = [
      'Mykaela',
      'Cliente Principal',
      'Empresa Mykaela',
      'Mock',
      'Test',
      'Teste'
    ];
    
    const clientName = client.name?.toLowerCase() || '';
    const companyName = client.company_name?.toLowerCase() || '';
    
    return mockPatterns.some(pattern => 
      clientName.includes(pattern.toLowerCase()) || 
      companyName.includes(pattern.toLowerCase())
    );
  }

  private isMockProduct(product: any): boolean {
    if (!product) return false;
    
    const mockPatterns = [
      'Produto Premium',
      'Produto Standard', 
      'Premium A',
      'Standard B',
      'Mock',
      'Test',
      'Teste'
    ];
    
    const productName = product.name?.toLowerCase() || '';
    
    return mockPatterns.some(pattern => 
      productName.includes(pattern.toLowerCase())
    );
  }

  async forceClearMockData(): Promise<void> {
    await this.ensureInitialized();
    
    try {
      console.log('🗑️ Forçando limpeza de dados mock do IndexedDB...');
      
      const tx = this.db!.transaction(['clients', 'products'], 'readwrite');
      
      // Limpar clientes mock
      const clientStore = tx.objectStore('clients');
      const allClients = await clientStore.getAll();
      let removedClientsCount = 0;
      
      for (const client of allClients) {
        if (this.isMockClient(client)) {
          await clientStore.delete(client.id);
          removedClientsCount++;
          console.log('🗑️ Cliente mock removido:', client.name || client.company_name);
        }
      }
      
      // Limpar produtos mock
      const productStore = tx.objectStore('products');
      const allProducts = await productStore.getAll();
      let removedProductsCount = 0;
      
      for (const product of allProducts) {
        if (this.isMockProduct(product)) {
          await productStore.delete(product.id);
          removedProductsCount++;
          console.log('🗑️ Produto mock removido:', product.name);
        }
      }
      
      await tx.done;
      
      console.log(`✅ Limpeza forçada concluída: ${removedClientsCount} clientes e ${removedProductsCount} produtos mock removidos`);
      
    } catch (error) {
      console.error('❌ Erro ao forçar limpeza de dados mock:', error);
    }
  }

  async clearMockData(): Promise<void> {
    return this.forceClearMockData();
  }

  async getClients(): Promise<any[]> {
    await this.ensureInitialized();
    const allClients = await this.db!.getAll('clients');
    
    // Filtrar dados mock e remover duplicatas baseadas no ID
    const realClients = allClients.filter(client => !this.isMockClient(client));
    
    const uniqueClients = realClients.reduce((acc: any[], current: any) => {
      const existingClient = acc.find(client => client.id === current.id);
      if (!existingClient) {
        acc.push(current);
      } else {
        console.log('🔍 Cliente duplicado removido:', current);
      }
      return acc;
    }, []);
    
    console.log('📊 Total de clientes no banco:', allClients.length);
    console.log('📊 Clientes reais únicos retornados:', uniqueClients.length);
    
    return uniqueClients;
  }

  async getCustomers(): Promise<any[]> {
    // Alias for getClients to match the interface
    return this.getClients();
  }

  async getPaymentTables(): Promise<any[]> {
    // Return default payment tables for web version
    return [
      { id: '1', name: 'À Vista', description: 'Pagamento à vista' },
      { id: '2', name: 'Prazo 30', description: 'Pagamento em 30 dias' },
      { id: '3', name: 'Prazo 60', description: 'Pagamento em 60 dias' },
      { id: '4', name: 'Prazo 90', description: 'Pagamento em 90 dias' }
    ];
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
    const allProducts = await this.db!.getAll('products');
    
    // Filtrar dados mock e remover duplicatas baseadas no ID
    const realProducts = allProducts.filter(product => !this.isMockProduct(product));
    
    const uniqueProducts = realProducts.reduce((acc: any[], current: any) => {
      const existingProduct = acc.find(product => product.id === current.id);
      if (!existingProduct) {
        acc.push(current);
      } else {
        console.log('🔍 Produto duplicado removido:', current);
      }
      return acc;
    }, []);
    
    console.log('📊 Total de produtos no banco:', allProducts.length);
    console.log('📊 Produtos reais únicos retornados:', uniqueProducts.length);
    
    return uniqueProducts;
  }

  async getPendingSyncItems(tableName: string): Promise<any[]> {
    await this.ensureInitialized();
    
    // Verificar se a tabela existe na lista de tabelas válidas
    if (!isValidTableName(tableName)) {
      console.warn(`⚠️ Table ${tableName} does not exist`);
      return [];
    }
    
    const items = await this.db!.getAll(tableName);
    return items.filter(item => item.sync_status === 'pending_sync');
  }

  async updateSyncStatus(tableName: string, id: string, status: 'synced' | 'pending_sync' | 'error' | 'transmitted' | 'deleted'): Promise<void> {
    await this.ensureInitialized();
    
    // Verificar se a tabela existe na lista de tabelas válidas
    if (!isValidTableName(tableName)) {
      console.warn(`⚠️ Table ${tableName} does not exist`);
      return;
    }
    
    const item = await this.db!.get(tableName, id);
    if (item) {
      item.sync_status = status;
      await this.db!.put(tableName, item);
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
    
    // Filtrar apenas dados reais antes de salvar
    const realClients = clientsArray.filter(client => !this.isMockClient(client));
    
    if (realClients.length === 0) {
      console.log('ℹ️ Nenhum cliente real para salvar');
      return;
    }
    
    const tx = this.db!.transaction('clients', 'readwrite');
    realClients.forEach(client => {
      tx.store.put(client);
    });
    await tx.done;
    console.log(`✅ Saved ${realClients.length} real clients in batch (filtered from ${clientsArray.length} total)`);
  }

  async saveProducts(productsArray: any[]): Promise<void> {
    await this.ensureInitialized();
    
    // Filtrar apenas dados reais antes de salvar
    const realProducts = productsArray.filter(product => !this.isMockProduct(product));
    
    if (realProducts.length === 0) {
      console.log('ℹ️ Nenhum produto real para salvar');
      return;
    }
    
    const tx = this.db!.transaction('products', 'readwrite');
    realProducts.forEach(product => {
      tx.store.put(product);
    });
    await tx.done;
    console.log(`✅ Saved ${realProducts.length} real products in batch (filtered from ${productsArray.length} total)`);
  }

  async saveClient(client: any): Promise<void> {
    await this.ensureInitialized();
    
    if (this.isMockClient(client)) {
      console.log('🚫 Cliente mock rejeitado:', client.name || client.company_name);
      return;
    }
    
    await this.db!.put('clients', client);
    console.log('✅ Real client saved:', client);
  }

  async saveProduct(product: any): Promise<void> {
    await this.ensureInitialized();
    
    if (this.isMockProduct(product)) {
      console.log('🚫 Produto mock rejeitado:', product.name);
      return;
    }
    
    await this.db!.put('products', product);
    console.log('✅ Real product saved:', product);
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
