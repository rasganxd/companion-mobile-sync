import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { ensureTypedArray, safeJsonParse, validateOrderData, logAndroidDebug, safeCast } from '@/utils/androidDataValidator';
import { DatabaseMigrationManager } from './database/DatabaseMigrationManager';

// ✅ NOVO: Interface para definir a estrutura das colunas retornadas pelo PRAGMA table_info
interface TableColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

// ✅ NOVO: Interface para definir a estrutura dos produtos
interface ProductData {
  id: string;
  name: string;
  code: number;
  sale_price: number;
  cost_price: number;
  stock: number;
  active: boolean;
  unit?: string;
  has_subunit?: boolean;
  subunit?: string;
  subunit_ratio?: number;
  max_discount_percent?: number;
  category_id?: string;
  category_name?: string;
  group_name?: string;
  brand_name?: string;
  main_unit_id?: string;
  sub_unit_id?: string;
  created_at?: string;
  updated_at?: string;
}

// ✅ NOVO: Interface completa para clientes
interface CustomerData {
  id: string;
  name: string;
  company_name?: string;
  code?: number;
  active: boolean;
  phone?: string;
  email?: string;
  document?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  neighborhood?: string;
  visit_days?: string | string[];
  visit_sequence?: number;
  visit_frequency?: string;
  sales_rep_id?: string;
  delivery_route_id?: string;
  credit_limit?: number;
  payment_terms?: string;
  region?: string;
  category?: string;
  notes?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

// ✅ NOVO: Interface completa para pedidos
interface OrderData {
  id: string;
  customer_id?: string;
  customer_name?: string;
  sales_rep_id?: string;
  code?: number;
  date: string;
  due_date?: string;
  status: string;
  total: number;
  discount?: number;
  sync_status?: string;
  source_project?: string;
  payment_method?: string;
  payment_table_id?: string;
  payments?: string; // JSON as string in SQLite
  delivery_address?: string;
  delivery_city?: string;
  delivery_state?: string;
  delivery_zip?: string;
  visit_notes?: string;
  reason?: string;
  notes?: string;
  items?: any[];
  created_at?: string;
  updated_at?: string;
}

// ✅ NOVO: Interface para tabelas de pagamento
interface PaymentTableData {
  id: string;
  name: string;
  description?: string;
  type?: string;
  payable_to?: string;
  payment_location?: string;
  active: boolean;
  installments?: string; // JSON as string
  terms?: string; // JSON as string
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

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
      
      // Execute migrations
      const migrationResult = await DatabaseMigrationManager.checkAndMigrate(this.db);
      if (!migrationResult.success) {
        console.error('❌ Migration failed:', migrationResult.error);
      } else {
        console.log(`✅ Database migrated to version ${migrationResult.version}`);
      }
      
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

      // ✅ NOVA ESTRUTURA: Tabela customers COMPLETA
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          company_name TEXT,
          code INTEGER,
          active BOOLEAN DEFAULT 1,
          phone TEXT,
          email TEXT,
          document TEXT,
          address TEXT,
          city TEXT,
          state TEXT,
          zip_code TEXT,
          neighborhood TEXT,
          visit_days TEXT,
          visit_sequence INTEGER,
          visit_frequency TEXT,
          sales_rep_id TEXT,
          delivery_route_id TEXT,
          credit_limit NUMERIC,
          payment_terms TEXT,
          region TEXT,
          category TEXT,
          notes TEXT,
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

      // ✅ NOVA ESTRUTURA: Tabela orders COMPLETA
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          customer_id TEXT,
          customer_name TEXT,
          sales_rep_id TEXT,
          code INTEGER,
          date DATETIME,
          due_date DATETIME,
          status TEXT DEFAULT 'pending',
          total REAL DEFAULT 0,
          discount REAL DEFAULT 0,
          sync_status TEXT DEFAULT 'pending_sync',
          source_project TEXT DEFAULT 'mobile',
          payment_method TEXT,
          payment_table_id TEXT,
          payments TEXT,
          delivery_address TEXT,
          delivery_city TEXT,
          delivery_state TEXT,
          delivery_zip TEXT,
          visit_notes TEXT,
          reason TEXT,
          notes TEXT,
          items TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // ✅ ESTRUTURA EXISTENTE: Tabela products mantida
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

      // ✅ NOVA ESTRUTURA: Tabela payment_tables COMPLETA
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
          terms TEXT,
          notes TEXT,
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
      const result = await this.db!.query('SELECT * FROM customers');
      
      logAndroidDebug('getClients result', result);
      
      const clients = ensureTypedArray(result.values || result, (item: any) => !!item?.id);
      
      console.log(`📱 [ANDROID] Raw clients from SQLite: ${clients.length}`);
      
      // ✅ CORREÇÃO: Processar dados completos dos clientes
      const processedClients = clients.map((clientData: any) => {
        const client = safeCast<CustomerData>(clientData);
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

  async getCustomers(): Promise<any[]> {
    return this.getClients();
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
      
      // ✅ CORREÇÃO: Usar type assertion e safeCast para cada produto
      const typedProducts = products.map(productData => {
        const product = safeCast<ProductData>(productData);
        if (!product) return null;
        
        return product;
      }).filter(product => product !== null) as ProductData[];
      
      // ✅ NOVO: Log detalhado das unidades dos produtos para debug
      typedProducts.forEach((product, index) => {
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
      
      return typedProducts;
    } catch (error) {
      console.error('❌ [ANDROID] Error getting products:', error);
      return [];
    }
  }

  async getPaymentTables(): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('📱 Getting payment tables from SQLite database...');
      const result = await this.db!.query('SELECT * FROM payment_tables');
      
      logAndroidDebug('getPaymentTables result', result);
      
      const paymentTables = ensureTypedArray(result.values || result, (item: any) => !!item?.id);
      
      // ✅ CORREÇÃO: Processar dados completos das tabelas de pagamento
      const processedTables = paymentTables.map((tableData: any) => {
        const table = safeCast<PaymentTableData>(tableData);
        if (!table) return null;
        
        let installments = table.installments;
        let terms = table.terms;
        
        // Se installments é string, tentar fazer parse
        if (typeof installments === 'string' && installments) {
          installments = safeJsonParse(installments) || [];
        }
        
        // Se terms é string, tentar fazer parse
        if (typeof terms === 'string' && terms) {
          terms = safeJsonParse(terms) || {};
        }
        
        return {
          ...table,
          installments,
          terms
        };
      }).filter(table => table !== null);
      
      console.log(`📱 Found ${processedTables.length} payment tables in SQLite`);
      return processedTables;
    } catch (error) {
      console.error('❌ Error getting payment tables:', error);
      return [];
    }
  }

  async saveClients(clientsArray: any[]): Promise<void> {
    if (!this.db) await this.initDatabase();
  
    try {
      console.log(`📱 [ANDROID] Salvando ${clientsArray.length} clientes no SQLite database...`);
      
      // ✅ NOVO: Verificar se há clientes existentes antes de salvar
      const existingClients = await this.db!.query('SELECT COUNT(*) as count FROM customers');
      const existingCount = existingClients.values?.[0]?.count || 0;
      
      console.log(`📊 [ANDROID] Clientes existentes antes da inserção: ${existingCount}`);
      
      // ✅ NOVO: Validar dados recebidos
      const validClients = clientsArray.filter(client => {
        if (!client.id || !client.name) {
          console.warn('⚠️ [ANDROID] Cliente inválido encontrado:', client);
          return false;
        }
        return true;
      });
      
      console.log(`📊 [ANDROID] Clientes válidos para inserção: ${validClients.length}/${clientsArray.length}`);
      
      // ✅ NOVO: Detectar e remover duplicatas por ID
      const uniqueClients = validClients.reduce((acc, client) => {
        const existingIndex = acc.findIndex(c => c.id === client.id);
        if (existingIndex >= 0) {
          console.warn('⚠️ [ANDROID] Cliente duplicado detectado:', client.id, client.name);
          // Manter o mais recente (substituir)
          acc[existingIndex] = client;
        } else {
          acc.push(client);
        }
        return acc;
      }, [] as any[]);
      
      console.log(`📊 [ANDROID] Clientes únicos após deduplicação: ${uniqueClients.length}`);
  
      // Salvar cada cliente único
      for (const client of uniqueClients) {
        let visitDaysString = null;
        if (client.visit_days) {
          if (Array.isArray(client.visit_days)) {
            visitDaysString = JSON.stringify(client.visit_days);
          } else if (typeof client.visit_days === 'string') {
            try {
              JSON.parse(client.visit_days);
              visitDaysString = client.visit_days;
            } catch (e) {
              visitDaysString = JSON.stringify([client.visit_days]);
            }
          }
        }
        
        console.log(`📱 [ANDROID] Salvando cliente: ${client.name} (ID: ${client.id})`);

        // ✅ CORRIGIDO: Usar INSERT OR REPLACE para garantir que duplicatas sejam substituídas
        await this.db!.run(
          `INSERT OR REPLACE INTO customers (
            id, name, company_name, code, active, phone, email, document, address, city, state,
            zip_code, neighborhood, visit_days, visit_sequence, visit_frequency, sales_rep_id, 
            delivery_route_id, credit_limit, payment_terms, region, category, notes, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            client.id, client.name, client.company_name, client.code, client.active,
            client.phone, client.email, client.document, client.address, client.city, client.state,
            client.zip_code, client.neighborhood, visitDaysString, client.visit_sequence, 
            client.visit_frequency, client.sales_rep_id, client.delivery_route_id, 
            client.credit_limit, client.payment_terms, client.region, client.category,
            client.notes, client.status || 'pendente'
          ]
        );
      }
      
      // ✅ NOVO: Verificar contagem final
      const finalClients = await this.db!.query('SELECT COUNT(*) as count FROM customers');
      const finalCount = finalClients.values?.[0]?.count || 0;
      
      console.log(`📊 [ANDROID] Resultado final da inserção:`, {
        clientesRecebidos: clientsArray.length,
        clientesValidos: validClients.length,
        clientesUnicos: uniqueClients.length,
        existentesAntes: existingCount,
        totalFinal: finalCount,
        novosSalvos: finalCount - existingCount
      });
  
      console.log('✅ [ANDROID] Clientes salvos com estrutura completa e validação de duplicatas');
    } catch (error) {
      console.error('❌ [ANDROID] Erro ao salvar clientes:', error);
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
            id, name, code, sale_price, cost_price, stock, active, unit, has_subunit, subunit,
            subunit_ratio, max_discount_percent, category_id, category_name, group_name, brand_name,
            main_unit_id, sub_unit_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            product.id, product.name, product.code, product.sale_price, product.cost_price,
            product.stock, product.active, product.unit, product.has_subunit, product.subunit,
            product.subunit_ratio, product.max_discount_percent, product.category_id,
            product.category_name, product.group_name, product.brand_name,
            product.main_unit_id, product.sub_unit_id
          ]
        );
      }

      console.log('✅ All products saved with complete structure');
    } catch (error) {
      console.error('❌ Error saving products:', error);
      throw error;
    }
  }

  async savePaymentTables(paymentTablesArray: any[]): Promise<void> {
    if (!this.db) await this.initDatabase();
  
    try {
      console.log(`📱 Saving ${paymentTablesArray.length} payment tables with complete structure...`);
  
      for (const paymentTable of paymentTablesArray) {
        await this.db!.run(
          `INSERT OR REPLACE INTO payment_tables (
            id, name, description, type, payable_to, payment_location, active, installments, terms, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            paymentTable.id, 
            paymentTable.name, 
            paymentTable.description || null,
            paymentTable.type || null,
            paymentTable.payable_to || null,
            paymentTable.payment_location || null,
            paymentTable.active !== false ? 1 : 0,
            paymentTable.installments ? JSON.stringify(paymentTable.installments) : null,
            paymentTable.terms ? JSON.stringify(paymentTable.terms) : null,
            paymentTable.notes || null
          ]
        );
      }
  
      console.log('✅ Payment tables saved with complete structure');
    } catch (error) {
      console.error('❌ Error saving payment tables:', error);
      throw error;
    }
  }

  async saveClient(client: any): Promise<void> {
    await this.saveClients([client]);
  }

  async saveProduct(product: any): Promise<void> {
    await this.saveProducts([product]);
  }

  async saveOrder(order: any): Promise<void> {
    console.log('💾 SQLiteDatabaseService.saveOrder() - Starting to save order:', {
      orderId: order.id,
      customerId: order.customer_id,
      customerName: order.customer_name || order.customer?.name,
      total: order.total,
      status: order.status
    });
    
    await this.ensureDatabaseInitialized();
    
    const sql = `INSERT OR REPLACE INTO orders (
      id, customer_id, customer_name, total, status, payment_method,
      date, sync_status, source_project, items
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    await this.db!.run(sql, [
      order.id,
      order.customer_id,
      order.customer_name,
      order.total,
      order.status,
      order.payment_method,
      order.date,
      order.sync_status,
      order.source_project,
      JSON.stringify(order.items)
    ]);
    
    console.log('✅ SQLiteDatabaseService.saveOrder() - Order saved successfully, now updating client status');
    
    // ✅ NOVO: Automaticamente positivar o cliente quando um pedido é salvo
    if (order.customer_id) {
      console.log('🔄 SQLiteDatabaseService.saveOrder() - Calling updateClientStatus for customer:', order.customer_id);
      await this.updateClientStatus(order.customer_id, 'positivado');
    } else {
      console.warn('⚠️ SQLiteDatabaseService.saveOrder() - No customer_id found in order, cannot update client status');
    }
  }

  async saveMobileOrder(order: any): Promise<void> {
    await this.saveOrder(order);
  }

  // ✅ IMPLEMENTAR MÉTODOS FALTANTES PARA DATABASEADAPTER

  async getPendingSyncItems(table: string): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`📱 Getting pending sync items for table: ${table}`);
      
      // Para orders, buscar items com sync_status != 'synced'
      if (table === 'orders') {
        const result = await this.db!.query(
          'SELECT * FROM orders WHERE sync_status != ? AND sync_status != ?',
          ['synced', 'transmitted']
        );
        return ensureTypedArray(result.values || result, (item: any) => !!item?.id);
      }
      
      // Para outras tabelas, buscar todos (assumindo que precisam sync)
      const result = await this.db!.query(`SELECT * FROM ${table}`);
      return ensureTypedArray(result.values || result, (item: any) => !!item?.id);
    } catch (error) {
      console.error(`❌ Error getting pending sync items for ${table}:`, error);
      return [];
    }
  }

  async updateSyncStatus(table: string, id: string, status: 'synced' | 'pending_sync' | 'error' | 'transmitted' | 'deleted'): Promise<void> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`📱 Updating sync status for ${table} ${id} to ${status}`);
      
      if (table === 'orders') {
        await this.db!.run(
          'UPDATE orders SET sync_status = ? WHERE id = ?',
          [status, id]
        );
      } else if (table === 'customers') {
        // Para customers, podemos atualizar um campo de status se necessário
        await this.db!.run(
          'UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [id]
        );
      }
      
      console.log(`✅ Sync status updated for ${table} ${id}`);
    } catch (error) {
      console.error(`❌ Error updating sync status for ${table} ${id}:`, error);
    }
  }

  async logSync(type: string, status: string, details?: string): Promise<void> {
    if (!this.db) await this.initDatabase();

    try {
      const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await this.db!.run(
        'INSERT INTO sync_log (id, type, status, details) VALUES (?, ?, ?, ?)',
        [id, type, status, details || '']
      );
      
      console.log(`✅ Sync logged: ${type} - ${status}`);
    } catch (error) {
      console.error('❌ Error logging sync:', error);
    }
  }

  async updateClientStatus(clientId: string, status: string): Promise<void> {
    console.log('🔄 SQLiteDatabaseService.updateClientStatus() - STARTING:', {
      clientId,
      status,
      timestamp: new Date().toISOString()
    });
    
    try {
      await this.ensureDatabaseInitialized();
      
      console.log('🔍 SQLiteDatabaseService.updateClientStatus() - Getting client by ID:', clientId);
      const client = await this.getClientById(clientId);
      
      if (client) {
        console.log('✅ SQLiteDatabaseService.updateClientStatus() - Client found:', {
          clientId: client.id,
          clientName: client.name,
          currentStatus: client.status,
          newStatus: status
        });
        
        const sql = `UPDATE clients SET status = ?, updated_at = ? WHERE id = ?`;
        const updatedAt = new Date().toISOString();
        
        console.log('💾 SQLiteDatabaseService.updateClientStatus() - Executing SQL update...');
        await this.db!.run(sql, [status, updatedAt, clientId]);
        
        console.log('✅ SQLiteDatabaseService.updateClientStatus() - SUCCESS! Client status updated:', {
          clientId,
          clientName: client.name,
          newStatus: status,
          timestamp: new Date().toISOString()
        });
      } else {
        console.error('❌ SQLiteDatabaseService.updateClientStatus() - CLIENT NOT FOUND:', {
          clientId,
          status,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('❌ SQLiteDatabaseService.updateClientStatus() - ERROR:', {
        clientId,
        status,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  async updateOrder(orderId: string, order: any): Promise<void> {
    console.log('💾 SQLiteDatabaseService.updateOrder() - Starting to update order:', {
      orderId,
      customerId: order.customer_id,
      customerName: order.customer_name || order.customer?.name,
      total: order.total,
      status: order.status
    });
    
    await this.ensureDatabaseInitialized();
    
    const sql = `UPDATE orders SET 
      customer_id = ?, customer_name = ?, total = ?, status = ?,
      payment_method = ?, date = ?, sync_status = ?, items = ?
    WHERE id = ?`;
    
    await this.db!.run(sql, [
      order.customer_id,
      order.customer_name,
      order.total,
      order.status,
      order.payment_method,
      order.date,
      order.sync_status,
      JSON.stringify(order.items),
      orderId
    ]);
    
    console.log('✅ SQLiteDatabaseService.updateOrder() - Order updated successfully, now updating client status');
    
    // ✅ NOVO: Automaticamente positivar o cliente quando um pedido é atualizado
    if (order.customer_id) {
      console.log('🔄 SQLiteDatabaseService.updateOrder() - Calling updateClientStatus for customer:', order.customer_id);
      await this.updateClientStatus(order.customer_id, 'positivado');
    } else {
      console.warn('⚠️ SQLiteDatabaseService.updateOrder() - No customer_id found in order, cannot update client status');
    }
  }

  async getClientById(clientId: string): Promise<any | null> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`📱 Getting client by ID: ${clientId}`);
      
      const result = await this.db!.query('SELECT * FROM customers WHERE id = ?', [clientId]);
      const clients = ensureTypedArray(result.values || result, (item: any) => !!item?.id);
      
      if (clients.length === 0) return null;
      
      const client = safeCast<CustomerData>(clients[0]);
      if (!client) return null;
      
      // Processar visit_days se necessário
      let visitDays = client.visit_days;
      if (typeof visitDays === 'string' && visitDays) {
        visitDays = safeJsonParse(visitDays) || [];
      }
      if (!Array.isArray(visitDays)) {
        visitDays = [];
      }
      
      return {
        ...client,
        visit_days: visitDays
      };
    } catch (error) {
      console.error(`❌ Error getting client by ID ${clientId}:`, error);
      return null;
    }
  }

  async closeDatabase(): Promise<void> {
    try {
      if (this.db) {
        await this.db.close();
        this.db = null;
      }
      this.isInitialized = false;
      console.log('✅ SQLite database closed');
    } catch (error) {
      console.error('❌ Error closing database:', error);
    }
  }

  // ✅ MÉTODOS PARA FLUXO OFFLINE
  async getPendingOrders(): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      const result = await this.db!.query(
        'SELECT * FROM orders WHERE sync_status = ?',
        ['pending_sync']
      );
      
      const orders = ensureTypedArray(result.values || result, (item: any) => !!item?.id);
      return orders.map(order => validateOrderData(order)).filter(order => order !== null);
    } catch (error) {
      console.error('❌ Error getting pending orders:', error);
      return [];
    }
  }

  async markOrderAsTransmitted(orderId: string): Promise<void> {
    await this.updateSyncStatus('orders', orderId, 'transmitted');
  }

  async getOfflineOrdersCount(): Promise<number> {
    if (!this.db) await this.initDatabase();

    try {
      const result = await this.db!.query(
        'SELECT COUNT(*) as count FROM orders WHERE sync_status != ?',
        ['synced']
      );
      
      const count = result.values?.[0]?.count || 0;
      return typeof count === 'number' ? count : parseInt(count) || 0;
    } catch (error) {
      console.error('❌ Error getting offline orders count:', error);
      return 0;
    }
  }

  // ✅ MÉTODOS PARA GERENCIAMENTO MELHORADO DE PEDIDOS
  async getClientOrders(clientId: string): Promise<any[]> {
    return this.getOrders(clientId);
  }

  async deleteOrder(orderId: string): Promise<void> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`📱 Deleting order ${orderId}`);
      
      await this.db!.run('DELETE FROM orders WHERE id = ?', [orderId]);
      
      console.log(`✅ Order ${orderId} deleted`);
    } catch (error) {
      console.error(`❌ Error deleting order ${orderId}:`, error);
    }
  }

  async deleteAllOrders(): Promise<void> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('📱 Deleting all orders');
      
      await this.db!.run('DELETE FROM orders');
      
      console.log('✅ All orders deleted');
    } catch (error) {
      console.error('❌ Error deleting all orders:', error);
    }
  }

  async getTransmittedOrders(): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      const result = await this.db!.query(
        'SELECT * FROM orders WHERE sync_status = ?',
        ['transmitted']
      );
      
      const orders = ensureTypedArray(result.values || result, (item: any) => !!item?.id);
      return orders.map(order => validateOrderData(order)).filter(order => order !== null);
    } catch (error) {
      console.error('❌ Error getting transmitted orders:', error);
      return [];
    }
  }

  async getAllOrders(): Promise<any[]> {
    return this.getOrders();
  }

  async getOrderById(orderId: string): Promise<any | null> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`📱 Getting order by ID: ${orderId}`);
      
      const result = await this.db!.query('SELECT * FROM orders WHERE id = ?', [orderId]);
      const orders = ensureTypedArray(result.values || result, (item: any) => !!item?.id);
      
      if (orders.length === 0) return null;
      
      return validateOrderData(orders[0]);
    } catch (error) {
      console.error(`❌ Error getting order by ID ${orderId}:`, error);
      return null;
    }
  }

  // ✅ MÉTODOS PARA VALIDAÇÕES E CONTROLE DE STATUS
  async isClientNegated(clientId: string): Promise<boolean> {
    const client = await this.getClientById(clientId);
    return client?.status === 'negado' || false;
  }

  async unnegateClient(clientId: string, reason: string): Promise<void> {
    await this.updateClientStatus(clientId, 'ativo');
    await this.logSync('client_unnegate', 'completed', `Client ${clientId} unnegated: ${reason}`);
  }

  async getClientStatusHistory(clientId: string): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      const result = await this.db!.query(
        'SELECT * FROM sync_log WHERE details LIKE ? ORDER BY timestamp DESC',
        [`%${clientId}%`]
      );
      
      return ensureTypedArray(result.values || result, (item: any) => !!item?.id);
    } catch (error) {
      console.error(`❌ Error getting client status history for ${clientId}:`, error);
      return [];
    }
  }

  async hasClientPendingOrders(clientId: string): Promise<boolean> {
    if (!this.db) await this.initDatabase();

    try {
      const result = await this.db!.query(
        'SELECT COUNT(*) as count FROM orders WHERE customer_id = ? AND sync_status != ?',
        [clientId, 'synced']
      );
      
      const count = result.values?.[0]?.count || 0;
      return (typeof count === 'number' ? count : parseInt(count) || 0) > 0;
    } catch (error) {
      console.error(`❌ Error checking pending orders for client ${clientId}:`, error);
      return false;
    }
  }

  async canCreateOrderForClient(clientId: string): Promise<{ canCreate: boolean; reason?: string; existingOrder?: any }> {
    try {
      const isNegated = await this.isClientNegated(clientId);
      if (isNegated) {
        return {
          canCreate: false,
          reason: 'Cliente negado'
        };
      }

      const existingOrder = await this.getActivePendingOrder(clientId);
      if (existingOrder) {
        return {
          canCreate: false,
          reason: 'Cliente já possui pedido ativo',
          existingOrder
        };
      }

      return { canCreate: true };
    } catch (error) {
      console.error(`❌ Error checking if can create order for client ${clientId}:`, error);
      return {
        canCreate: false,
        reason: 'Erro ao verificar status do cliente'
      };
    }
  }

  async getActivePendingOrder(clientId: string): Promise<any | null> {
    if (!this.db) await this.initDatabase();

    try {
      const result = await this.db!.query(
        'SELECT * FROM orders WHERE customer_id = ? AND sync_status = ? LIMIT 1',
        [clientId, 'pending_sync']
      );
      
      const orders = ensureTypedArray(result.values || result, (item: any) => !!item?.id);
      
      if (orders.length === 0) return null;
      
      return validateOrderData(orders[0]);
    } catch (error) {
      console.error(`❌ Error getting active pending order for client ${clientId}:`, error);
      return null;
    }
  }

  // ✅ MÉTODOS OPCIONAIS PARA LIMPEZA E ATUALIZAÇÃO
  async clearMockData?(): Promise<void> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('📱 [ANDROID] Limpando dados duplicados/mock do SQLite...');
      
      // Contar registros antes da limpeza
      const clientsBefore = await this.db!.query('SELECT COUNT(*) as count FROM customers');
      const productsBefore = await this.db!.query('SELECT COUNT(*) as count FROM products');
      const ordersBefore = await this.db!.query('SELECT COUNT(*) as count FROM orders');
      
      console.log('📊 [ANDROID] Registros antes da limpeza:', {
        clients: clientsBefore.values?.[0]?.count || 0,
        products: productsBefore.values?.[0]?.count || 0,
        orders: ordersBefore.values?.[0]?.count || 0
      });
      
      // Limpar todas as tabelas
      await this.db!.run('DELETE FROM customers');
      await this.db!.run('DELETE FROM products');
      await this.db!.run('DELETE FROM payment_tables');
      await this.db!.run('DELETE FROM orders');
      
      // Contar registros após limpeza
      const clientsAfter = await this.db!.query('SELECT COUNT(*) as count FROM customers');
      const productsAfter = await this.db!.query('SELECT COUNT(*) as count FROM products');
      const ordersAfter = await this.db!.query('SELECT COUNT(*) as count FROM orders');
      
      console.log('📊 [ANDROID] Registros após limpeza:', {
        clients: clientsAfter.values?.[0]?.count || 0,
        products: productsAfter.values?.[0]?.count || 0,
        orders: ordersAfter.values?.[0]?.count || 0
      });
      
      console.log('✅ [ANDROID] Dados duplicados/mock limpos do SQLite');
    } catch (error) {
      console.error('❌ [ANDROID] Erro ao limpar dados:', error);
      throw error;
    }
  }

  async updateClientStatusAfterOrderDeletion?(clientId: string): Promise<void> {
    try {
      const hasPendingOrders = await this.hasClientPendingOrders(clientId);
      if (!hasPendingOrders) {
        await this.updateClientStatus(clientId, 'pendente');
      }
    } catch (error) {
      console.error(`❌ Error updating client status after order deletion for ${clientId}:`, error);
    }
  }

  async resetAllNegatedClientsStatus?(): Promise<void> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('📱 Resetting all negated clients status...');
      
      await this.db!.run(
        'UPDATE customers SET status = ? WHERE status = ?',
        ['pendente', 'negado']
      );
      
      console.log('✅ All negated clients status reset to pending');
    } catch (error) {
      console.error('❌ Error resetting negated clients status:', error);
    }
  }

  // Add the missing saveOrders method
  async saveOrders(ordersArray: any[]): Promise<void> {
    console.log('💾 Saving orders to SQLite database...', ordersArray.length);
    
    if (!this.isInitialized || !this.db) {
      await this.initDatabase();
    }

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      for (const order of ordersArray) {
        console.log('💾 Saving order:', order.id, order.customer_name);
        
        await this.db.run(
          `INSERT OR REPLACE INTO orders (
            id, customer_id, customer_name, date, total, status, sync_status, items
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            order.id,
            order.customer_id,
            order.customer_name,
            order.date,
            order.total || 0,
            order.status || 'pending',
            order.sync_status || 'synced',
            JSON.stringify(order.items || [])
          ]
        );
      }
      
      console.log('✅ Successfully saved', ordersArray.length, 'orders to SQLite database');
    } catch (error) {
      console.error('❌ Error saving orders to SQLite:', error);
      throw error;
    }
  }

  private async ensureDatabaseInitialized(): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }
  }
}

export default SQLiteDatabaseService;
