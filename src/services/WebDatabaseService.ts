
import DatabaseAdapter from './DatabaseAdapter';
import { DatabaseInitializer } from './database/DatabaseInitializer';
import { MockDataCleaner } from './database/MockDataCleaner';
import { DatabaseInstance, ValidTableName, isValidTableName } from './database/types';

class WebDatabaseService implements DatabaseAdapter {
  private static instance: WebDatabaseService;
  private db: DatabaseInstance | null = null;
  private isInitializing = false;
  private mockDataCleaner: MockDataCleaner | null = null;

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
      // Wait for ongoing initialization
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
      this.db = await DatabaseInitializer.initialize();
      this.mockDataCleaner = new MockDataCleaner(this.db);
      
      // Automatically clean mock data after initialization
      await this.forceClearMockData();
      
    } catch (error) {
      console.error('❌ Error initializing database:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  async forceClearMockData(): Promise<void> {
    await this.ensureInitialized();
    if (this.mockDataCleaner) {
      await this.mockDataCleaner.cleanMockData();
    }
  }

  // Nova função para limpeza completa de produtos
  async forceCleanAllProducts(): Promise<void> {
    await this.ensureInitialized();
    if (this.mockDataCleaner) {
      await this.mockDataCleaner.forceCleanAllProducts();
    }
  }

  async clearMockData(): Promise<void> {
    return this.forceClearMockData();
  }

  async getClients(): Promise<any[]> {
    await this.ensureInitialized();
    const allClients = await this.db!.getAll('clients');
    
    if (!this.mockDataCleaner) return allClients;
    
    const uniqueClients = this.mockDataCleaner.filterRealClients(allClients);
    
    console.log('📊 Total de clientes no banco:', allClients.length);
    console.log('📊 Clientes reais únicos retornados:', uniqueClients.length);
    
    return uniqueClients;
  }

  async getCustomers(): Promise<any[]> {
    return this.getClients();
  }

  async getPaymentTables(): Promise<any[]> {
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
    
    console.log(`🔍 Total de produtos no IndexedDB: ${allProducts.length}`);
    
    if (!this.mockDataCleaner) return allProducts;
    
    const uniqueProducts = this.mockDataCleaner.filterRealProducts(allProducts);
    
    console.log(`📊 Produtos reais únicos retornados: ${uniqueProducts.length}`);
    
    // Log detalhado dos produtos para debug
    uniqueProducts.forEach((product, index) => {
      console.log(`📦 Produto ${index + 1}:`, {
        id: product.id,
        name: product.name,
        code: product.code,
        sale_price: product.sale_price,
        stock: product.stock
      });
    });
    
    // Ensure products have correct price mapping
    const normalizedProducts = uniqueProducts.map(product => ({
      ...product,
      // Ensure price field exists for compatibility
      price: product.sale_price || product.price || 0
    }));
    
    return normalizedProducts;
  }

  async saveProduct(product: any): Promise<void> {
    await this.ensureInitialized();
    if (this.mockDataCleaner) {
      // Normalize product data before saving
      const normalizedProduct = {
        ...product,
        // Ensure both price and sale_price are available
        price: product.sale_price || product.price || 0,
        sale_price: product.sale_price || product.price || 0,
        cost_price: product.cost_price || product.cost || 0,
        // Ensure unit information is preserved
        unit: product.unit || 'UN',
        has_subunit: product.has_subunit || false,
        subunit: product.subunit || null,
        subunit_ratio: product.subunit_ratio || 1
      };
      
      console.log('💾 Salvando produto normalizado:', normalizedProduct);
      await this.mockDataCleaner.saveRealProduct(normalizedProduct);
    }
  }

  async saveProducts(productsArray: any[]): Promise<void> {
    await this.ensureInitialized();
    
    console.log(`💾 Iniciando salvamento de ${productsArray.length} produtos do Supabase`);
    
    // PRIMEIRO: Limpar completamente os produtos existentes
    await this.forceCleanAllProducts();
    
    if (this.mockDataCleaner) {
      // Normalize all products before saving
      const normalizedProducts = productsArray.map(product => ({
        ...product,
        // Ensure both price and sale_price are available
        price: product.sale_price || product.price || 0,
        sale_price: product.sale_price || product.price || 0,
        cost_price: product.cost_price || product.cost || 0,
        // Ensure unit information is preserved
        unit: product.unit || 'UN',
        has_subunit: product.has_subunit || false,
        subunit: product.subunit || null,
        subunit_ratio: product.subunit_ratio || 1
      }));
      
      console.log('💾 Salvando produtos normalizados em lote após limpeza completa:', normalizedProducts.length);
      await this.mockDataCleaner.saveRealProducts(normalizedProducts);
    }
  }

  async getPendingSyncItems(tableName: string): Promise<any[]> {
    await this.ensureInitialized();
    
    if (!isValidTableName(tableName)) {
      console.warn(`⚠️ Table ${tableName} does not exist`);
      return [];
    }
    
    const items = await this.db!.getAll(tableName);
    return items.filter(item => item.sync_status === 'pending_sync');
  }

  async updateSyncStatus(tableName: string, id: string, status: 'synced' | 'pending_sync' | 'error' | 'transmitted' | 'deleted'): Promise<void> {
    await this.ensureInitialized();
    
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

  // Batch save methods using MockDataCleaner
  async saveClients(clientsArray: any[]): Promise<void> {
    await this.ensureInitialized();
    if (this.mockDataCleaner) {
      await this.mockDataCleaner.saveRealClients(clientsArray);
    }
  }

  async saveClient(client: any): Promise<void> {
    await this.ensureInitialized();
    if (this.mockDataCleaner) {
      await this.mockDataCleaner.saveRealClient(client);
    }
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
