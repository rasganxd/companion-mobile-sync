import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

class SQLiteDatabaseService {
  private static instance: SQLiteDatabaseService | null = null;
  private sqlite: SQLiteConnection | null = null;
  private db: SQLiteDBConnection | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): SQLiteDatabaseService {
    if (!SQLiteDatabaseService.instance) {
      SQLiteDatabaseService.instance = new SQLiteDatabaseService();
    }
    return SQLiteDatabaseService.instance;
  }

  async initDatabase(): Promise<void> {
    if (this.isInitialized && this.db) {
      console.log('📱 SQLite database already initialized');
      return;
    }

    try {
      console.log('📱 Initializing SQLite database...');
      
      if (!Capacitor.isNativePlatform()) {
        throw new Error('SQLite only works on native platforms');
      }

      this.sqlite = new SQLiteConnection(CapacitorSQLite);
      
      // Create or open database
      this.db = await this.sqlite.createConnection('sales-app', false, 'no-encryption', 1, false);
      await this.db.open();

      // Create tables
      await this.createTables();
      
      this.isInitialized = true;
      console.log('✅ SQLite database initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize SQLite database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      console.log('📱 Creating SQLite tables...');

      // Clients table with status field
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS clients (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          company_name TEXT,
          code INTEGER,
          active BOOLEAN DEFAULT 1,
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
          active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Orders table - ✅ INCLUIR payment_table_id na estrutura
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
          active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // ✅ CORREÇÃO: Tabela payment_tables com TODAS as colunas necessárias
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS payment_tables (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          type TEXT,
          payable_to TEXT,
          payment_location TEXT,
          active BOOLEAN DEFAULT 1,
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

      console.log('✅ SQLite tables created successfully');
    } catch (error) {
      console.error('❌ Error creating SQLite tables:', error);
      throw error;
    }
  }

  async getClients(): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('📱 [ANDROID] Getting clients from SQLite database...');
      const result = await this.db!.query('SELECT * FROM clients');
      const clients = result.values || [];
      
      console.log(`📱 [ANDROID] Raw clients from SQLite: ${clients.length}`);
      
      // 🔄 CORREÇÃO: Processar visit_days para garantir que seja array
      const processedClients = clients.map(client => {
        let visitDays = client.visit_days;
        
        // Se visit_days é string, tentar fazer parse
        if (typeof visitDays === 'string' && visitDays) {
          try {
            visitDays = JSON.parse(visitDays);
          } catch (e) {
            console.warn(`📱 [ANDROID] Failed to parse visit_days for client ${client.name}:`, visitDays);
            visitDays = [];
          }
        }
        
        // Se não é array, transformar em array vazio
        if (!Array.isArray(visitDays)) {
          visitDays = [];
        }
        
        console.log(`📱 [ANDROID] Client ${client.name}:`, {
          id: client.id,
          visit_days: visitDays,
          visit_sequence: client.visit_sequence,
          sales_rep_id: client.sales_rep_id,
          active: client.active
        });
        
        return {
          ...client,
          visit_days: visitDays
        };
      });
      
      console.log(`📱 [ANDROID] Processed clients: ${processedClients.length}`);
      return processedClients;
    } catch (error) {
      console.error('❌ [ANDROID] Error getting clients:', error);
      return [];
    }
  }

  async getVisitRoutes(): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('📱 Getting visit routes from SQLite database...');
      const result = await this.db!.query('SELECT * FROM visit_routes');
      return result.values || [];
    } catch (error) {
      console.error('❌ Error getting visit routes:', error);
      return [];
    }
  }

  async getOrders(clientId?: string): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`📱 Getting orders from SQLite database for client ID: ${clientId}`);
      let query = 'SELECT * FROM orders';
      let values: any[] = [];

      if (clientId) {
        query += ' WHERE customer_id = ?';
        values = [clientId];
      }

      const result = await this.db!.query(query, values);
      return result.values || [];
    } catch (error) {
      console.error('❌ Error getting orders:', error);
      return [];
    }
  }

  async getProducts(): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('📱 Getting products from SQLite database...');
      const result = await this.db!.query('SELECT * FROM products');
      return result.values || [];
    } catch (error) {
      console.error('❌ Error getting products:', error);
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
        'INSERT INTO sync_log (type, status, details) VALUES (?, ?, ?)',
        [type, status, details]
      );
      console.log('✅ Sync event logged');
    } catch (error) {
      console.error('❌ Error logging sync event:', error);
    }
  }

  async saveOrder(order: any): Promise<void> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('📱 Saving order to SQLite database:', {
        id: order.id,
        customer_name: order.customer_name,
        payment_table_id: order.payment_table_id,
        status: order.status,
        total: order.total
      });
      
      await this.db!.run(
        `INSERT INTO orders (
          id, customer_id, customer_name, sales_rep_id, date, status, total, 
          sync_status, source_project, payment_method, payment_table_id, reason, notes, items
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.id, order.customer_id, order.customer_name, order.sales_rep_id,
          order.date, order.status, order.total, order.sync_status, order.source_project,
          order.payment_method, order.payment_table_id, order.reason, order.notes, JSON.stringify(order.items)
        ]
      );
      console.log('✅ Order saved to SQLite database with payment_table_id:', order.payment_table_id);
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
        await this.sqlite.closeConnection('sales-app', false);
        this.db = null;
        this.sqlite = null;
        this.isInitialized = false;
        console.log('📱 SQLite database closed');
      } catch (error) {
        console.error('❌ Error closing SQLite database:', error);
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
      console.log('📱 Getting pending orders from SQLite database...');
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
      console.log('📱 Getting offline orders count from SQLite database...');
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
      console.log(`✅ All orders deleted from SQLite`);
    } catch (error) {
      console.error(`❌ Error deleting all orders:`, error);
      throw error;
    }
  }

  async getTransmittedOrders(): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('📱 Getting transmitted orders from SQLite database...');
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
      console.log('📱 Getting all orders from SQLite database...');
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
      console.log('📱 Saving mobile order to SQLite database:', order);
      await this.db!.run(
        `INSERT INTO orders (
          id, customer_id, customer_name, sales_rep_id, date, status, total, 
          sync_status, source_project, payment_method, payment_table_id, reason, notes, items
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.id, order.customer_id, order.customer_name, order.sales_rep_id,
          order.date, order.status, order.total, order.sync_status, order.source_project,
          order.payment_method, order.payment_table_id, order.reason, order.notes, JSON.stringify(order.items)
        ]
      );
      console.log('✅ Mobile order saved to SQLite database');
    } catch (error) {
      console.error('❌ Error saving mobile order:', error);
    }
  }

  async saveClients(clientsArray: any[]): Promise<void> {
    if (!this.db) await this.initDatabase();
  
    try {
      console.log(`📱 [ANDROID] Saving ${clientsArray.length} clients to SQLite database...`);
  
      for (const client of clientsArray) {
        // 🔄 CORREÇÃO: Garantir que visit_days seja salvo como string JSON
        let visitDaysString = null;
        if (client.visit_days) {
          if (Array.isArray(client.visit_days)) {
            visitDaysString = JSON.stringify(client.visit_days);
          } else if (typeof client.visit_days === 'string') {
            // Verificar se já é JSON válido
            try {
              JSON.parse(client.visit_days);
              visitDaysString = client.visit_days;
            } catch (e) {
              // Se não é JSON válido, criar array com esse valor
              visitDaysString = JSON.stringify([client.visit_days]);
            }
          }
        }
        
        console.log(`📱 [ANDROID] Saving client ${client.name}:`, {
          id: client.id,
          visit_days_original: client.visit_days,
          visit_days_saved: visitDaysString,
          visit_sequence: client.visit_sequence,
          sales_rep_id: client.sales_rep_id
        });

        await this.db!.run(
          `INSERT OR REPLACE INTO clients (
            id, name, company_name, code, active, phone, address, city, state,
            visit_days, visit_sequence, sales_rep_id, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            client.id, client.name, client.company_name, client.code, client.active,
            client.phone, client.address, client.city, client.state, visitDaysString,
            client.visit_sequence, client.sales_rep_id, client.status || 'pendente'
          ]
        );
      }
  
      console.log('✅ [ANDROID] Clients saved to SQLite database');
      
      // 🔄 VERIFICAÇÃO: Contar clientes salvos por vendedor
      const verification = await this.db!.query('SELECT sales_rep_id, COUNT(*) as count FROM clients WHERE active = 1 GROUP BY sales_rep_id');
      console.log('📱 [ANDROID] Clients count by sales_rep_id:', verification.values);
      
    } catch (error) {
      console.error('❌ [ANDROID] Error saving clients:', error);
      throw error;
    }
  }

  async saveProducts(productsArray: any[]): Promise<void> {
    if (!this.db) await this.initDatabase();
  
    try {
      console.log(`📱 Saving ${productsArray.length} products to SQLite database...`);
  
      for (const product of productsArray) {
        await this.db!.run(
          `INSERT OR REPLACE INTO products (
            id, name, code, sale_price, cost_price, stock, active
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            product.id, product.name, product.code, product.sale_price,
            product.cost_price, product.stock, product.active
          ]
        );
      }
  
      console.log('✅ Products saved to SQLite database');
    } catch (error) {
      console.error('❌ Error saving products:', error);
    }
  }

  async saveClient(client: any): Promise<void> {
    if (!this.db) await this.initDatabase();
  
    try {
      console.log('📱 Saving client to SQLite database:', client);
      await this.db!.run(
        `INSERT OR REPLACE INTO clients (
          id, name, company_name, code, active, phone, address, city, state,
          visit_days, visit_sequence, sales_rep_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          client.id, client.name, client.company_name, client.code, client.active,
          client.phone, client.address, client.city, client.state, client.visit_days,
          client.visit_sequence, client.sales_rep_id, client.status
        ]
      );
      console.log('✅ Client saved to SQLite database');
    } catch (error) {
      console.error('❌ Error saving client:', error);
    }
  }

  async saveProduct(product: any): Promise<void> {
    if (!this.db) await this.initDatabase();
  
    try {
      console.log('📱 Saving product to SQLite database:', product);
      await this.db!.run(
        `INSERT OR REPLACE INTO products (
          id, name, code, sale_price, cost_price, stock, active
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          product.id, product.name, product.code, product.sale_price,
          product.cost_price, product.stock, product.active
        ]
      );
      console.log('✅ Product saved to SQLite database');
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
    console.log('📱 [ANDROID] getCustomers called - redirecting to getClients');
    return this.getClients();
  }

  async getPaymentTables(): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('📱 Getting payment tables from SQLite database...');
      const result = await this.db!.query('SELECT * FROM payment_tables WHERE active = 1');
      console.log(`📱 Found ${result.values?.length || 0} active payment tables:`, result.values);
      return result.values || [];
    } catch (error) {
      console.error('❌ Error getting payment tables:', error);
      return [];
    }
  }

  async savePaymentTables(paymentTablesArray: any[]): Promise<void> {
    if (!this.db) await this.initDatabase();
  
    try {
      console.log(`📱 Saving ${paymentTablesArray.length} payment tables to SQLite database...`);
  
      for (const paymentTable of paymentTablesArray) {
        console.log('📱 Saving payment table:', {
          id: paymentTable.id,
          name: paymentTable.name,
          type: paymentTable.type,
          active: paymentTable.active,
          description: paymentTable.description,
          payable_to: paymentTable.payable_to,
          payment_location: paymentTable.payment_location
        });

        await this.db!.run(
          `INSERT OR REPLACE INTO payment_tables (
            id, name, description, type, payable_to, payment_location, active, installments
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            paymentTable.id, 
            paymentTable.name, 
            paymentTable.description || null,
            paymentTable.type || null,
            paymentTable.payable_to || null,
            paymentTable.payment_location || null,
            paymentTable.active !== false ? 1 : 0, // Garantir que seja boolean convertido para integer
            paymentTable.installments ? JSON.stringify(paymentTable.installments) : null
          ]
        );
      }
  
      console.log('✅ Payment tables saved to SQLite database');
      
      // Verificar se foram salvas corretamente
      const savedTables = await this.getPaymentTables();
      console.log(`✅ Verification: ${savedTables.length} payment tables now in database`);
    } catch (error) {
      console.error('❌ Error saving payment tables:', error);
      throw error;
    }
  }

  async getOrderById(orderId: string): Promise<any | null> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`📱 Getting order by ID: ${orderId}`);
      
      // Buscar dados básicos do pedido
      const orderResult = await this.db!.query('SELECT * FROM orders WHERE id = ?', [orderId]);
      
      if (!orderResult.values || orderResult.values.length === 0) {
        console.log('❌ Order not found');
        return null;
      }

      const order = orderResult.values[0];
      console.log('✅ Order found:', order);

      // Buscar itens do pedido com nomes dos produtos
      const itemsQuery = `
        SELECT 
          oi.*,
          p.name as product_name
        FROM order_items oi
        LEFT JOIN products p ON CAST(oi.product_code AS TEXT) = CAST(p.code AS TEXT)
        WHERE oi.order_id = ?
        ORDER BY oi.created_at
      `;
      
      const itemsResult = await this.db!.query(itemsQuery, [orderId]);
      const orderItems = itemsResult.values || [];

      console.log(`📱 Found ${orderItems.length} items for order ${orderId}`);

      // Se não há itens na tabela order_items, verificar se há itens no campo JSON
      if (orderItems.length === 0 && order.items) {
        try {
          const jsonItems = JSON.parse(order.items);
          if (Array.isArray(jsonItems) && jsonItems.length > 0) {
            console.log(`📱 Using JSON items from order field: ${jsonItems.length} items`);
            order.items = jsonItems;
          }
        } catch (e) {
          console.log('📱 Could not parse JSON items from order');
        }
      } else {
        // Usar itens da tabela order_items
        order.items = orderItems;
      }

      return order;
    } catch (error) {
      console.error('❌ Error getting order by ID:', error);
      return null;
    }
  }

  async clearMockData(): Promise<void> {
    if (!this.db) await this.initDatabase();
    
    console.log('🧹 Clearing mock data from SQLite database...');
    
    await Promise.all([
      this.db!.run('DELETE FROM clients'),
      this.db!.run('DELETE FROM visit_routes'),
      this.db!.run('DELETE FROM orders'),
      this.db!.run('DELETE FROM products'),
      this.db!.run('DELETE FROM payment_tables')
    ]);
    
    console.log('✅ Mock data cleared from SQLite database');
  }
}

export default SQLiteDatabaseService;
