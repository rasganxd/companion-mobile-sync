
import { v4 as uuidv4 } from 'uuid';

class WebDatabaseService {
  private static instance: WebDatabaseService;
  private dbName = 'vendas_fortes_db';

  private constructor() {
    console.log('🌐 WebDatabaseService constructor called');
  }

  static getInstance(): WebDatabaseService {
    if (!WebDatabaseService.instance) {
      WebDatabaseService.instance = new WebDatabaseService();
    }
    return WebDatabaseService.instance;
  }

  async initDatabase(): Promise<void> {
    console.log('🌐 Initializing Web database...');
    // Initialize localStorage structure if needed
    this.ensureStorageStructure();
    console.log('✅ Web database initialized successfully');
  }

  private ensureStorageStructure(): void {
    const tables = ['clients', 'orders', 'products', 'visit_routes', 'sync_log'];
    
    tables.forEach(table => {
      if (!localStorage.getItem(table)) {
        localStorage.setItem(table, JSON.stringify([]));
      }
    });
  }

  private getTableData(tableName: string): any[] {
    try {
      const data = localStorage.getItem(tableName);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error getting ${tableName} data:`, error);
      return [];
    }
  }

  private setTableData(tableName: string, data: any[]): void {
    try {
      localStorage.setItem(tableName, JSON.stringify(data));
    } catch (error) {
      console.error(`Error setting ${tableName} data:`, error);
    }
  }

  async getClients(): Promise<any[]> {
    return this.getTableData('clients');
  }

  async getVisitRoutes(): Promise<any[]> {
    return this.getTableData('visit_routes');
  }

  async getOrders(clientId?: string): Promise<any[]> {
    const orders = this.getTableData('orders');
    if (clientId) {
      return orders.filter(order => order.customer_id === clientId);
    }
    return orders;
  }

  async getProducts(): Promise<any[]> {
    return this.getTableData('products');
  }

  // ✅ NOVO: Método para salvar clientes no localStorage
  async saveClient(client: any): Promise<void> {
    const clients = this.getTableData('clients');
    const existingIndex = clients.findIndex(c => c.id === client.id);
    
    if (existingIndex >= 0) {
      clients[existingIndex] = { ...client, updated_at: new Date().toISOString() };
      console.log(`📝 Updated existing client: ${client.name} (${client.id})`);
    } else {
      clients.push({ ...client, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      console.log(`📝 Added new client: ${client.name} (${client.id})`);
    }
    
    this.setTableData('clients', clients);
  }

  // ✅ NOVO: Método para salvar múltiplos clientes
  async saveClients(clientsArray: any[]): Promise<void> {
    console.log(`💾 Saving ${clientsArray.length} clients to localStorage`);
    
    const existingClients = this.getTableData('clients');
    const clientsMap = new Map(existingClients.map(c => [c.id, c]));
    
    // Adicionar ou atualizar clientes
    clientsArray.forEach(client => {
      clientsMap.set(client.id, {
        ...client,
        updated_at: new Date().toISOString()
      });
    });
    
    const updatedClients = Array.from(clientsMap.values());
    this.setTableData('clients', updatedClients);
    
    console.log(`✅ Successfully saved ${clientsArray.length} clients`);
  }

  // ✅ NOVO: Método para salvar produto no localStorage
  async saveProduct(product: any): Promise<void> {
    const products = this.getTableData('products');
    const existingIndex = products.findIndex(p => p.id === product.id);
    
    if (existingIndex >= 0) {
      products[existingIndex] = { ...product, updated_at: new Date().toISOString() };
      console.log(`📝 Updated existing product: ${product.name} (${product.id})`);
    } else {
      products.push({ ...product, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      console.log(`📝 Added new product: ${product.name} (${product.id})`);
    }
    
    this.setTableData('products', products);
  }

  // ✅ NOVO: Método para salvar múltiplos produtos
  async saveProducts(productsArray: any[]): Promise<void> {
    console.log(`💾 Saving ${productsArray.length} products to localStorage`);
    
    const existingProducts = this.getTableData('products');
    const productsMap = new Map(existingProducts.map(p => [p.id, p]));
    
    // Adicionar ou atualizar produtos
    productsArray.forEach(product => {
      productsMap.set(product.id, {
        ...product,
        updated_at: new Date().toISOString()
      });
    });
    
    const updatedProducts = Array.from(productsMap.values());
    this.setTableData('products', updatedProducts);
    
    console.log(`✅ Successfully saved ${productsArray.length} products`);
  }

  async getPendingSyncItems(table: string): Promise<any[]> {
    const data = this.getTableData(table);
    const pendingItems = data.filter(item => item.sync_status === 'pending_sync');
    
    console.log(`📋 [${table}] Total items: ${data.length}, Pending sync: ${pendingItems.length}`);
    console.log(`📋 [${table}] Sync statuses found:`, [...new Set(data.map(item => item.sync_status))]);
    
    return pendingItems;
  }

  async updateSyncStatus(table: string, id: string, status: 'synced' | 'pending_sync' | 'error' | 'transmitted' | 'deleted'): Promise<void> {
    const data = this.getTableData(table);
    const itemIndex = data.findIndex(item => item.id === id);
    
    if (itemIndex >= 0) {
      const oldStatus = data[itemIndex].sync_status;
      data[itemIndex].sync_status = status;
      data[itemIndex].updated_at = new Date().toISOString();
      this.setTableData(table, data);
      
      console.log(`🔄 [${table}] Updated sync status for ${id}: ${oldStatus} → ${status}`);
    } else {
      console.error(`❌ [${table}] Item not found for sync status update: ${id}`);
    }
  }

  async logSync(type: string, status: string, details?: string): Promise<void> {
    const logs = this.getTableData('sync_log');
    const newLog = {
      id: uuidv4(),
      sync_type: type,
      sync_date: new Date().toISOString(),
      status,
      details: details || ''
    };
    
    logs.push(newLog);
    this.setTableData('sync_log', logs);
  }

  async saveOrder(order: any): Promise<void> {
    const orders = this.getTableData('orders');
    const now = new Date().toISOString();
    
    // 🎯 CORREÇÃO: Garantir que novos pedidos sempre tenham sync_status correto
    const orderToSave = {
      ...order,
      id: order.id || uuidv4(),
      created_at: now,
      updated_at: now,
      sync_status: order.sync_status || 'pending_sync' // ✅ Forçar pending_sync se não especificado
    };
    
    // Check if order already exists (for updates)
    const existingIndex = orders.findIndex(o => o.id === orderToSave.id);
    
    if (existingIndex >= 0) {
      console.log(`📝 Updating existing order ${orderToSave.id} with sync_status: ${orderToSave.sync_status}`);
      orders[existingIndex] = orderToSave;
    } else {
      console.log(`📝 Creating new order ${orderToSave.id} with sync_status: ${orderToSave.sync_status}`);
      orders.push(orderToSave);
    }
    
    this.setTableData('orders', orders);
    console.log('💾 Order saved to localStorage:', {
      id: orderToSave.id,
      customer_name: orderToSave.customer_name,
      sync_status: orderToSave.sync_status,
      total: orderToSave.total
    });
  }

  async saveMobileOrder(order: any): Promise<void> {
    console.log('🌐 Web: saveMobileOrder called - delegating to saveOrder');
    // Para WebDatabase, reutilizamos o método saveOrder existente
    await this.saveOrder({
      ...order,
      source_project: 'mobile',
      sync_status: 'pending_sync'
    });
  }

  async updateClientStatus(clientId: string, status: string): Promise<void> {
    const clients = this.getTableData('clients');
    const clientIndex = clients.findIndex(client => client.id === clientId);
    
    if (clientIndex >= 0) {
      clients[clientIndex].lastVisit = new Date().toISOString();
      clients[clientIndex].status = status;
      clients[clientIndex].sync_status = 'pending_sync';
      clients[clientIndex].updated_at = new Date().toISOString();
      this.setTableData('clients', clients);
    }
  }

  async getClientById(clientId: string): Promise<any | null> {
    const clients = this.getTableData('clients');
    return clients.find(client => client.id === clientId) || null;
  }

  // ✅ CORREÇÃO: getPendingOrders deve buscar apenas pedidos com sync_status = 'pending_sync'
  async getPendingOrders(): Promise<any[]> {
    const pendingOrders = await this.getPendingSyncItems('orders');
    
    console.log(`🔍 Found ${pendingOrders.length} pending orders to transmit`);
    pendingOrders.forEach(order => {
      console.log(`📋 Pending order: ${order.id} - ${order.customer_name} - Status: ${order.sync_status}`);
    });
    
    return pendingOrders;
  }

  async markOrderAsTransmitted(orderId: string): Promise<void> {
    console.log(`✅ Marking order ${orderId} as transmitted`);
    await this.updateSyncStatus('orders', orderId, 'transmitted');
  }

  async getOfflineOrdersCount(): Promise<number> {
    const pendingOrders = await this.getPendingOrders();
    return pendingOrders.length;
  }

  // New methods for improved order management
  async getClientOrders(clientId: string): Promise<any[]> {
    const orders = this.getTableData('orders');
    return orders.filter(order => 
      order.customer_id === clientId && 
      order.sync_status !== 'deleted'
    );
  }

  async deleteOrder(orderId: string): Promise<void> {
    console.log(`🗑️ Marking order ${orderId} as deleted`);
    await this.updateSyncStatus('orders', orderId, 'deleted');
  }

  async getTransmittedOrders(): Promise<any[]> {
    const orders = this.getTableData('orders');
    const transmittedOrders = orders.filter(order => order.sync_status === 'transmitted');
    
    console.log(`📤 Found ${transmittedOrders.length} transmitted orders`);
    return transmittedOrders;
  }

  async getAllOrders(): Promise<any[]> {
    const orders = this.getTableData('orders');
    const activeOrders = orders.filter(order => order.sync_status !== 'deleted');
    
    console.log(`📊 Total active orders: ${activeOrders.length}`);
    console.log(`📊 Orders by sync_status:`, {
      pending_sync: activeOrders.filter(o => o.sync_status === 'pending_sync').length,
      transmitted: activeOrders.filter(o => o.sync_status === 'transmitted').length,
      synced: activeOrders.filter(o => o.sync_status === 'synced').length,
      error: activeOrders.filter(o => o.sync_status === 'error').length
    });
    
    return activeOrders;
  }

  // ✅ NOVOS métodos para validações e controle de status
  async isClientNegated(clientId: string): Promise<boolean> {
    const client = await this.getClientById(clientId);
    return client?.status === 'Negativado' || client?.status === 'negativado';
  }

  async unnegateClient(clientId: string, reason: string): Promise<void> {
    const clients = this.getTableData('clients');
    const clientIndex = clients.findIndex(client => client.id === clientId);
    
    if (clientIndex >= 0) {
      const now = new Date().toISOString();
      
      // Salvar histórico
      const statusHistory = this.getTableData('client_status_history') || [];
      statusHistory.push({
        id: Date.now().toString(),
        client_id: clientId,
        previous_status: clients[clientIndex].status,
        new_status: 'Pendente',
        reason: reason,
        changed_at: now,
        changed_by: 'user'
      });
      this.setTableData('client_status_history', statusHistory);
      
      // Atualizar cliente
      clients[clientIndex].status = 'Pendente';
      clients[clientIndex].lastVisit = now;
      clients[clientIndex].sync_status = 'pending_sync';
      clients[clientIndex].updated_at = now;
      this.setTableData('clients', clients);
      
      console.log(`✅ Cliente ${clientId} desnegativado. Motivo: ${reason}`);
    }
  }

  async getClientStatusHistory(clientId: string): Promise<any[]> {
    const statusHistory = this.getTableData('client_status_history') || [];
    return statusHistory
      .filter(history => history.client_id === clientId)
      .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
  }

  async hasClientPendingOrders(clientId: string): Promise<boolean> {
    const orders = await this.getClientOrders(clientId);
    return orders.some(order => 
      order.sync_status === 'pending_sync' && 
      order.status !== 'cancelled'
    );
  }

  async canCreateOrderForClient(clientId: string): Promise<{ canCreate: boolean; reason?: string; existingOrder?: any }> {
    // Verificar se cliente está negativado
    const isNegated = await this.isClientNegated(clientId);
    if (isNegated) {
      return {
        canCreate: false,
        reason: 'Cliente está negativado. É necessário reativar o cliente antes de criar pedidos.'
      };
    }

    // Verificar se há pedidos pendentes
    const clientOrders = await this.getClientOrders(clientId);
    const pendingOrder = clientOrders.find(order => 
      order.sync_status === 'pending_sync' && 
      order.status !== 'cancelled'
    );

    if (pendingOrder) {
      return {
        canCreate: false,
        reason: 'Cliente já possui um pedido pendente.',
        existingOrder: pendingOrder
      };
    }

    return { canCreate: true };
  }

  async closeDatabase(): Promise<void> {
    // No cleanup needed for localStorage
    console.log('🌐 WebDatabase closed');
  }
}

export default WebDatabaseService;
