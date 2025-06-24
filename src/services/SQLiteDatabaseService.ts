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

  async saveClients(clientsArray: any[]): Promise<void> {
    if (!this.db) await this.initDatabase();
  
    try {
      console.log(`📱 [ANDROID] Saving ${clientsArray.length} clients to SQLite database...`);
  
      for (const client of clientsArray) {
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
        
        console.log(`📱 [ANDROID] Saving client ${client.name} with all fields`);

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
  
      console.log('✅ [ANDROID] All clients saved with complete structure');
    } catch (error) {
      console.error('❌ [ANDROID] Error saving clients:', error);
      throw error;
    }
  }

  async saveOrder(order: any): Promise<void> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('📱 Saving order to SQLite database with complete structure');
      
      // ✅ CORREÇÃO: Incluir todos os campos da estrutura completa
      await this.db!.run(
        `INSERT INTO orders (
          id, customer_id, customer_name, sales_rep_id, code, date, due_date, status, total, discount,
          sync_status, source_project, payment_method, payment_table_id, payments,
          delivery_address, delivery_city, delivery_state, delivery_zip, visit_notes,
          reason, notes, items
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.id, order.customer_id, order.customer_name, order.sales_rep_id, order.code,
          order.date, order.due_date, order.status, order.total, order.discount || 0,
          order.sync_status, order.source_project, order.payment_method, order.payment_table_id,
          order.payments ? JSON.stringify(order.payments) : null,
          order.delivery_address, order.delivery_city, order.delivery_state, order.delivery_zip,
          order.visit_notes, order.reason, order.notes, JSON.stringify(order.items)
        ]
      );
      console.log('✅ Order saved with complete structure');
    } catch (error) {
      console.error('❌ Error saving order:', error);
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

  async getPaymentMethods(): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('📱 Getting payment methods from SQLite database...');
      const result = await this.db!.query('SELECT * FROM payment_methods');
      
      return ensureTypedArray(result.values || result, (item: any) => !!item?.id);
    } catch (error) {
      console.error('❌ Error getting payment methods:', error);
      return [];
    }
  }

  async getUnits(): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log('📱 Getting units from SQLite database...');
      const result = await this.db!.query('SELECT * FROM units');
      
      return ensureTypedArray(result.values || result, (item: any) => !!item?.id);
    } catch (error) {
      console.error('❌ Error getting units:', error);
      return [];
    }
  }

  async getOrderItems(orderId: string): Promise<any[]> {
    if (!this.db) await this.initDatabase();

    try {
      console.log(`📱 Getting order items for order ${orderId}`);
      const result = await this.db!.query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
      
      return ensureTypedArray(result.values || result, (item: any) => !!item?.id);
    } catch (error) {
      console.error('❌ Error getting order items:', error);
      return [];
    }
  }
}

export default SQLiteDatabaseService;
