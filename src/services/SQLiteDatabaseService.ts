
import { openDatabase, SQLiteDatabase } from 'react-native-sqlite-storage';
import DatabaseAdapter from './DatabaseAdapter';
import { v4 as uuidv4 } from 'uuid';

class SQLiteDatabaseService implements DatabaseAdapter {
  private db: SQLiteDatabase | null = null;
  private static instance: SQLiteDatabaseService;

  private constructor() {
    // Private constructor for singleton pattern
    // Initialize the SQLite database
    this.initDatabase();
  }

  static getInstance(): SQLiteDatabaseService {
    if (!SQLiteDatabaseService.instance) {
      SQLiteDatabaseService.instance = new SQLiteDatabaseService();
    }
    return SQLiteDatabaseService.instance;
  }

  async initDatabase(): Promise<void> {
    try {
      // Configure SQLite
      SQLiteDatabase.enablePromise(true);
      
      // Open database
      this.db = await openDatabase({
        name: 'vendas_fortes.db',
        location: 'default'
      });
      
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    // Clients table
    await this.db.executeSql(
      `CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        email TEXT,
        lastVisit TEXT,
        sync_status TEXT DEFAULT 'pending',
        updated_at TEXT
      )`, []
    );

    // Orders table
    await this.db.executeSql(
      `CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        order_date TEXT NOT NULL,
        total REAL NOT NULL,
        status TEXT NOT NULL,
        sync_status TEXT DEFAULT 'pending',
        updated_at TEXT,
        FOREIGN KEY (client_id) REFERENCES clients (id)
      )`, []
    );

    // Products table
    await this.db.executeSql(
      `CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        stock INTEGER NOT NULL,
        image_url TEXT,
        sync_status TEXT DEFAULT 'pending',
        updated_at TEXT
      )`, []
    );

    // Visit routes table
    await this.db.executeSql(
      `CREATE TABLE IF NOT EXISTS visit_routes (
        id TEXT PRIMARY KEY,
        day TEXT NOT NULL,
        visited INTEGER DEFAULT 0,
        remaining INTEGER DEFAULT 0,
        total INTEGER DEFAULT 0,
        sync_status TEXT DEFAULT 'pending',
        updated_at TEXT
      )`, []
    );
    
    // Sync log table
    await this.db.executeSql(
      `CREATE TABLE IF NOT EXISTS sync_log (
        id TEXT PRIMARY KEY,
        sync_type TEXT NOT NULL,
        sync_date TEXT NOT NULL,
        status TEXT NOT NULL,
        details TEXT
      )`, []
    );

    console.log('Tables created successfully');
  }

  async getClients(): Promise<any[]> {
    if (!this.db) await this.initDatabase();
    try {
      const [results] = await this.db!.executeSql('SELECT * FROM clients', []);
      const clients = [];
      for (let i = 0; i < results.rows.length; i++) {
        clients.push(results.rows.item(i));
      }
      return clients;
    } catch (error) {
      console.error('Error getting clients:', error);
      return [];
    }
  }

  async getVisitRoutes(): Promise<any[]> {
    if (!this.db) await this.initDatabase();
    try {
      const [results] = await this.db!.executeSql('SELECT * FROM visit_routes', []);
      const routes = [];
      for (let i = 0; i < results.rows.length; i++) {
        routes.push(results.rows.item(i));
      }
      return routes;
    } catch (error) {
      console.error('Error getting visit routes:', error);
      return [];
    }
  }

  async getOrders(clientId?: string): Promise<any[]> {
    if (!this.db) await this.initDatabase();
    try {
      let query = 'SELECT * FROM orders';
      let params: string[] = [];
      
      if (clientId) {
        query += ' WHERE client_id = ?';
        params.push(clientId);
      }
      
      const [results] = await this.db!.executeSql(query, params);
      const orders = [];
      for (let i = 0; i < results.rows.length; i++) {
        orders.push(results.rows.item(i));
      }
      return orders;
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  }

  async getProducts(): Promise<any[]> {
    if (!this.db) await this.initDatabase();
    try {
      const [results] = await this.db!.executeSql('SELECT * FROM products', []);
      const products = [];
      for (let i = 0; i < results.rows.length; i++) {
        products.push(results.rows.item(i));
      }
      return products;
    } catch (error) {
      console.error('Error getting products:', error);
      return [];
    }
  }

  async getPendingSyncItems(table: string): Promise<any[]> {
    if (!this.db) await this.initDatabase();
    try {
      const [results] = await this.db!.executeSql(
        `SELECT * FROM ${table} WHERE sync_status = 'pending'`, []
      );
      const items = [];
      for (let i = 0; i < results.rows.length; i++) {
        items.push(results.rows.item(i));
      }
      return items;
    } catch (error) {
      console.error(`Error getting pending ${table} items:`, error);
      return [];
    }
  }

  async updateSyncStatus(table: string, id: string, status: 'synced' | 'pending' | 'error'): Promise<void> {
    if (!this.db) await this.initDatabase();
    try {
      await this.db!.executeSql(
        `UPDATE ${table} SET sync_status = ? WHERE id = ?`, 
        [status, id]
      );
    } catch (error) {
      console.error(`Error updating sync status for ${table}:`, error);
    }
  }

  async logSync(type: string, status: string, details?: string): Promise<void> {
    if (!this.db) await this.initDatabase();
    const id = Date.now().toString();
    const syncDate = new Date().toISOString();
    
    try {
      await this.db!.executeSql(
        'INSERT INTO sync_log (id, sync_type, sync_date, status, details) VALUES (?, ?, ?, ?, ?)',
        [id, type, syncDate, status, details || '']
      );
    } catch (error) {
      console.error('Error logging sync:', error);
    }
  }

  async saveOrder(order: any): Promise<void> {
    if (!this.db) await this.initDatabase();
    const id = order.id || uuidv4();
    const now = new Date().toISOString();
    
    try {
      await this.db!.executeSql(
        'INSERT OR REPLACE INTO orders (id, client_id, order_date, total, status, sync_status, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, order.client_id, order.order_date || now, order.total, order.status, 'pending', now]
      );
    } catch (error) {
      console.error('Error saving order:', error);
    }
  }

  async updateClientStatus(clientId: string, status: string): Promise<void> {
    if (!this.db) await this.initDatabase();
    try {
      await this.db!.executeSql(
        'UPDATE clients SET lastVisit = ?, sync_status = ?, updated_at = ? WHERE id = ?',
        [new Date().toISOString(), 'pending', new Date().toISOString(), clientId]
      );
    } catch (error) {
      console.error('Error updating client status:', error);
    }
  }

  async getClientById(clientId: string): Promise<any | null> {
    if (!this.db) await this.initDatabase();
    try {
      const [results] = await this.db!.executeSql(
        'SELECT * FROM clients WHERE id = ?', 
        [clientId]
      );
      
      if (results.rows.length > 0) {
        return results.rows.item(0);
      }
      return null;
    } catch (error) {
      console.error('Error getting client by ID:', error);
      return null;
    }
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

export default SQLiteDatabaseService;
