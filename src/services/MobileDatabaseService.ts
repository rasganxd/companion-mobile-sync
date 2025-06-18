import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';

interface DatabaseDiagnostics {
  isInitialized: boolean;
  tableCount: number;
  clientsCount: number;
  productsCount: number;
  ordersCount: number;
  paymentTablesCount: number;
  lastError: string | null;
  timestamp: string;
}

class MobileDatabaseService {
  private static instance: MobileDatabaseService | null = null;
  private sqlite: SQLiteConnection | null = null;
  private db: SQLiteDBConnection | null = null;
  private isInitialized = false;
  private lastError: string | null = null;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): MobileDatabaseService {
    if (!MobileDatabaseService.instance) {
      MobileDatabaseService.instance = new MobileDatabaseService();
    }
    return MobileDatabaseService.instance;
  }

  async initDatabase(): Promise<void> {
    // Prevent multiple simultaneous initialization attempts
    if (this.initializationPromise) {
      console.log('📱 Database initialization already in progress, waiting...');
      return this.initializationPromise;
    }

    if (this.isInitialized && this.db) {
      console.log('📱 Mobile SQLite database already initialized');
      return;
    }

    this.initializationPromise = this._initDatabaseInternal();
    
    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  private async _initDatabaseInternal(): Promise<void> {
    try {
      console.log('📱 Initializing Mobile SQLite database...');
      console.log('📱 Platform check:', {
        isNative: Capacitor.isNativePlatform(),
        platform: Capacitor.getPlatform()
      });
      
      if (!Capacitor.isNativePlatform()) {
        throw new Error('This app requires a native mobile platform (Android/iOS)');
      }

      this.sqlite = new SQLiteConnection(CapacitorSQLite);
      console.log('📱 SQLite connection created');
      
      // Create or open database
      this.db = await this.sqlite.createConnection('sales-app-mobile', false, 'no-encryption', 1, false);
      console.log('📱 Database connection established');
      
      await this.db.open();
      console.log('📱 Database opened successfully');

      // Create tables
      await this.createTables();
      
      this.isInitialized = true;
      this.lastError = null;
      console.log('✅ Mobile SQLite database initialized successfully');
      
      // Run initial diagnostics
      const diagnostics = await this.getDatabaseDiagnostics();
      console.log('📊 Initial database diagnostics:', diagnostics);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.lastError = errorMessage;
      console.error('❌ Failed to initialize Mobile SQLite database:', error);
      
      // Reset state on failure
      this.db = null;
      this.isInitialized = false;
      
      throw new Error(`Mobile database initialization failed: ${errorMessage}`);
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      console.log('📱 Creating mobile SQLite tables...');

      // Clients table with status field
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS clients (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          company_name TEXT,
          code INTEGER,
          active INTEGER DEFAULT 1,
          phone TEXT,
          address TEXT,
          city TEXT,
          state TEXT,
          visit_days TEXT,
          visit_sequence INTEGER,
          sales_rep_id TEXT,
          status TEXT DEFAULT 'pendente',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Visit routes table
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS visit_routes (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          sales_rep_id TEXT,
          day TEXT,
          active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Orders table
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          customer_id TEXT,
          customer_name TEXT,
          sales_rep_id TEXT,
          date DATETIME,
          status TEXT DEFAULT 'pending',
          total REAL DEFAULT 0,
          sync_status TEXT DEFAULT 'pending_sync',
          source_project TEXT DEFAULT 'mobile',
          payment_method TEXT,
          payment_table_id TEXT,
          reason TEXT,
          notes TEXT,
          items TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Products table
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          code INTEGER,
          sale_price REAL DEFAULT 0,
          cost_price REAL DEFAULT 0,
          stock REAL DEFAULT 0,
          active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Payment tables
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS payment_tables (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          type TEXT,
          payable_to TEXT,
          payment_location TEXT,
          active INTEGER DEFAULT 1,
          installments TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Sync log table
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS sync_log (
          id TEXT PRIMARY KEY,
          type TEXT,
          status TEXT,
          details TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('✅ Mobile SQLite tables created successfully');
      
      // Verify table creation
      const tablesResult = await this.db.query("SELECT name FROM sqlite_master WHERE type='table'");
      console.log('📋 Created tables:', tablesResult.values?.map(t => t.name));
      
    } catch (error) {
      console.error('❌ Error creating mobile SQLite tables:', error);
      throw error;
    }
  }

  async getDatabaseDiagnostics(): Promise<DatabaseDiagnostics> {
    const diagnostics: DatabaseDiagnostics = {
      isInitialized: this.isInitialized,
      tableCount: 0,
      clientsCount: 0,
      productsCount: 0,
      ordersCount: 0,
      paymentTablesCount: 0,
      lastError: this.lastError,
      timestamp: new Date().toISOString()
    };

    if (!this.db || !this.isInitialized) {
      console.log('📊 Database not initialized, returning basic diagnostics');
      return diagnostics;
    }

    try {
      // Count tables
      const tablesResult = await this.db.query("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'");
      diagnostics.tableCount = tablesResult.values?.[0]?.count || 0;

      // Count clients
      const clientsResult = await this.db.query('SELECT COUNT(*) as count FROM clients');
      diagnostics.clientsCount = clientsResult.values?.[0]?.count || 0;

      // Count products
      const productsResult = await this.db.query('SELECT COUNT(*) as count FROM products');
      diagnostics.productsCount = productsResult.values?.[0]?.count || 0;

      // Count orders
      const ordersResult = await this.db.query('SELECT COUNT(*) as count FROM orders');
      diagnostics.ordersCount = ordersResult.values?.[0]?.count || 0;

      // Count payment tables
      const paymentResult = await this.db.query('SELECT COUNT(*) as count FROM payment_tables');
      diagnostics.paymentTablesCount = paymentResult.values?.[0]?.count || 0;

      console.log('📊 Database diagnostics collected:', diagnostics);
    } catch (error) {
      console.error('❌ Error collecting diagnostics:', error);
      diagnostics.lastError = error instanceof Error ? error.message : 'Unknown error';
    }

    return diagnostics;
  }

  async validateDatabaseIntegrity(): Promise<boolean> {
    if (!this.db || !this.isInitialized) {
      console.log('⚠️ Database not initialized, integrity check failed');
      return false;
    }

    try {
      console.log('🔍 Validating database integrity...');

      // Check if all required tables exist
      const requiredTables = ['clients', 'products', 'orders', 'payment_tables', 'visit_routes', 'sync_log'];
      
      for (const table of requiredTables) {
        const result = await this.db.query(
          "SELECT name FROM sqlite_master WHERE type='table' AND name=?", 
          [table]
        );
        
        if (!result.values || result.values.length === 0) {
          console.error(`❌ Required table '${table}' not found`);
          return false;
        }
      }

      // Test basic operations
      await this.db.query('SELECT 1');
      
      console.log('✅ Database integrity validation passed');
      return true;
    } catch (error) {
      console.error('❌ Database integrity validation failed:', error);
      return false;
    }
  }

  async saveClients(clientsArray: any[]): Promise<void> {
    if (!this.db) await this.initDatabase();
    
    try {
      console.log(`📱 Saving ${clientsArray.length} clients to mobile database...`);
      
      // Clear existing clients first
      await this.db!.run('DELETE FROM clients');
      console.log('📱 Cleared existing clients');
      
      // Save new clients
      let savedCount = 0;
      for (const client of clientsArray) {
        try {
          await this.db!.run(
            `INSERT INTO clients (
              id, name, company_name, code, active, phone, address, city, state,
              visit_days, visit_sequence, sales_rep_id, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              client.id, client.name, client.company_name, client.code, client.active ? 1 : 0,
              client.phone, client.address, client.city, client.state, 
              client.visit_days ? JSON.stringify(client.visit_days) : null,
              client.visit_sequence, client.sales_rep_id, client.status || 'pendente'
            ]
          );
          savedCount++;
          console.log(`📱 Saved client: ${client.name} (${client.id})`);
        } catch (error) {
          console.error('❌ Error saving individual client:', client.id, error);
        }
      }
      
      console.log(`✅ Successfully saved ${savedCount}/${clientsArray.length} clients to mobile database`);
      
      // Verify save
      const verifyResult = await this.db!.query('SELECT COUNT(*) as count FROM clients');
      const actualCount = verifyResult.values?.[0]?.count || 0;
      console.log(`📊 Verification: ${actualCount} clients in database after save`);
      
    } catch (error) {
      console.error('❌ Error saving clients to mobile database:', error);
      throw error;
    }
  }

  async saveProducts(productsArray: any[]): Promise<void> {
    if (!this.db) await this.initDatabase();
    
    try {
      console.log(`📱 Saving ${productsArray.length} products to mobile database...`);
      
      // Clear existing products first
      await this.db!.run('DELETE FROM products');
      console.log('📱 Cleared existing products');
      
      // Save new products
      let savedCount = 0;
      for (const product of productsArray) {
        try {
          await this.db!.run(
            `INSERT INTO products (
              id, name, code, sale_price, cost_price, stock, active
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              product.id, product.name, product.code, product.sale_price || 0,
              product.cost_price || 0, product.stock || 0, product.active ? 1 : 0
            ]
          );
          savedCount++;
          console.log(`📱 Saved product: ${product.name} (${product.id})`);
        } catch (error) {
          console.error('❌ Error saving individual product:', product.id, error);
        }
      }
      
      console.log(`✅ Successfully saved ${savedCount}/${productsArray.length} products to mobile database`);
      
      // Verify save
      const verifyResult = await this.db!.query('SELECT COUNT(*) as count FROM products');
      const actualCount = verifyResult.values?.[0]?.count || 0;
      console.log(`📊 Verification: ${actualCount} products in database after save`);
      
    } catch (error) {
      console.error('❌ Error saving products to mobile database:', error);
      throw error;
    }
  }

  async savePaymentTables(paymentTablesArray: any[]): Promise<void> {
    if (!this.db) await this.initDatabase();
  
    try {
      console.log(`📱 Saving ${paymentTablesArray.length} payment tables to mobile database...`);
      
      // Clear existing payment tables first
      await this.db!.run('DELETE FROM payment_tables');
      console.log('📱 Cleared existing payment tables');
  
      let savedCount = 0;
      for (const paymentTable of paymentTablesArray) {
        try {
          await this.db!.run(
            `INSERT INTO payment_tables (
              id, name, description, type, payable_to, payment_location, active, installments
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              paymentTable.id, 
              paymentTable.name, 
              paymentTable.description || null,
              paymentTable.type || null,
              paymentTable.payable_to || null,
              paymentTable.payment_location || null,
              paymentTable.active !== false ? 1 : 0,
              paymentTable.installments ? JSON.stringify(paymentTable.installments) : null
            ]
          );
          savedCount++;
          console.log(`📱 Saved payment table: ${paymentTable.name} (${paymentTable.id})`);
        } catch (error) {
          console.error('❌ Error saving individual payment table:', paymentTable.id, error);
        }
      }
  
      console.log(`✅ Successfully saved ${savedCount}/${paymentTablesArray.length} payment tables to mobile database`);
      
      // Verify save
      const verifyResult = await this.db!.query('SELECT COUNT(*) as count FROM payment_tables');
      const actualCount = verifyResult.values?.[0]?.count || 0;
      console.log(`📊 Verification: ${actualCount} payment tables in database after save`);
      
    } catch (error) {
      console.error('❌ Error saving payment tables:', error);
      throw error;
    }
  }

  async getClients(): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('📱 Getting clients from mobile database...');
      const result = await this.db!.query('SELECT * FROM clients ORDER BY name');
      const clients = result.values || [];
      console.log(`📱 Retrieved ${clients.length} clients from mobile database`);
      return clients;
    } catch (error) {
      console.error('❌ Error getting clients from mobile database:', error);
      return [];
    }
  }

  async getProducts(): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('📱 Getting products from mobile database...');
      const result = await this.db!.query('SELECT * FROM products WHERE active = 1 ORDER BY name');
      const products = result.values || [];
      console.log(`📱 Retrieved ${products.length} products from mobile database`);
      return products;
    } catch (error) {
      console.error('❌ Error getting products from mobile database:', error);
      return [];
    }
  }

  async getVisitRoutes(): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('📱 Getting visit routes from mobile database...');
      const result = await this.db!.query('SELECT * FROM visit_routes ORDER BY name');
      const routes = result.values || [];
      console.log(`📱 Retrieved ${routes.length} visit routes from mobile database`);
      return routes;
    } catch (error) {
      console.error('❌ Error getting visit routes from mobile database:', error);
      return [];
    }
  }

  async getOrders(clientId?: string): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`📱 Getting orders from mobile database for client ID: ${clientId}`);
      let query = 'SELECT * FROM orders';
      let values: any[] = [];

      if (clientId) {
        query += ' WHERE customer_id = ?';
        values = [clientId];
      }

      const result = await this.db!.query(query, values);
      const orders = result.values || [];
      console.log(`📱 Retrieved ${orders.length} orders from mobile database`);
      return orders;
    } catch (error) {
      console.error('❌ Error getting orders from mobile database:', error);
      return [];
    }
  }

  async getPendingSyncItems(table: string): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`📱 Getting pending sync items from ${table}...`);
      const result = await this.db!.query(`SELECT * FROM ${table} WHERE sync_status = ?`, ['pending_sync']);
      return result.values || [];
    } catch (error) {
      console.error(`❌ Error getting pending sync items from ${table}:`, error);
      return [];
    }
  }

  async updateSyncStatus(table: string, id: string, status: 'synced' | 'pending_sync' | 'error' | 'transmitted' | 'deleted'): Promise<void> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`📱 Updating sync status for ${table} with ID ${id} to ${status}...`);
      const result = await this.db!.run(
        `UPDATE ${table} SET sync_status = ? WHERE id = ?`,
        [status, id]
      );

      if (result.changes && result.changes.changes > 0) {
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
      console.log('📱 Logging sync event:', { type, status, details });
      await this.db!.run(
        'INSERT INTO sync_log (id, type, status, details, timestamp) VALUES (?, ?, ?, ?, ?)',
        [new Date().toISOString(), type, status, details || null, new Date().toISOString()]
      );
      console.log('✅ Sync event logged');
    } catch (error) {
      console.error('❌ Error logging sync event:', error);
    }
  }

  async saveOrder(order: any): Promise<void> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('📱 Saving order to mobile database:', {
        id: order.id,
        customer_name: order.customer_name,
        payment_table_id: order.payment_table_id,
        status: order.status,
        total: order.total
      });
      
      await this.db!.run(
        `INSERT INTO orders (
          id, customer_id, customer_name, sales_rep_id, date, status, total, 
          sync_status, source_project, payment_method, payment_table_id, reason, notes, items, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          order.id, order.customer_id, order.customer_name, order.sales_rep_id,
          order.date, order.status, order.total, order.sync_status, order.source_project,
          order.payment_method, order.payment_table_id, order.reason, order.notes, JSON.stringify(order.items)
        ]
      );
      console.log('✅ Order saved to mobile database with payment_table_id:', order.payment_table_id);
    } catch (error) {
      console.error('❌ Error saving order:', error);
    }
  }

  async updateClientStatus(clientId: string, status: string): Promise<void> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`📱 [DEBUG] Atualizando status do cliente ${clientId} para ${status}...`);
      
      // Primeiro verificar se o cliente existe
      const clientBefore = await this.getClientById(clientId);
      console.log(`📱 [DEBUG] Cliente antes da atualização:`, clientBefore);
      
      const result = await this.db!.run(
        'UPDATE clients SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, clientId]
      );
      
      console.log(`📱 [DEBUG] Resultado da atualização:`, result);
      
      if (result.changes && result.changes.changes > 0) {
        console.log(`✅ [DEBUG] Cliente status atualizado para ${clientId} -> ${status}`);
        
        // Verificar se a atualização foi persistida
        const clientAfter = await this.getClientById(clientId);
        console.log(`📱 [DEBUG] Cliente após a atualização:`, clientAfter);
        
        if (clientAfter?.status !== status) {
          console.error(`❌ [DEBUG] Status não foi persistido! Esperado: ${status}, Atual: ${clientAfter?.status}`);
        }
      } else {
        console.warn(`⚠️ [DEBUG] Cliente com ID ${clientId} não encontrado ou status não foi alterado`);
      }
    } catch (error) {
      console.error(`❌ [DEBUG] Erro ao atualizar status do cliente ${clientId}:`, error);
      throw error;
    }
  }

  async updateClientStatusAfterOrderDeletion(clientId: string): Promise<void> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`🔄 Verificando status do cliente ${clientId} após exclusão de pedido...`);
      
      const client = await this.getClientById(clientId);
      if (!client) {
        console.warn(`⚠️ Cliente ${clientId} não encontrado`);
        return;
      }

      // Buscar pedidos restantes do cliente
      const clientOrders = await this.getClientOrders(clientId);
      console.log(`📋 Cliente ${clientId} tem ${clientOrders.length} pedidos restantes`);

      if (clientOrders.length === 0) {
        // Se não tem pedidos e estava negativado, voltar para pendente
        if (client.status === 'negativado') {
          console.log(`🔄 Cliente ${clientId} não tem mais pedidos, mudando de 'negativado' para 'pendente'`);
          await this.updateClientStatus(clientId, 'pendente');
        }
      } else {
        // Verificar o tipo de pedidos restantes
        const hasPositiveOrders = clientOrders.some(order => 
          order.status === 'pending' || 
          order.status === 'processed' || 
          order.status === 'delivered'
        );
        const hasNegativeOrders = clientOrders.some(order => 
          order.status === 'negativado' || 
          order.status === 'cancelled'
        );

        if (hasPositiveOrders) {
          console.log(`✅ Cliente ${clientId} tem pedidos positivos, status deve ser 'positivado'`);
          await this.updateClientStatus(clientId, 'positivado');
        } else if (hasNegativeOrders) {
          console.log(`❌ Cliente ${clientId} tem apenas pedidos negativos, mantendo 'negativado'`);
          await this.updateClientStatus(clientId, 'negativado');
        } else {
          console.log(`🔄 Cliente ${clientId} sem pedidos válidos, mudando para 'pendente'`);
          await this.updateClientStatus(clientId, 'pendente');
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao verificar status do cliente ${clientId}:`, error);
    }
  }

  async getClientById(clientId: string): Promise<any | null> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`📱 Getting client by ID: ${clientId}`);
      const result = await this.db!.query('SELECT * FROM clients WHERE id = ?', [clientId]);
      
      if (result.values && result.values.length > 0) {
        console.log('✅ Client found:', result.values[0]);
        return result.values[0];
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
    if (this.db && this.sqlite) {
      try {
        await this.sqlite.closeConnection('sales-app-mobile', false);
        this.db = null;
        this.sqlite = null;
        this.isInitialized = false;
        console.log('📱 Mobile SQLite database closed');
      } catch (error) {
        console.error('❌ Error closing Mobile SQLite database:', error);
        // Even if there's an error, reset the state
        this.db = null;
        this.sqlite = null;
        this.isInitialized = false;
      }
    }
  }

  async getPendingOrders(): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('📱 Getting pending orders from mobile database...');
      const result = await this.db!.query('SELECT * FROM orders WHERE sync_status = ?', ['pending_sync']);
      return result.values || [];
    } catch (error) {
      console.error('❌ Error getting pending orders:', error);
      return [];
    }
  }

  async markOrderAsTransmitted(orderId: string): Promise<void> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`📱 Marking order ${orderId} as transmitted...`);
      const result = await this.db!.run(
        'UPDATE orders SET sync_status = ? WHERE id = ?',
        ['transmitted', orderId]
      );

      if (result.changes && result.changes.changes > 0) {
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
      console.log('📱 Getting offline orders count from mobile database...');
      const result = await this.db!.query('SELECT COUNT(*) AS count FROM orders WHERE sync_status = ? OR sync_status = ?', ['pending_sync', 'error']);
      const count = result.values && result.values[0] ? result.values[0].count : 0;
      return count;
    } catch (error) {
      console.error('❌ Error getting offline orders count:', error);
      return 0;
    }
  }

  async getClientOrders(clientId: string): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`📱 Getting orders for client ID: ${clientId}`);
      const result = await this.db!.query('SELECT * FROM orders WHERE customer_id = ?', [clientId]);
      return result.values || [];
    } catch (error) {
      console.error('❌ Error getting client orders:', error);
      return [];
    }
  }

  async deleteOrder(orderId: string): Promise<void> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`📱 Deleting order with ID: ${orderId}`);
      const result = await this.db!.run('DELETE FROM orders WHERE id = ?', [orderId]);

      if (result.changes && result.changes.changes > 0) {
        console.log(`✅ Order with ID ${orderId} deleted`);
      } else {
        console.warn(`⚠️ Order with ID ${orderId} not found`);
      }
    } catch (error) {
      console.error(`❌ Error deleting order with ID ${orderId}:`, error);
    }
  }

  async deleteAllOrders(): Promise<void> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`📱 Deleting all orders...`);
      await this.db!.run('DELETE FROM orders');
      console.log(`✅ All orders deleted from mobile database`);
    } catch (error) {
      console.error(`❌ Error deleting all orders:`, error);
      throw error;
    }
  }

  async getTransmittedOrders(): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('📱 Getting transmitted orders from mobile database...');
      const result = await this.db!.query('SELECT * FROM orders WHERE sync_status = ?', ['transmitted']);
      return result.values || [];
    } catch (error) {
      console.error('❌ Error getting transmitted orders:', error);
      return [];
    }
  }

  async getAllOrders(): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('📱 Getting all orders from mobile database...');
      const result = await this.db!.query('SELECT * FROM orders');
      return result.values || [];
    } catch (error) {
      console.error('❌ Error getting all orders:', error);
      return [];
    }
  }

  async saveMobileOrder(order: any): Promise<void> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('📱 Saving mobile order to mobile database:', order);
      await this.db!.run(
        `INSERT INTO orders (
          id, customer_id, customer_name, sales_rep_id, date, status, total, 
          sync_status, source_project, payment_method, payment_table_id, reason, notes, items, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          order.id, order.customer_id, order.customer_name, order.sales_rep_id,
          order.date, order.status, order.total, order.sync_status, order.source_project,
          order.payment_method, order.payment_table_id, order.reason, order.notes, JSON.stringify(order.items)
        ]
      );
      console.log('✅ Mobile order saved to mobile database');
    } catch (error) {
      console.error('❌ Error saving mobile order:', error);
    }
  }

  async saveClient(client: any): Promise<void> {
    if (!this.db) await this.initDatabase();
  
    try {
      console.log('📱 Saving client to mobile database:', client);
      await this.db!.run(
        `INSERT OR REPLACE INTO clients (
          id, name, company_name, code, active, phone, address, city, state,
          visit_days, visit_sequence, sales_rep_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          client.id, client.name, client.company_name, client.code, client.active ? 1 : 0,
          client.phone, client.address, client.city, client.state, 
          client.visit_days ? JSON.stringify(client.visit_days) : null,
          client.visit_sequence, client.sales_rep_id, client.status || 'pendente'
        ]
      );
      console.log('✅ Client saved to mobile database');
    } catch (error) {
      console.error('❌ Error saving client:', error);
    }
  }

  async saveProduct(product: any): Promise<void> {
    if (!this.db) await this.initDatabase();
  
    try {
      console.log('📱 Saving product to mobile database:', product);
      await this.db!.run(
        `INSERT OR REPLACE INTO products (
          id, name, code, sale_price, cost_price, stock, active
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          product.id, product.name, product.code, product.sale_price || 0,
          product.cost_price || 0, product.stock || 0, product.active ? 1 : 0
        ]
      );
      console.log('✅ Product saved to mobile database');
    } catch (error) {
      console.error('❌ Error saving product:', error);
    }
  }

  async isClientNegated(clientId: string): Promise<boolean> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`📱 Checking if client ${clientId} is negated...`);
      
      const result = await this.db!.query(
        'SELECT status FROM clients WHERE id = ?',
        [clientId]
      );
      
      if (result.values && result.values.length > 0) {
        const clientStatus = result.values[0].status;
        console.log(`📱 Client ${clientId} status: ${clientStatus}`);
        return clientStatus === 'negativado';
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error checking if client is negated:', error);
      return false;
    }
  }

  async unnegateClient(clientId: string, reason: string): Promise<void> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`📱 Unnegating client with ID: ${clientId}, reason: ${reason}`);
      
      const result = await this.db!.run(
        'UPDATE clients SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['ativo', clientId]
      );

      if (result.changes && result.changes.changes > 0) {
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
      console.log(`📱 Getting client status history for client ID: ${clientId}`);
      // Since SQLite doesn't support complex queries, we'll just return a mock history for now
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
      console.log(`📱 Checking if client ${clientId} has pending orders...`);
      const result = await this.db!.query('SELECT * FROM orders WHERE customer_id = ? AND status = ?', [clientId, 'pending']);
      return result.values && result.values.length > 0;
    } catch (error) {
      console.error('❌ Error checking for pending orders:', error);
      return false;
    }
  }

  async canCreateOrderForClient(clientId: string): Promise<{ canCreate: boolean; reason?: string; existingOrder?: any }> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`📱 Checking if can create order for client ${clientId}...`);

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
      console.log(`📱 Getting active pending order for client ${clientId}...`);
      const result = await this.db!.query('SELECT * FROM orders WHERE customer_id = ? AND status = ?', [clientId, 'pending']);
      
      if (result.values && result.values.length > 0) {
        return result.values[0];
      } else {
        return null;
      }
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
      console.log('📱 Getting payment tables from mobile database...');
      const result = await this.db!.query('SELECT * FROM payment_tables WHERE active = 1');
      console.log(`📱 Found ${result.values?.length || 0} active payment tables:`, result.values);
      return result.values || [];
    } catch (error) {
      console.error('❌ Error getting payment tables:', error);
      return [];
    }
  }

  async getOrderById(orderId: string): Promise<any | null> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`📱 Getting order by ID: ${orderId}`);
      const result = await this.db!.query('SELECT * FROM orders WHERE id = ?', [orderId]);
      
      if (result.values && result.values.length > 0) {
        return result.values[0];
      } else {
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting order by ID:', error);
      return null;
    }
  }

  async authenticateSalesRep(code: string, password: string): Promise<{ success: boolean; salesRep?: any; error?: string }> {
    try {
      console.log('🔐 MobileDatabaseService.authenticateSalesRep - REAL AUTH START for code:', code);
      
      // Buscar o vendedor no Supabase pelo código
      const { data: salesRep, error: fetchError } = await supabase
        .from('sales_reps')
        .select('*')
        .eq('code', parseInt(code))
        .eq('active', true)
        .single();

      if (fetchError) {
        console.log('❌ Error fetching sales rep:', fetchError);
        return { success: false, error: 'Vendedor não encontrado' };
      }

      if (!salesRep) {
        console.log('❌ Sales rep not found for code:', code);
        return { success: false, error: 'Código do vendedor não encontrado' };
      }

      console.log('📊 Sales rep found:', {
        id: salesRep.id,
        name: salesRep.name,
        code: salesRep.code,
        hasPassword: !!salesRep.password
      });

      // Verificar a senha usando bcrypt
      if (!salesRep.password) {
        console.log('❌ Sales rep has no password set');
        return { success: false, error: 'Senha não configurada para este vendedor' };
      }

      console.log('🔍 Comparing passwords...');
      const passwordMatch = await bcrypt.compare(password, salesRep.password);
      
      if (!passwordMatch) {
        console.log('❌ Password does not match');
        return { success: false, error: 'Senha incorreta' };
      }

      console.log('✅ Authentication successful');
      
      const authenticatedSalesRep = {
        id: salesRep.id,
        name: salesRep.name,
        code: salesRep.code.toString(),
        email: salesRep.email
      };

      return { 
        success: true, 
        salesRep: authenticatedSalesRep
      };
      
    } catch (error) {
      console.error('❌ MobileDatabaseService.authenticateSalesRep error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro na autenticação' 
      };
    }
  }
}

export default MobileDatabaseService;
