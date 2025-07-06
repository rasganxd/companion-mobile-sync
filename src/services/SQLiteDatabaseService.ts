import { DatabaseInitializer } from './database/DatabaseInitializer';
import { ensureArray, validateOrderData } from '@/utils/androidDataValidator';

interface DatabaseAdapter {
  initDatabase(): Promise<void>;
  getCustomers(): Promise<any[]>;
  getClients(): Promise<any[]>;
  getVisitRoutes(): Promise<any[]>;
  saveClients(clients: any[]): Promise<void>;
  getProducts(): Promise<any[]>;
  saveProducts(products: any[]): Promise<void>;
  getPaymentTables(): Promise<any[]>;
  savePaymentTables(paymentTables: any[]): Promise<void>;
  getOrders(clientId?: string): Promise<any[]>;
  getAllOrders(): Promise<any[]>;
  getClientOrders(clientId: string): Promise<any[]>;
  saveOrder(order: any): Promise<void>;
  updateOrder(orderId: string, order: any): Promise<void>;
  deleteOrder(orderId: string): Promise<void>;
  deleteAllOrders(): Promise<void>;
  clearMockData(): Promise<void>;
  getOrdersToSync(salesRepId: string): Promise<any[]>;
  updateOrderStatus(orderId: string, status: string): Promise<void>;
  getPendingSyncItems(table: string): Promise<any[]>;
  updateSyncStatus(table: string, id: string, status: 'synced' | 'pending_sync' | 'error' | 'transmitted' | 'deleted'): Promise<void>;
  logSync(type: string, status: string, details?: string): Promise<void>;
  updateClientStatus(clientId: string, status: string): Promise<void>;
  getClientById(clientId: string): Promise<any | null>;
  closeDatabase(): Promise<void>;
  getPendingOrders(): Promise<any[]>;
  markOrderAsTransmitted(orderId: string): Promise<void>;
  getOfflineOrdersCount(): Promise<number>;
  getTransmittedOrders(): Promise<any[]>;
  saveMobileOrder(order: any): Promise<void>;
  saveClient(client: any): Promise<void>;
  saveProduct(product: any): Promise<void>;
  isClientNegated(clientId: string): Promise<boolean>;
  unnegateClient(clientId: string, reason: string): Promise<void>;
  getClientStatusHistory(clientId: string): Promise<any[]>;
  hasClientPendingOrders(clientId: string): Promise<boolean>;
  canCreateOrderForClient(clientId: string): Promise<{ canCreate: boolean; reason?: string; existingOrder?: any }>;
  getActivePendingOrder(clientId: string): Promise<any | null>;
  getOrderById(orderId: string): Promise<any | null>;
  saveOrders(ordersArray: any[]): Promise<void>;
}

export class SQLiteDatabaseService implements DatabaseAdapter {
  private db: any = null;
  private isInitialized = false;
  private static instance: SQLiteDatabaseService;

  constructor() {
    // Don't call initDatabase in constructor to avoid async issues
  }

  static getInstance(): SQLiteDatabaseService {
    if (!SQLiteDatabaseService.instance) {
      SQLiteDatabaseService.instance = new SQLiteDatabaseService();
    }
    return SQLiteDatabaseService.instance;
  }

  async initDatabase(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.db = await DatabaseInitializer.initializeDatabase();
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  async getCustomers(): Promise<any[]> {
    try {
      const result = await this.db.query('SELECT * FROM clients ORDER BY name');
      const customers = ensureArray(result?.values || []);
      return customers;
    } catch (error) {
      console.error('Error getting customers:', error);
      return [];
    }
  }

  async getClients(): Promise<any[]> {
    try {
      const result = await this.db.query('SELECT * FROM clients ORDER BY name');
      const clients = ensureArray(result?.values || []);
      return clients;
    } catch (error) {
      console.error('Error getting clients:', error);
      return [];
    }
  }

  async getVisitRoutes(): Promise<any[]> {
    try {
      const result = await this.db.query('SELECT * FROM visit_routes ORDER BY name');
      return ensureArray(result?.values || []);
    } catch (error) {
      console.error('Error getting visit routes:', error);
      return [];
    }
  }

  async saveClients(clients: any[]): Promise<void> {
    if (!this.db) {
      console.error('Database not initialized');
      return;
    }

    try {
      await this.db.transaction(async (tx: any) => {
        for (const client of clients) {
          const {
            id,
            name,
            company_name,
            code,
            active,
            phone,
            address,
            neighborhood,
            city,
            state,
            visit_days,
            visit_sequence,
            sales_rep_id,
            created_at,
            updated_at
          } = client;

          const sql = `
            INSERT OR REPLACE INTO clients (
              id, name, company_name, code, active, phone, address, neighborhood, city, state,
              visit_days, visit_sequence, sales_rep_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const values = [
            id, name, company_name, code, active, phone, address, neighborhood, city, state,
            JSON.stringify(visit_days), visit_sequence, sales_rep_id, created_at, updated_at
          ];

          await tx.executeSql(sql, values);
        }
      });
      console.log('Clients saved successfully');
    } catch (error) {
      console.error('Error saving clients:', error);
      throw error;
    }
  }

  async getProducts(): Promise<any[]> {
    try {
      const result = await this.db.query('SELECT * FROM products ORDER BY name');
      return ensureArray(result?.values || []);
    } catch (error) {
      console.error('Error getting products:', error);
      return [];
    }
  }

  async saveProducts(products: any[]): Promise<void> {
    if (!this.db) {
      console.error('Database not initialized');
      return;
    }

    try {
      await this.db.transaction(async (tx: any) => {
        for (const product of products) {
          const {
            id,
            code,
            name,
            description,
            price,
            image_url,
            category,
            stock_quantity,
            created_at,
            updated_at
          } = product;

          const sql = `
            INSERT OR REPLACE INTO products (
              id, code, name, description, price, image_url, category, stock_quantity, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const values = [
            id, code, name, description, price, image_url, category, stock_quantity, created_at, updated_at
          ];

          await tx.executeSql(sql, values);
        }
      });
      console.log('Products saved successfully');
    } catch (error) {
      console.error('Error saving products:', error);
      throw error;
    }
  }

  async getPaymentTables(): Promise<any[]> {
    try {
      const result = await this.db.query('SELECT * FROM payment_tables ORDER BY description');
      return ensureArray(result?.values || []);
    } catch (error) {
      console.error('Error getting payment tables:', error);
      return [];
    }
  }

  async savePaymentTables(paymentTables: any[]): Promise<void> {
    if (!this.db) {
      console.error('Database not initialized');
      return;
    }

    try {
      await this.db.transaction(async (tx: any) => {
        for (const paymentTable of paymentTables) {
          const {
            id,
            description,
            installments,
            interest_rate,
            active,
            created_at,
            updated_at
          } = paymentTable;

          const sql = `
            INSERT OR REPLACE INTO payment_tables (
              id, description, installments, interest_rate, active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `;

          const values = [
            id, description, installments, interest_rate, active, created_at, updated_at
          ];

          await tx.executeSql(sql, values);
        }
      });
      console.log('Payment tables saved successfully');
    } catch (error) {
      console.error('Error saving payment tables:', error);
      throw error;
    }
  }

  async getOrders(clientId?: string): Promise<any[]> {
    try {
      let sql = 'SELECT * FROM orders ORDER BY order_date DESC';
      let values: any[] = [];
      
      if (clientId) {
        sql = 'SELECT * FROM orders WHERE customer_id = ? ORDER BY order_date DESC';
        values = [clientId];
      }
      
      const result = await this.db.query(sql, values);
      return ensureArray(result?.values || []);
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  }

  async getAllOrders(): Promise<any[]> {
    try {
      const result = await this.db.query('SELECT * FROM orders ORDER BY order_date DESC');
      return ensureArray(result?.values || []);
    } catch (error) {
      console.error('Error getting all orders:', error);
      return [];
    }
  }

  async getClientOrders(clientId: string): Promise<any[]> {
    try {
      const sql = 'SELECT * FROM orders WHERE customer_id = ? ORDER BY order_date DESC';
      const values = [clientId];
      const result = await this.db.query(sql, values);
      return ensureArray(result?.values || []);
    } catch (error) {
      console.error('Error getting client orders:', error);
      return [];
    }
  }

  async getOrdersToSync(salesRepId: string): Promise<any[]> {
    try {
      const sql = 'SELECT * FROM orders WHERE sales_rep_id = ? AND sync_status = ? ORDER BY order_date DESC';
      const values = [salesRepId, 'pending_sync'];
      const result = await this.db.query(sql, values);
      return ensureArray(result?.values || []);
    } catch (error) {
      console.error('Error getting orders to sync:', error);
      return [];
    }
  }

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    try {
      const sql = 'UPDATE orders SET sync_status = ? WHERE id = ?';
      const values = [status, orderId];
      await this.db.run(sql, values);
      console.log(`Order ${orderId} status updated to ${status}`);
    } catch (error) {
      console.error(`Error updating order ${orderId} status:`, error);
      throw error;
    }
  }

  async saveOrder(order: any): Promise<void> {
    if (!this.db) {
      console.error('Database not initialized');
      return;
    }

    try {
      const validatedOrder = validateOrderData(order);
      if (!validatedOrder) {
        console.error('Invalid order data, not saving:', order);
        return;
      }

      const {
        id,
        customer_id,
        customer_name,
        sales_rep_id,
        payment_table_id,
        order_date,
        delivery_date,
        total,
        discount,
        notes,
        status,
        items,
        sync_status,
        created_at,
        updated_at
      } = order;

      const sql = `
        INSERT OR REPLACE INTO orders (
          id, customer_id, customer_name, sales_rep_id, payment_table_id,
          order_date, delivery_date, total, discount, notes,
          status, items, sync_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        id, customer_id, customer_name, sales_rep_id, payment_table_id,
        order_date, delivery_date, total, discount, notes,
        status, JSON.stringify(items), sync_status, created_at, updated_at
      ];

      await this.db.run(sql, values);
      console.log('Order saved successfully:', id);
    } catch (error) {
      console.error('Error saving/updating order:', error);
      throw error;
    }
  }

  async updateOrder(orderId: string, order: any): Promise<void> {
    await this.saveOrder({ ...order, id: orderId });
  }

  async deleteOrder(orderId: string): Promise<void> {
    try {
      const sql = 'DELETE FROM orders WHERE id = ?';
      const values = [orderId];
      await this.db.run(sql, values);
      console.log(`Order ${orderId} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting order ${orderId}:`, error);
      throw error;
    }
  }

  async deleteAllOrders(): Promise<void> {
    try {
      const sql = 'DELETE FROM orders';
      await this.db.run(sql);
      console.log('All orders deleted successfully');
    } catch (error) {
      console.error('Error deleting all orders:', error);
      throw error;
    }
  }

  async clearMockData(): Promise<void> {
    try {
      await this.db.run('DELETE FROM clients');
      await this.db.run('DELETE FROM products');
      await this.db.run('DELETE FROM payment_tables');
      console.log('Mock data cleared successfully');
    } catch (error) {
      console.error('Error clearing mock data:', error);
      throw error;
    }
  }

  async getPendingSyncItems(table: string): Promise<any[]> {
    try {
      const sql = `SELECT * FROM ${table} WHERE sync_status = ?`;
      const values = ['pending_sync'];
      const result = await this.db.query(sql, values);
      return ensureArray(result?.values || []);
    } catch (error) {
      console.error(`Error getting pending sync items from ${table}:`, error);
      return [];
    }
  }

  async updateSyncStatus(table: string, id: string, status: 'synced' | 'pending_sync' | 'error' | 'transmitted' | 'deleted'): Promise<void> {
    try {
      const sql = `UPDATE ${table} SET sync_status = ? WHERE id = ?`;
      const values = [status, id];
      await this.db.run(sql, values);
    } catch (error) {
      console.error(`Error updating sync status for ${table}:`, error);
      throw error;
    }
  }

  async logSync(type: string, status: string, details?: string): Promise<void> {
    try {
      const sql = `INSERT INTO sync_log (type, status, details, timestamp) VALUES (?, ?, ?, ?)`;
      const values = [type, status, details || '', new Date().toISOString()];
      await this.db.run(sql, values);
    } catch (error) {
      console.error('Error logging sync:', error);
    }
  }

  async updateClientStatus(clientId: string, status: string): Promise<void> {
    try {
      const sql = 'UPDATE clients SET status = ?, updated_at = ? WHERE id = ?';
      const values = [status, new Date().toISOString(), clientId];
      await this.db.run(sql, values);
    } catch (error) {
      console.error('Error updating client status:', error);
      throw error;
    }
  }

  async getClientById(clientId: string): Promise<any | null> {
    try {
      const sql = 'SELECT * FROM clients WHERE id = ?';
      const values = [clientId];
      const result = await this.db.query(sql, values);
      const clients = ensureArray(result?.values || []);
      return clients.length > 0 ? clients[0] : null;
    } catch (error) {
      console.error('Error getting client by ID:', error);
      return null;
    }
  }

  async closeDatabase(): Promise<void> {
    try {
      if (this.db) {
        await this.db.close();
        this.db = null;
        this.isInitialized = false;
      }
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }

  async getPendingOrders(): Promise<any[]> {
    try {
      const sql = 'SELECT * FROM orders WHERE sync_status = ?';
      const values = ['pending_sync'];
      const result = await this.db.query(sql, values);
      return ensureArray(result?.values || []);
    } catch (error) {
      console.error('Error getting pending orders:', error);
      return [];
    }
  }

  async markOrderAsTransmitted(orderId: string): Promise<void> {
    await this.updateOrderStatus(orderId, 'transmitted');
  }

  async getOfflineOrdersCount(): Promise<number> {
    try {
      const orders = await this.getAllOrders();
      return orders.filter(order => order.sync_status !== 'synced').length;
    } catch (error) {
      console.error('Error getting offline orders count:', error);
      return 0;
    }
  }

  async getTransmittedOrders(): Promise<any[]> {
    try {
      const sql = 'SELECT * FROM orders WHERE sync_status = ?';
      const values = ['transmitted'];
      const result = await this.db.query(sql, values);
      return ensureArray(result?.values || []);
    } catch (error) {
      console.error('Error getting transmitted orders:', error);
      return [];
    }
  }

  async saveMobileOrder(order: any): Promise<void> {
    await this.saveOrder(order);
  }

  async saveClient(client: any): Promise<void> {
    await this.saveClients([client]);
  }

  async saveProduct(product: any): Promise<void> {
    await this.saveProducts([product]);
  }

  async isClientNegated(clientId: string): Promise<boolean> {
    try {
      const client = await this.getClientById(clientId);
      return client?.status === 'negated';
    } catch (error) {
      console.error('Error checking if client is negated:', error);
      return false;
    }
  }

  async unnegateClient(clientId: string, reason: string): Promise<void> {
    try {
      const sql = 'UPDATE clients SET status = ?, negation_reason = ?, updated_at = ? WHERE id = ?';
      const values = ['active', reason, new Date().toISOString(), clientId];
      await this.db.run(sql, values);
    } catch (error) {
      console.error('Error unnegating client:', error);
      throw error;
    }
  }

  async getClientStatusHistory(clientId: string): Promise<any[]> {
    // Mock implementation - could be expanded with actual history table
    return [];
  }

  async hasClientPendingOrders(clientId: string): Promise<boolean> {
    try {
      const orders = await this.getClientOrders(clientId);
      return orders.some(order => order.sync_status !== 'synced');
    } catch (error) {
      console.error('Error checking client pending orders:', error);
      return false;
    }
  }

  async canCreateOrderForClient(clientId: string): Promise<{ canCreate: boolean; reason?: string; existingOrder?: any }> {
    try {
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
    } catch (error) {
      console.error('Error checking if can create order for client:', error);
      return { canCreate: false, reason: 'Erro interno' };
    }
  }

  async getActivePendingOrder(clientId: string): Promise<any | null> {
    try {
      const sql = 'SELECT * FROM orders WHERE customer_id = ? AND status = ? AND sync_status != ?';
      const values = [clientId, 'pending', 'synced'];
      const result = await this.db.query(sql, values);
      const orders = ensureArray(result?.values || []);
      return orders.length > 0 ? orders[0] : null;
    } catch (error) {
      console.error('Error getting active pending order:', error);
      return null;
    }
  }

  async getOrderById(orderId: string): Promise<any | null> {
    try {
      const sql = 'SELECT * FROM orders WHERE id = ?';
      const values = [orderId];
      const result = await this.db.query(sql, values);
      const orders = ensureArray(result?.values || []);
      return orders.length > 0 ? orders[0] : null;
    } catch (error) {
      console.error('Error getting order by ID:', error);
      return null;
    }
  }

  async saveOrders(ordersArray: any[]): Promise<void> {
    for (const order of ordersArray) {
      await this.saveOrder(order);
    }
  }
}

export default SQLiteDatabaseService;
