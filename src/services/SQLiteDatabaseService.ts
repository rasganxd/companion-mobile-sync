
import { DatabaseInitializer } from './database/DatabaseInitializer';
import { ensureArray, validateOrderData } from '@/utils/androidDataValidator';

interface DatabaseAdapter {
  initDatabase(): Promise<void>;
  getCustomers(): Promise<any[]>;
  getClients(): Promise<any[]>;
  saveClients(clients: any[]): Promise<void>;
  getProducts(): Promise<any[]>;
  saveProducts(products: any[]): Promise<void>;
  getPaymentTables(): Promise<any[]>;
  savePaymentTables(paymentTables: any[]): Promise<void>;
  getOrders(): Promise<any[]>;
  getAllOrders(): Promise<any[]>;
  getClientOrders(clientId: string): Promise<any[]>;
  saveOrder(order: any): Promise<void>;
  deleteOrder(orderId: string): Promise<void>;
  deleteAllOrders(): Promise<void>;
  clearMockData(): Promise<void>;
  getOrdersToSync(salesRepId: string): Promise<any[]>;
  updateOrderStatus(orderId: string, status: string): Promise<void>;
}

export class SQLiteDatabaseService implements DatabaseAdapter {
  private db: any = null;
  private isInitialized = false;
  private static instance: SQLiteDatabaseService;

  constructor() {
    this.initDatabase();
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

  async getOrders(): Promise<any[]> {
    try {
      const result = await this.db.query('SELECT * FROM orders ORDER BY order_date DESC');
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

      const validatedOrder = validateOrderData(order);
      if (!validatedOrder) {
        console.error('Invalid order data, not saving:', order);
        return;
      }

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
}

export default SQLiteDatabaseService;
