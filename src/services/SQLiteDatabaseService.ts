
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { v4 as uuidv4 } from 'uuid';

class SQLiteDatabaseService {
  private db: SQLiteDBConnection | null = null;
  private sqliteConnection: SQLiteConnection | null = null;
  private static instance: SQLiteDatabaseService;

  private constructor() {
    console.log('SQLiteDatabaseService constructor called');
  }

  static getInstance(): SQLiteDatabaseService {
    if (!SQLiteDatabaseService.instance) {
      SQLiteDatabaseService.instance = new SQLiteDatabaseService();
    }
    return SQLiteDatabaseService.instance;
  }

  async initDatabase(): Promise<void> {
    try {
      console.log('Initializing SQLite database with Capacitor...');
      
      // Check if SQLite is available
      if (!(window as any).Capacitor || !CapacitorSQLite) {
        throw new Error('Capacitor SQLite not available');
      }

      this.sqliteConnection = new SQLiteConnection(CapacitorSQLite);
      
      // Create or open database
      this.db = await this.sqliteConnection.createConnection(
        'vendas_fortes.db',
        false,
        'no-encryption',
        1,
        false
      );
      
      await this.db.open();
      await this.createTables();
      console.log('SQLite database initialized successfully');
    } catch (error) {
      console.error('Error initializing SQLite database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        email TEXT,
        lastVisit TEXT,
        sync_status TEXT DEFAULT 'pending',
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        order_date TEXT NOT NULL,
        total REAL NOT NULL,
        status TEXT NOT NULL,
        sync_status TEXT DEFAULT 'pending',
        updated_at TEXT,
        FOREIGN KEY (client_id) REFERENCES clients (id)
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        stock INTEGER NOT NULL,
        image_url TEXT,
        sync_status TEXT DEFAULT 'pending',
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS visit_routes (
        id TEXT PRIMARY KEY,
        day TEXT NOT NULL,
        visited INTEGER DEFAULT 0,
        remaining INTEGER DEFAULT 0,
        total INTEGER DEFAULT 0,
        sync_status TEXT DEFAULT 'pending',
        updated_at TEXT
      );
      
      CREATE TABLE IF NOT EXISTS sync_log (
        id TEXT PRIMARY KEY,
        sync_type TEXT NOT NULL,
        sync_date TEXT NOT NULL,
        status TEXT NOT NULL,
        details TEXT
      );
    `;

    await this.db.execute(createTablesSQL);
    console.log('Tables created successfully');
  }

  async getClients(): Promise<any[]> {
    if (!this.db) await this.initDatabase();
    try {
      const result = await this.db!.query('SELECT * FROM clients');
      return result.values || [];
    } catch (error) {
      console.error('Error getting clients:', error);
      return [];
    }
  }

  async getVisitRoutes(): Promise<any[]> {
    if (!this.db) await this.initDatabase();
    try {
      const result = await this.db!.query('SELECT * FROM visit_routes');
      return result.values || [];
    } catch (error) {
      console.error('Error getting visit routes:', error);
      return [];
    }
  }

  async getOrders(clientId?: string): Promise<any[]> {
    if (!this.db) await this.initDatabase();
    try {
      let query = 'SELECT * FROM orders';
      let values: string[] = [];
      
      if (clientId) {
        query += ' WHERE client_id = ?';
        values.push(clientId);
      }
      
      const result = await this.db!.query(query, values);
      return result.values || [];
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  }

  async getProducts(): Promise<any[]> {
    if (!this.db) await this.initDatabase();
    try {
      const result = await this.db!.query('SELECT * FROM products');
      return result.values || [];
    } catch (error) {
      console.error('Error getting products:', error);
      return [];
    }
  }

  async getPendingSyncItems(table: string): Promise<any[]> {
    if (!this.db) await this.initDatabase();
    try {
      const result = await this.db!.query(
        `SELECT * FROM ${table} WHERE sync_status = ?`, 
        ['pending']
      );
      return result.values || [];
    } catch (error) {
      console.error(`Error getting pending ${table} items:`, error);
      return [];
    }
  }

  async updateSyncStatus(table: string, id: string, status: 'synced' | 'pending' | 'error'): Promise<void> {
    if (!this.db) await this.initDatabase();
    try {
      await this.db!.run(
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
      await this.db!.run(
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
      await this.db!.run(
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
      await this.db!.run(
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
      const result = await this.db!.query(
        'SELECT * FROM clients WHERE id = ?', 
        [clientId]
      );
      
      if (result.values && result.values.length > 0) {
        return result.values[0];
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
    if (this.sqliteConnection) {
      this.sqliteConnection = null;
    }
  }
}

export default SQLiteDatabaseService;
