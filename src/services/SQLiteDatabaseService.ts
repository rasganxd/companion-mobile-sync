import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { v4 as uuidv4 } from 'uuid';

class SQLiteDatabaseService {
  private db: SQLiteDBConnection | null = null;
  private sqliteConnection: SQLiteConnection | null = null;
  private static instance: SQLiteDatabaseService;

  private constructor() {
    console.log('📱 SQLiteDatabaseService constructor called');
  }

  static getInstance(): SQLiteDatabaseService {
    if (!SQLiteDatabaseService.instance) {
      SQLiteDatabaseService.instance = new SQLiteDatabaseService();
    }
    return SQLiteDatabaseService.instance;
  }

  async initDatabase(): Promise<void> {
    try {
      console.log('📱 Initializing SQLite database with Capacitor...');
      
      // Verificar se estamos em ambiente compatível
      if (typeof window === 'undefined') {
        throw new Error('Window object not available - not in browser environment');
      }

      // Check if SQLite is available
      if (!(window as any).Capacitor) {
        throw new Error('Capacitor not available - not in Capacitor environment');
      }

      if (!CapacitorSQLite) {
        throw new Error('CapacitorSQLite plugin not available');
      }

      // Verificar se jeep-sqlite está presente para ambiente web
      const isWeb = !(window as any).Capacitor.isNativePlatform || !(window as any).Capacitor.isNativePlatform();
      if (isWeb) {
        const jeepSqlite = document.querySelector('jeep-sqlite');
        if (!jeepSqlite) {
          throw new Error('jeep-sqlite element not found in DOM - required for web SQLite');
        }
        console.log('🌐 jeep-sqlite element found, proceeding with web SQLite');
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
      console.log('✅ SQLite database initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing SQLite database:', error);
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
        sync_status TEXT DEFAULT 'pending_sync',
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        customer_name TEXT,
        order_date TEXT NOT NULL,
        total REAL NOT NULL,
        status TEXT NOT NULL,
        sync_status TEXT DEFAULT 'pending_sync',
        updated_at TEXT,
        notes TEXT,
        payment_method TEXT,
        reason TEXT,
        items TEXT,
        date TEXT,
        source_project TEXT DEFAULT 'mobile',
        payment_table_id TEXT,
        FOREIGN KEY (customer_id) REFERENCES clients (id)
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        sale_price REAL,
        cost_price REAL,
        stock INTEGER NOT NULL,
        code INTEGER,
        unit TEXT DEFAULT 'UN',
        has_subunit BOOLEAN DEFAULT FALSE,
        subunit TEXT,
        subunit_ratio REAL DEFAULT 1,
        max_discount_percent REAL,
        image_url TEXT,
        sync_status TEXT DEFAULT 'pending_sync',
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS visit_routes (
        id TEXT PRIMARY KEY,
        day TEXT NOT NULL,
        visited INTEGER DEFAULT 0,
        remaining INTEGER DEFAULT 0,
        total INTEGER DEFAULT 0,
        sync_status TEXT DEFAULT 'pending_sync',
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS payment_tables (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT,
        active INTEGER DEFAULT 1,
        sync_status TEXT DEFAULT 'pending_sync',
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
    console.log('✅ Tables created successfully');

    // Verificar e adicionar colunas ausentes na tabela products se necessário
    await this.updateProductsTableSchema();
  }

  private async updateProductsTableSchema(): Promise<void> {
    if (!this.db) return;

    try {
      // Verificar se as colunas necessárias existem
      const tableInfo = await this.db.query("PRAGMA table_info(products)");
      const existingColumns = tableInfo.values?.map((row: any) => row.name) || [];

      console.log('📋 Colunas existentes na tabela products:', existingColumns);

      const requiredColumns = [
        { name: 'sale_price', type: 'REAL' },
        { name: 'cost_price', type: 'REAL' },
        { name: 'code', type: 'INTEGER' },
        { name: 'unit', type: 'TEXT DEFAULT "UN"' },
        { name: 'has_subunit', type: 'BOOLEAN DEFAULT FALSE' },
        { name: 'subunit', type: 'TEXT' },
        { name: 'subunit_ratio', type: 'REAL DEFAULT 1' },
        { name: 'max_discount_percent', type: 'REAL' }
      ];

      for (const column of requiredColumns) {
        if (!existingColumns.includes(column.name)) {
          console.log(`📋 Adicionando coluna ausente: ${column.name}`);
          await this.db.run(`ALTER TABLE products ADD COLUMN ${column.name} ${column.type}`);
        }
      }

      console.log('✅ Esquema da tabela products atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar esquema da tabela products:', error);
    }
  }

  async getClients(): Promise<any[]> {
    if (!this.db) await this.initDatabase();
    try {
      const result = await this.db!.query('SELECT * FROM clients');
      return result.values || [];
    } catch (error) {
      console.error('❌ Error getting clients:', error);
      return [];
    }
  }

  async getCustomers(): Promise<any[]> {
    // Alias for getClients to match the interface
    return this.getClients();
  }

  async getPaymentTables(): Promise<any[]> {
    if (!this.db) await this.initDatabase();
    try {
      const result = await this.db!.query('SELECT * FROM payment_tables WHERE active = 1');
      const paymentTables = result.values || [];
      
      console.log(`💳 SQLite: Encontradas ${paymentTables.length} tabelas de pagamento no banco local`);
      
      paymentTables.forEach((table, index) => {
        console.log(`💳 SQLite Tabela ${index + 1}:`, {
          id: table.id,
          name: table.name,
          type: table.type,
          active: table.active
        });
      });
      
      return paymentTables;
    } catch (error) {
      console.error('❌ Error getting payment tables from SQLite:', error);
      return [];
    }
  }

  async savePaymentTables(paymentTablesArray: any[]): Promise<void> {
    if (!this.db) await this.initDatabase();
    
    try {
      console.log(`💳 SQLite: Salvando ${paymentTablesArray.length} tabelas de pagamento...`);
      
      // Limpar tabelas existentes
      await this.db!.run('DELETE FROM payment_tables');
      
      // Salvar novas tabelas
      for (const paymentTable of paymentTablesArray) {
        const now = new Date().toISOString();
        await this.db!.run(
          'INSERT INTO payment_tables (id, name, description, type, active, sync_status, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            paymentTable.id,
            paymentTable.name,
            paymentTable.description || '',
            paymentTable.type || '',
            paymentTable.active ? 1 : 0,
            'synced',
            now
          ]
        );
        console.log(`💳 SQLite: Tabela salva: ${paymentTable.name} (${paymentTable.id})`);
      }
      
      console.log(`✅ SQLite: Successfully saved ${paymentTablesArray.length} payment tables`);
    } catch (error) {
      console.error('❌ SQLite Error saving payment tables:', error);
      throw error;
    }
  }

  async saveClient(client: any): Promise<void> {
    if (!this.db) await this.initDatabase();
    try {
      const now = new Date().toISOString();
      await this.db!.run(
        'INSERT OR REPLACE INTO clients (id, name, phone, address, email, lastVisit, sync_status, updated_at, sales_rep_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          client.id,
          client.name,
          client.phone || '',
          client.address || '',
          client.email || '',
          client.lastVisit || null,
          client.sync_status || 'synced',
          now,
          client.sales_rep_id
        ]
      );
      console.log(`📝 SQLite: Saved client ${client.name} (${client.id}) for sales_rep: ${client.sales_rep_id}`);
    } catch (error) {
      console.error('❌ Error saving client to SQLite:', error);
    }
  }

  async saveClients(clientsArray: any[]): Promise<void> {
    console.log(`💾 SQLite: Saving ${clientsArray.length} clients`);
    
    for (const client of clientsArray) {
      await this.saveClient(client);
    }
    
    console.log(`✅ SQLite: Successfully saved ${clientsArray.length} clients`);
  }

  async saveProduct(product: any): Promise<void> {
    if (!this.db) await this.initDatabase();
    try {
      const now = new Date().toISOString();
      
      console.log('💾 Salvando produto no SQLite:', {
        id: product.id,
        name: product.name,
        code: product.code,
        sale_price: product.sale_price,
        cost_price: product.cost_price,
        max_discount_percent: product.max_discount_percent,
        unit: product.unit,
        has_subunit: product.has_subunit
      });

      await this.db!.run(
        'INSERT OR REPLACE INTO products (id, name, description, price, sale_price, cost_price, stock, code, unit, has_subunit, subunit, subunit_ratio, max_discount_percent, image_url, sync_status, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          product.id,
          product.name,
          product.description || '',
          product.price || product.sale_price || 0, // Usar sale_price como fallback para price
          product.sale_price || product.price || 0,
          product.cost_price || 0,
          product.stock || 0,
          product.code || null,
          product.unit || 'UN',
          product.has_subunit ? 1 : 0, // SQLite usa 1/0 para boolean
          product.subunit || null,
          product.subunit_ratio || 1,
          product.max_discount_percent || null,
          product.image_url || '',
          product.sync_status || 'synced',
          now
        ]
      );
      
      console.log(`✅ SQLite: Produto salvo com sucesso: ${product.name} (desconto máximo: ${product.max_discount_percent || 'Nenhum'}%)`);
    } catch (error) {
      console.error('❌ Error saving product to SQLite:', error);
      console.error('❌ Produto que causou erro:', product);
    }
  }

  async saveProducts(productsArray: any[]): Promise<void> {
    console.log(`💾 SQLite: Saving ${productsArray.length} products`);
    
    for (const product of productsArray) {
      await this.saveProduct(product);
    }
    
    console.log(`✅ SQLite: Successfully saved ${productsArray.length} products`);
  }

  async getVisitRoutes(): Promise<any[]> {
    if (!this.db) await this.initDatabase();
    try {
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
      let query = 'SELECT * FROM orders WHERE sync_status != ?';
      let values: string[] = ['deleted'];
      
      if (clientId) {
        query += ' AND customer_id = ?';
        values.push(clientId);
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
      const result = await this.db!.query('SELECT * FROM products');
      const products = result.values || [];
      
      console.log(`📦 SQLite: Carregados ${products.length} produtos do banco local`);
      
      // Log detalhado dos primeiros produtos para debug
      products.slice(0, 3).forEach((product, index) => {
        console.log(`📦 Produto ${index + 1} do SQLite:`, {
          id: product.id,
          name: product.name,
          code: product.code,
          sale_price: product.sale_price,
          max_discount_percent: product.max_discount_percent,
          unit: product.unit,
          has_subunit: product.has_subunit
        });
      });
      
      return products;
    } catch (error) {
      console.error('❌ Error getting products:', error);
      return [];
    }
  }

  async getPendingSyncItems(table: string): Promise<any[]> {
    if (!this.db) await this.initDatabase();
    try {
      const result = await this.db!.query(
        `SELECT * FROM ${table} WHERE sync_status = ?`, 
        ['pending_sync']
      );
      
      const items = result.values || [];
      
      console.log(`📋 [${table}] Total pending sync items: ${items.length}`);
      
      // Parse items field for orders if it exists
      if (table === 'orders') {
        const parsedItems = items.map(item => ({
          ...item,
          items: item.items ? JSON.parse(item.items) : []
        }));
        
        console.log(`📋 [${table}] Pending orders:`, parsedItems.map(o => ({
          id: o.id,
          customer_name: o.customer_name,
          sync_status: o.sync_status
        })));
        
        return parsedItems;
      }
      
      return items;
    } catch (error) {
      console.error(`❌ Error getting pending ${table} items:`, error);
      return [];
    }
  }

  async updateSyncStatus(table: string, id: string, status: 'synced' | 'pending_sync' | 'error' | 'transmitted' | 'deleted'): Promise<void> {
    if (!this.db) await this.initDatabase();
    try {
      await this.db!.run(
        `UPDATE ${table} SET sync_status = ?, updated_at = ? WHERE id = ?`, 
        [status, new Date().toISOString(), id]
      );
      
      console.log(`🔄 [${table}] Updated sync status for ${id} to: ${status}`);
    } catch (error) {
      console.error(`❌ Error updating sync status for ${table}:`, error);
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
      console.error('❌ Error logging sync:', error);
    }
  }

  async saveOrder(order: any): Promise<void> {
    if (!this.db) await this.initDatabase();
    const id = order.id || uuidv4();
    const now = new Date().toISOString();
    
    // 🎯 CORREÇÃO: Garantir que novos pedidos sempre tenham sync_status correto
    const syncStatus = order.sync_status || 'pending_sync'; // ✅ Forçar pending_sync se não especificado
    
    try {
      await this.db!.run(
        'INSERT OR REPLACE INTO orders (id, customer_id, customer_name, order_date, total, status, sync_status, updated_at, notes, payment_method, reason, items, date, source_project, payment_table_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          id, 
          order.customer_id, 
          order.customer_name,
          order.order_date || now, 
          order.total, 
          order.status, 
          syncStatus, // ✅ Usar o sync_status corrigido
          now,
          order.notes || '',
          order.payment_method || '',
          order.reason || '',
          JSON.stringify(order.items || []),
          order.date || now,
          order.source_project || 'mobile',
          order.payment_table_id || null
        ]
      );
      
      console.log('💾 Order saved to SQLite:', {
        id,
        customer_name: order.customer_name,
        sync_status: syncStatus,
        total: order.total,
        payment_table_id: order.payment_table_id
      });
    } catch (error) {
      console.error('❌ Error saving order:', error);
    }
  }

  async saveMobileOrder(order: any): Promise<void> {
    console.log('📱 SQLite: saveMobileOrder called - delegating to saveOrder');
    // Para SQLite, reutilizamos o método saveOrder existente
    await this.saveOrder({
      ...order,
      source_project: 'mobile',
      sync_status: 'pending_sync'
    });
  }

  async updateClientStatus(clientId: string, status: string): Promise<void> {
    if (!this.db) await this.initDatabase();
    try {
      await this.db!.run(
        'UPDATE clients SET lastVisit = ?, sync_status = ?, updated_at = ? WHERE id = ?',
        [new Date().toISOString(), 'pending_sync', new Date().toISOString(), clientId]
      );
    } catch (error) {
      console.error('❌ Error updating client status:', error);
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
      console.error('❌ Error getting client by ID:', error);
      return null;
    }
  }

  async getOrderById(orderId: string): Promise<any | null> {
    if (!this.db) await this.initDatabase();
    try {
      const result = await this.db!.query(
        'SELECT * FROM orders WHERE id = ?', 
        [orderId]
      );
      
      if (result.values && result.values.length > 0) {
        const order = result.values[0];
        return {
          ...order,
          items: order.items ? JSON.parse(order.items) : []
        };
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting order by ID:', error);
      return null;
    }
  }

  async getPendingOrders(): Promise<any[]> {
    const pendingOrders = await this.getPendingSyncItems('orders');
    
    console.log(`🔍 Found ${pendingOrders.length} pending orders to transmit`);
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

  async getClientOrders(clientId: string): Promise<any[]> {
    if (!this.db) await this.initDatabase();
    try {
      const result = await this.db!.query(
        'SELECT * FROM orders WHERE customer_id = ? AND sync_status != ?', 
        [clientId, 'deleted']
      );
      
      const orders = result.values || [];
      return orders.map(order => ({
        ...order,
        items: order.items ? JSON.parse(order.items) : []
      }));
    } catch (error) {
      console.error('❌ Error getting client orders:', error);
      return [];
    }
  }

  async deleteOrder(orderId: string): Promise<void> {
    await this.updateSyncStatus('orders', orderId, 'deleted');
  }

  async getTransmittedOrders(): Promise<any[]> {
    if (!this.db) await this.initDatabase();
    try {
      const result = await this.db!.query(
        'SELECT * FROM orders WHERE sync_status = ?', 
        ['transmitted']
      );
      
      const orders = result.values || [];
      return orders.map(order => ({
        ...order,
        items: order.items ? JSON.parse(order.items) : []
      }));
    } catch (error) {
      console.error('❌ Error getting transmitted orders:', error);
      return [];
    }
  }

  async getAllOrders(): Promise<any[]> {
    if (!this.db) await this.initDatabase();
    try {
      const result = await this.db!.query(
        'SELECT * FROM orders WHERE sync_status != ?', 
        ['deleted']
      );
      
      const orders = result.values || [];
      return orders.map(order => ({
        ...order,
        items: order.items ? JSON.parse(order.items) : []
      }));
    } catch (error) {
      console.error('❌ Error getting all orders:', error);
      return [];
    }
  }

  async isClientNegated(clientId: string): Promise<boolean> {
    const client = await this.getClientById(clientId);
    return client?.status === 'Negativado' || client?.status === 'negativado';
  }

  async unnegateClient(clientId: string, reason: string): Promise<void> {
    if (!this.db) await this.initDatabase();
    try {
      const now = new Date().toISOString();
      
      // Obter status atual
      const client = await this.getClientById(clientId);
      if (!client) return;
      
      // Salvar histórico (assumindo que a tabela existe ou será criada)
      try {
        await this.db!.run(
          'INSERT INTO client_status_history (id, client_id, previous_status, new_status, reason, changed_at, changed_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [Date.now().toString(), clientId, client.status, 'Pendente', reason, now, 'user']
        );
      } catch (historyError) {
        console.warn('⚠️ Could not save status history:', historyError);
      }
      
      // Atualizar cliente
      await this.db!.run(
        'UPDATE clients SET status = ?, lastVisit = ?, sync_status = ?, updated_at = ? WHERE id = ?',
        ['Pendente', now, 'pending_sync', now, clientId]
      );
      
      console.log(`✅ Cliente ${clientId} desnegativado. Motivo: ${reason}`);
    } catch (error) {
      console.error('❌ Error unnegating client:', error);
    }
  }

  async getClientStatusHistory(clientId: string): Promise<any[]> {
    if (!this.db) await this.initDatabase();
    try {
      const result = await this.db!.query(
        'SELECT * FROM client_status_history WHERE client_id = ? ORDER BY changed_at DESC',
        [clientId]
      );
      return result.values || [];
    } catch (error) {
      console.warn('⚠️ Status history table may not exist:', error);
      return [];
    }
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
    const activePendingOrder = await this.getActivePendingOrder(clientId);
    if (activePendingOrder) {
      return {
        canCreate: false,
        reason: 'Cliente já possui um pedido pendente.',
        existingOrder: activePendingOrder
      };
    }

    return { canCreate: true };
  }

  async getActivePendingOrder(clientId: string): Promise<any | null> {
    try {
      const orders = await this.getClientOrders(clientId);
      const pendingOrders = orders.filter(order => 
        order.sync_status === 'pending_sync' && order.status !== 'cancelled'
      );
      
      if (pendingOrders.length > 0) {
        // Return the most recent pending order
        return pendingOrders.sort((a, b) => 
          new Date(b.created_at || b.date || b.order_date).getTime() - new Date(a.created_at || a.date || a.order_date).getTime()
        )[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error getting active pending order:', error);
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
    console.log('📱 SQLite database closed');
  }
}

export default SQLiteDatabaseService;
