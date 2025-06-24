import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { ensureTypedArray, safeJsonParse, validateOrderData, logAndroidDebug, safeCast } from '@/utils/androidDataValidator';

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

      // ✅ NOVA ESTRUTURA: Tabela products COMPLETA com todas as colunas necessárias
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          code INTEGER,
          sale_price REAL DEFAULT 0,
          cost_price REAL DEFAULT 0,
          stock REAL DEFAULT 0,
          active BOOLEAN DEFAULT 1,
          unit TEXT,
          has_subunit BOOLEAN DEFAULT 0,
          subunit TEXT,
          subunit_ratio REAL,
          max_discount_percent REAL,
          category_id TEXT,
          category_name TEXT,
          group_name TEXT,
          brand_name TEXT,
          main_unit_id TEXT,
          sub_unit_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // ✅ MIGRAÇÃO: Verificar se tabela products existe com estrutura antiga e migrar
      console.log('📱 [MIGRATION] Checking if products table needs migration...');
      
      try {
        // Tentar verificar se a coluna 'unit' existe
        const result = await this.db.query('PRAGMA table_info(products)');
        const columns = result.values || [];
        const hasUnitColumn = columns.some((col: any) => col.name === 'unit');
        
        if (!hasUnitColumn) {
          console.log('📱 [MIGRATION] Products table needs migration - adding missing columns...');
          
          // Adicionar colunas faltantes uma por uma
          const newColumns = [
            'unit TEXT',
            'has_subunit BOOLEAN DEFAULT 0',
            'subunit TEXT',
            'subunit_ratio REAL',
            'max_discount_percent REAL',
            'category_id TEXT',
            'category_name TEXT',
            'group_name TEXT',
            'brand_name TEXT',
            'main_unit_id TEXT',
            'sub_unit_id TEXT'
          ];
          
          for (const column of newColumns) {
            try {
              await this.db.execute(`ALTER TABLE products ADD COLUMN ${column}`);
              console.log(`✅ [MIGRATION] Added column: ${column}`);
            } catch (error) {
              // Coluna já existe ou erro - continuar
              console.log(`⚠️ [MIGRATION] Column might already exist: ${column}`);
            }
          }
          
          console.log('✅ [MIGRATION] Products table migration completed');
        } else {
          console.log('✅ [MIGRATION] Products table already has correct structure');
        }
      } catch (migrationError) {
        console.error('❌ [MIGRATION] Error during products table migration:', migrationError);
        // Continuar mesmo com erro de migração
      }

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
      
      logAndroidDebug('getClients result', result);
      
      // ✅ CORREÇÃO: Garantir array válido sempre com validação
      const clients = ensureTypedArray(result.values || result, (item: any) => !!item?.id);
      
      console.log(`📱 [ANDROID] Raw clients from SQLite: ${clients.length}`);
      
      // 🔄 CORREÇÃO: Processar visit_days para garantir que seja array
      const processedClients = clients.map((clientData: any) => {
        const client = safeCast<any>(clientData);
        if (!client) return null;
        
        let visitDays = client.visit_days;
        
        // Se visit_days é string, tentar fazer parse
        if (typeof visitDays === 'string' && visitDays) {
          visitDays = safeJsonParse(visitDays) || [];
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
      }).filter(client => client !== null);
      
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
      
      logAndroidDebug('getVisitRoutes result', result);
      
      return ensureTypedArray(result.values || result, (item: any) => !!item?.id);
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
      
      logAndroidDebug('getOrders result', result);
      
      const orders = ensureTypedArray(result.values || result, (item: any) => !!item?.id);
      
      // ✅ CORREÇÃO: Validar e normalizar cada pedido
      return orders.map(order => validateOrderData(order)).filter(order => order !== null);
    } catch (error) {
      console.error('❌ Error getting orders:', error);
      return [];
    }
  }

  async getProducts(): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('📱 [ANDROID] Getting products from SQLite database...');
      const result = await this.db!.query('SELECT * FROM products');
      
      logAndroidDebug('getProducts result', result);
      
      const products = ensureTypedArray(result.values || result, (item: any) => !!item?.id);
      
      console.log(`📱 [ANDROID] Found ${products.length} products in SQLite`);
      
      // ✅ NOVO: Log detalhado das unidades dos produtos para debug
      products.forEach((product, index) => {
        if (index < 5) { // Log apenas os primeiros 5 produtos para não poluir
          console.log(`📱 [ANDROID] Product ${index + 1}:`, {
            id: product.id,
            name: product.name,
            code: product.code,
            unit: product.unit,
            has_subunit: product.has_subunit,
            subunit: product.subunit,
            subunit_ratio: product.subunit_ratio,
            category_name: product.category_name,
            group_name: product.group_name,
            brand_name: product.brand_name
          });
        }
      });
      
      return products;
    } catch (error) {
      console.error('❌ [ANDROID] Error getting products:', error);
      return [];
    }
  }

  async getPendingSyncItems(table: string): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`📱 Getting pending sync items from ${table}...`);
      const result = await this.db!.query(`SELECT * FROM ${table} WHERE sync_status = ?`, ['pending_sync']);
      
      logAndroidDebug(`getPendingSyncItems ${table} result`, result);
      
      return ensureTypedArray(result.values || result, (item: any) => !!item?.id);
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
      
      logAndroidDebug('getClientById result', result);
      
      const clients = ensureTypedArray(result.values || result, (item: any) => !!item?.id);
      
      if (clients.length > 0) {
        const client = validateOrderData(clients[0]);
        console.log('✅ Client found:', client);
        return client;
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
      
      logAndroidDebug('getPendingOrders result', result);
      
      const orders = ensureTypedArray(result.values || result, (item: any) => !!item?.id);
      
      // ✅ CORREÇÃO CRÍTICA: Validar e normalizar cada pedido
      const validatedOrders = orders.map(order => validateOrderData(order)).filter(order => order !== null);
      
      console.log(`📱 [ANDROID] Validated ${validatedOrders.length} pending orders from ${orders.length} raw orders`);
      
      return validatedOrders;
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
      
      logAndroidDebug('getClientOrders result', result);
      
      const orders = ensureTypedArray(result.values || result, (item: any) => !!item?.id);
      
      return orders.map(order => validateOrderData(order)).filter(order => order !== null);
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
      
      logAndroidDebug('getTransmittedOrders result', result);
      
      const orders = ensureTypedArray(result.values || result, (item: any) => !!item?.id);
      
      return orders.map(order => validateOrderData(order)).filter(order => order !== null);
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
      
      logAndroidDebug('getAllOrders result', result);
      
      const orders = ensureTypedArray(result.values || result, (item: any) => !!item?.id);
      
      return orders.map(order => validateOrderData(order)).filter(order => order !== null);
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
      console.log(`📱 [ANDROID] Saving ${productsArray.length} products to SQLite database...`);
  
      for (const product of productsArray) {
        console.log(`📱 [ANDROID] Saving product: ${product.name}`, {
          id: product.id,
          code: product.code,
          unit: product.unit,
          has_subunit: product.has_subunit,
          subunit: product.subunit,
          subunit_ratio: product.subunit_ratio,
          category_name: product.category_name,
          group_name: product.group_name,
          brand_name: product.brand_name,
          max_discount_percent: product.max_discount_percent
        });

        await this.db!.run(
          `INSERT OR REPLACE INTO products (
            id, name, code, sale_price, cost_price, stock, active,
            unit, has_subunit, subunit, subunit_ratio, max_discount_percent,
            category_id, category_name, group_name, brand_name, main_unit_id, sub_unit_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            product.id, 
            product.name, 
            product.code, 
            product.sale_price,
            product.cost_price, 
            product.stock, 
            product.active,
            product.unit,
            product.has_subunit ? 1 : 0,
            product.subunit,
            product.subunit_ratio,
            product.max_discount_percent,
            product.category_id,
            product.category_name,
            product.group_name,
            product.brand_name,
            product.main_unit_id,
            product.sub_unit_id
          ]
        );
      }
  
      console.log('✅ [ANDROID] Products saved to SQLite database');
      
      // ✅ VERIFICAÇÃO: Contar produtos salvos e verificar unidades
      const verification = await this.db!.query('SELECT COUNT(*) as total, COUNT(CASE WHEN unit IS NOT NULL AND unit != "" THEN 1 END) as with_units FROM products WHERE active = 1');
      const stats = verification.values?.[0];
      console.log('📱 [ANDROID] Products verification after save:', {
        total: stats?.total || 0,
        withUnits: stats?.with_units || 0,
        withoutUnits: (stats?.total || 0) - (stats?.with_units || 0)
      });
      
    } catch (error) {
      console.error('❌ [ANDROID] Error saving products:', error);
      throw error;
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
      
      logAndroidDebug('isClientNegated result', result);
      
      const clients = ensureTypedArray(result.values || result, (item: any) => !!item);
      
      if (clients.length > 0) {
        const client = safeCast<any>(clients[0]);
        const clientStatus = client?.status;
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
      
      logAndroidDebug('getActivePendingOrder result', result);
      
      const orders = ensureTypedArray(result.values || result, (item: any) => !!item?.id);
      
      if (orders.length > 0) {
        return validateOrderData(orders[0]);
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
      
      logAndroidDebug('getPaymentTables result', result);
      
      const paymentTables = ensureTypedArray(result.values || result, (item: any) => !!item);
      
      console.log(`📱 Found ${paymentTables.length} active payment tables:`, paymentTables);
      return paymentTables;
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
      console.log(`📱 [ANDROID] Getting order by ID: ${orderId}`);
      
      // ✅ CORREÇÃO: Buscar dados básicos do pedido com validação robusta
      const orderResult = await this.db!.query('SELECT * FROM orders WHERE id = ?', [orderId]);
      
      logAndroidDebug('getOrderById orderResult', orderResult);
      
      const orders = ensureTypedArray(orderResult.values || orderResult, (item: any) => !!item?.id);
      
      if (orders.length === 0) {
        console.log('❌ [ANDROID] Order not found');
        return null;
      }

      const order = validateOrderData(orders[0]);
      
      if (!order) {
        console.log('❌ [ANDROID] Order validation failed');
        return null;
      }
      
      console.log('✅ [ANDROID] Order found and validated:', {
        id: order.id,
        customer_name: order.customer_name,
        total: order.total,
        status: order.status,
        itemsCount: order.items?.length || 0
      });

      // ✅ CORREÇÃO: Tentar buscar itens da tabela order_items se existir
      try {
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
        
        logAndroidDebug('getOrderById itemsResult', itemsResult);
        
        const orderItems = ensureTypedArray(itemsResult.values || itemsResult);

        console.log(`📱 [ANDROID] Found ${orderItems.length} items for order ${orderId}`);

        // Se não há itens na tabela order_items mas há itens no JSON, usar JSON
        if (orderItems.length === 0 && order.items && Array.isArray(order.items) && order.items.length > 0) {
          console.log(`📱 [ANDROID] Using JSON items from order field: ${order.items.length} items`);
        } else if (orderItems.length > 0) {
          // Usar itens da tabela order_items se disponível
          order.items = orderItems;
          console.log(`📱 [ANDROID] Using items from order_items table: ${orderItems.length} items`);
        }
      } catch (itemsError) {
        console.error('❌ [ANDROID] Error getting order items (using fallback):', itemsError);
        // Manter os itens do JSON se a busca na tabela falhar
      }

      return order;
    } catch (error) {
      console.error('❌ [ANDROID] Error getting order by ID:', error);
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
