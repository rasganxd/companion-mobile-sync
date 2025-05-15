
import { CapacitorSQLite, SQLiteDBConnection, SQLiteConnection } from '@capacitor-community/sqlite';
import DatabaseAdapter from './DatabaseAdapter';

class SQLiteDatabaseService implements DatabaseAdapter {
  private static instance: SQLiteDatabaseService;
  private sqliteConnection: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private dbName = 'vendas_fortes_db';
  private isInitialized = false;

  private constructor() {
    this.sqliteConnection = new SQLiteConnection(CapacitorSQLite);
  }

  static getInstance(): SQLiteDatabaseService {
    if (!SQLiteDatabaseService.instance) {
      SQLiteDatabaseService.instance = new SQLiteDatabaseService();
    }
    return SQLiteDatabaseService.instance;
  }

  async initDatabase(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Create database connection
      const dbOptions = {
        database: this.dbName,
        encrypted: false,
        mode: 'no-encryption',
        version: 1
      };
      
      // Check if database exists, create if not
      const isDbExists = await this.sqliteConnection.isDatabase(this.dbName);
      
      if (isDbExists.result) {
        this.db = await this.sqliteConnection.createConnection(this.dbName, false, 'no-encryption', 1);
      } else {
        this.db = await this.sqliteConnection.createConnection(this.dbName, false, 'no-encryption', 1);
        await this.db.open();
        await this.createTables();
        await this.populateInitialData();
      }

      if (!this.db) {
        throw new Error('Database connection could not be established');
      }
      
      await this.db.open();
      this.isInitialized = true;
      
      console.log('SQLite database initialized successfully');
    } catch (error) {
      console.error('Error initializing SQLite database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Create clients table
    await this.db.execute({
      statements: `
        CREATE TABLE IF NOT EXISTS clients (
          id TEXT PRIMARY KEY,
          codigo TEXT,
          status TEXT,
          nome TEXT,
          fantasia TEXT,
          endereco TEXT,
          comprador TEXT,
          bairro TEXT,
          cidade TEXT,
          telefone TEXT,
          tipoFJ TEXT,
          diasMaxPrazo TEXT,
          canal TEXT,
          rotatividade TEXT,
          proximaVisita TEXT,
          restricao TEXT,
          sync_status TEXT
        );
      `
    });

    // Create visit_routes table
    await this.db.execute({
      statements: `
        CREATE TABLE IF NOT EXISTS visit_routes (
          id TEXT PRIMARY KEY,
          day TEXT,
          clients TEXT,
          sync_status TEXT
        );
      `
    });

    // Create orders table
    await this.db.execute({
      statements: `
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          client_id TEXT,
          date TEXT,
          payment_method TEXT,
          total REAL,
          items TEXT,
          sync_status TEXT,
          FOREIGN KEY (client_id) REFERENCES clients(id)
        );
      `
    });

    // Create products table
    await this.db.execute({
      statements: `
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY,
          code TEXT,
          name TEXT,
          price REAL,
          unit TEXT,
          category TEXT,
          stock INTEGER,
          min_stock INTEGER,
          supplier TEXT,
          sync_status TEXT
        );
      `
    });

    // Create sync_log table
    await this.db.execute({
      statements: `
        CREATE TABLE IF NOT EXISTS sync_log (
          id TEXT PRIMARY KEY,
          sync_type TEXT,
          sync_date TEXT,
          status TEXT,
          details TEXT
        );
      `
    });
  }

  private async populateInitialData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Import sample data from WebDatabaseService
      const webService = new WebDatabaseService();
      
      // Get sample data
      const clients = await webService.getClients();
      const products = await webService.getProducts();
      const orders = await webService.getOrders();
      const visitRoutes = await webService.getVisitRoutes();
      
      // Insert clients
      if (clients.length > 0) {
        for (const client of clients) {
          await this.db.run(
            `INSERT INTO clients (id, codigo, status, nome, fantasia, endereco, comprador, bairro, cidade, telefone, tipoFJ, diasMaxPrazo, canal, rotatividade, proximaVisita, restricao, sync_status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              client.id,
              client.codigo,
              client.status,
              client.nome,
              client.fantasia,
              client.endereco,
              client.comprador,
              client.bairro,
              client.cidade,
              JSON.stringify(client.telefone),
              client.tipoFJ,
              client.diasMaxPrazo,
              client.canal,
              client.rotatividade,
              client.proximaVisita,
              client.restricao,
              client.sync_status
            ]
          );
        }
      }

      // Insert products
      if (products.length > 0) {
        for (const product of products) {
          await this.db.run(
            `INSERT INTO products (id, code, name, price, unit, category, stock, min_stock, supplier, sync_status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              product.id,
              product.code,
              product.name,
              product.price,
              product.unit,
              product.category,
              product.stock,
              product.min_stock,
              product.supplier,
              product.sync_status
            ]
          );
        }
      }

      // Insert orders
      if (orders.length > 0) {
        for (const order of orders) {
          await this.db.run(
            `INSERT INTO orders (id, client_id, date, payment_method, total, items, sync_status) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              order.id,
              order.client_id,
              order.date,
              order.payment_method,
              order.total,
              JSON.stringify(order.items),
              order.sync_status
            ]
          );
        }
      }

      // Insert visit routes
      if (visitRoutes.length > 0) {
        for (const route of visitRoutes) {
          await this.db.run(
            `INSERT INTO visit_routes (id, day, clients, sync_status) 
             VALUES (?, ?, ?, ?)`,
            [
              route.id,
              route.day,
              JSON.stringify(route.clients),
              route.sync_status
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error populating initial data:', error);
      throw error;
    }
  }

  async getClients(): Promise<any[]> {
    if (!this.db) await this.initDatabase();
    
    try {
      const result = await this.db!.query('SELECT * FROM clients');
      return result.values!.map(client => {
        return {
          ...client,
          telefone: JSON.parse(client.telefone || '[]')
        };
      });
    } catch (error) {
      console.error('Error getting clients:', error);
      return [];
    }
  }

  async getVisitRoutes(): Promise<any[]> {
    if (!this.db) await this.initDatabase();
    
    try {
      const result = await this.db!.query('SELECT * FROM visit_routes');
      return result.values!.map(route => {
        return {
          ...route,
          clients: JSON.parse(route.clients || '[]')
        };
      });
    } catch (error) {
      console.error('Error getting visit routes:', error);
      return [];
    }
  }

  async getOrders(clientId?: string): Promise<any[]> {
    if (!this.db) await this.initDatabase();
    
    try {
      let query = 'SELECT * FROM orders';
      let values: any[] = [];
      
      if (clientId) {
        query += ' WHERE client_id = ?';
        values = [clientId];
      }
      
      const result = await this.db!.query(query, values);
      return result.values!.map(order => {
        return {
          ...order,
          items: JSON.parse(order.items || '[]')
        };
      });
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  }

  async getProducts(): Promise<any[]> {
    if (!this.db) await this.initDatabase();
    
    try {
      const result = await this.db!.query('SELECT * FROM products');
      return result.values!;
    } catch (error) {
      console.error('Error getting products:', error);
      return [];
    }
  }

  async getPendingSyncItems(table: string): Promise<any[]> {
    if (!this.db) await this.initDatabase();
    
    try {
      const result = await this.db!.query(
        `SELECT * FROM ${table} WHERE sync_status = 'pending'`
      );
      
      if (table === 'orders') {
        return result.values!.map(order => {
          return {
            ...order,
            items: JSON.parse(order.items || '[]')
          };
        });
      }
      
      if (table === 'visit_routes') {
        return result.values!.map(route => {
          return {
            ...route,
            clients: JSON.parse(route.clients || '[]')
          };
        });
      }
      
      if (table === 'clients') {
        return result.values!.map(client => {
          return {
            ...client,
            telefone: JSON.parse(client.telefone || '[]')
          };
        });
      }
      
      return result.values!;
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
    
    try {
      const id = Date.now().toString();
      const syncDate = new Date().toISOString();
      
      await this.db!.run(
        `INSERT INTO sync_log (id, sync_type, sync_date, status, details) VALUES (?, ?, ?, ?, ?)`,
        [id, type, syncDate, status, details || '']
      );
    } catch (error) {
      console.error('Error logging sync:', error);
    }
  }

  async saveOrder(order: any): Promise<void> {
    if (!this.db) await this.initDatabase();
    
    try {
      await this.db!.run(
        `INSERT OR REPLACE INTO orders (id, client_id, date, payment_method, total, items, sync_status) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          order.id,
          order.client_id,
          order.date,
          order.payment_method,
          order.total,
          JSON.stringify(order.items),
          order.sync_status
        ]
      );
    } catch (error) {
      console.error('Error saving order:', error);
    }
  }

  async updateClientStatus(clientId: string, status: string): Promise<void> {
    if (!this.db) await this.initDatabase();
    
    try {
      await this.db!.run(
        `UPDATE clients SET status = ? WHERE id = ?`,
        [status, clientId]
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
      
      if (result.values!.length > 0) {
        const client = result.values![0];
        return {
          ...client,
          telefone: JSON.parse(client.telefone || '[]')
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting client by id:', error);
      return null;
    }
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      try {
        await this.db.close();
        this.isInitialized = false;
      } catch (error) {
        console.error('Error closing database:', error);
      }
    }
  }
}

// For development purposes, we need to import WebDatabaseService to migrate data
import WebDatabaseService from './WebDatabaseService';

export default SQLiteDatabaseService;
