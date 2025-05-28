
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

  async getPendingSyncItems(table: string): Promise<any[]> {
    const data = this.getTableData(table);
    return data.filter(item => item.sync_status === 'pending_sync');
  }

  async updateSyncStatus(table: string, id: string, status: 'synced' | 'pending_sync' | 'error' | 'transmitted' | 'deleted'): Promise<void> {
    const data = this.getTableData(table);
    const itemIndex = data.findIndex(item => item.id === id);
    
    if (itemIndex >= 0) {
      data[itemIndex].sync_status = status;
      data[itemIndex].updated_at = new Date().toISOString();
      this.setTableData(table, data);
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
    
    const orderToSave = {
      ...order,
      id: order.id || uuidv4(),
      created_at: now,
      updated_at: now,
      sync_status: order.sync_status || 'pending_sync'
    };
    
    // Check if order already exists (for updates)
    const existingIndex = orders.findIndex(o => o.id === orderToSave.id);
    
    if (existingIndex >= 0) {
      orders[existingIndex] = orderToSave;
    } else {
      orders.push(orderToSave);
    }
    
    this.setTableData('orders', orders);
    console.log('💾 Order saved to localStorage:', orderToSave);
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

  // Original methods for offline flow
  async getPendingOrders(): Promise<any[]> {
    return this.getPendingSyncItems('orders');
  }

  async markOrderAsTransmitted(orderId: string): Promise<void> {
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
    await this.updateSyncStatus('orders', orderId, 'deleted');
  }

  async getTransmittedOrders(): Promise<any[]> {
    const orders = this.getTableData('orders');
    return orders.filter(order => order.sync_status === 'transmitted');
  }

  async getAllOrders(): Promise<any[]> {
    const orders = this.getTableData('orders');
    return orders.filter(order => order.sync_status !== 'deleted');
  }

  async closeDatabase(): Promise<void> {
    // No cleanup needed for localStorage
    console.log('🌐 WebDatabase closed');
  }
}

export default WebDatabaseService;
