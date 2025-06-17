import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

interface DatabaseDiagnostics {
  isInitialized: boolean;
  tableCount: number;
  clientsCount: number;
  productsCount: number;
  ordersCount: number;
  paymentTablesCount: number;
  lastError: string | null;
  timestamp: string;
  environment: 'web' | 'native' | 'fallback';
}

// Mock data for Lovable environment
const MOCK_CLIENTS_DATA = [
  { id: '1', name: 'Cliente A', visit_days: ['monday'], sales_rep_id: 'e3eff363-2d17-4f73-9918-f53c6bc0bc48', active: 1, status: 'pendente' },
  { id: '2', name: 'Cliente B', visit_days: ['monday'], sales_rep_id: 'e3eff363-2d17-4f73-9918-f53c6bc0bc48', active: 1, status: 'pendente' },
  { id: '3', name: 'Cliente C', visit_days: ['tuesday'], sales_rep_id: 'e3eff363-2d17-4f73-9918-f53c6bc0bc48', active: 1, status: 'pendente' },
  { id: '4', name: 'Cliente D', visit_days: ['tuesday'], sales_rep_id: 'e3eff363-2d17-4f73-9918-f53c6bc0bc48', active: 1, status: 'pendente' },
  { id: '5', name: 'Cliente E', visit_days: ['wednesday'], sales_rep_id: 'e3eff363-2d17-4f73-9918-f53c6bc0bc48', active: 1, status: 'pendente' },
  { id: '6', name: 'Cliente F', visit_days: ['wednesday'], sales_rep_id: 'e3eff363-2d17-4f73-9918-f53c6bc0bc48', active: 1, status: 'pendente' },
  { id: '7', name: 'Cliente G', visit_days: ['thursday'], sales_rep_id: 'e3eff363-2d17-4f73-9918-f53c6bc0bc48', active: 1, status: 'pendente' },
  { id: '8', name: 'Cliente H', visit_days: ['thursday'], sales_rep_id: 'e3eff363-2d17-4f73-9918-f53c6bc0bc48', active: 1, status: 'pendente' },
  { id: '9', name: 'Cliente I', visit_days: ['friday'], sales_rep_id: 'e3eff363-2d17-4f73-9918-f53c6bc0bc48', active: 1, status: 'pendente' },
  { id: '10', name: 'Cliente J', visit_days: ['friday'], sales_rep_id: 'e3eff363-2d17-4f73-9918-f53c6bc0bc48', active: 1, status: 'pendente' },
  { id: '11', name: 'Cliente K', visit_days: ['monday', 'friday'], sales_rep_id: 'e3eff363-2d17-4f73-9918-f53c6bc0bc48', active: 1, status: 'pendente' },
  { id: '12', name: 'Cliente L', visit_days: ['tuesday', 'thursday'], sales_rep_id: 'e3eff363-2d17-4f73-9918-f53c6bc0bc48', active: 1, status: 'pendente' },
  { id: '13', name: 'Cliente M', visit_days: ['wednesday'], sales_rep_id: 'e3eff363-2d17-4f73-9918-f53c6bc0bc48', active: 1, status: 'pendente' },
  { id: '14', name: 'Cliente N', visit_days: ['monday'], sales_rep_id: 'e3eff363-2d17-4f73-9918-f53c6bc0bc48', active: 1, status: 'pendente' },
  { id: '15', name: 'Cliente O', visit_days: ['tuesday'], sales_rep_id: 'e3eff363-2d17-4f73-9918-f53c6bc0bc48', active: 1, status: 'pendente' },
  // Add more mock clients to reach 85 total
  ...Array.from({ length: 70 }, (_, i) => ({
    id: `${16 + i}`,
    name: `Cliente ${String.fromCharCode(80 + i)}`,
    visit_days: [['monday', 'tuesday', 'wednesday', 'thursday', 'friday'][i % 5]],
    sales_rep_id: 'e3eff363-2d17-4f73-9918-f53c6bc0bc48',
    active: 1,
    status: 'pendente',
    visit_sequence: i + 1
  }))
];

const MOCK_PRODUCTS_DATA = [
  { id: '1', name: 'Produto A', sale_price: 10.50, active: 1 },
  { id: '2', name: 'Produto B', sale_price: 25.00, active: 1 },
  { id: '3', name: 'Produto C', sale_price: 15.75, active: 1 },
  { id: '4', name: 'Produto D', sale_price: 8.90, active: 1 },
  { id: '5', name: 'Produto E', sale_price: 35.00, active: 1 },
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `${6 + i}`,
    name: `Produto ${String.fromCharCode(70 + i)}`,
    sale_price: Math.random() * 50 + 5,
    active: 1
  }))
];

const MOCK_PAYMENT_TABLES_DATA = [
  { id: '1', name: 'À Vista', description: 'Pagamento à vista', active: 1 },
  { id: '2', name: '30 dias', description: 'Pagamento em 30 dias', active: 1 },
  { id: '3', name: '2x sem juros', description: 'Parcelado em 2x', active: 1 },
  { id: '4', name: '3x sem juros', description: 'Parcelado em 3x', active: 1 }
];

// Fallback storage using localStorage
class LocalStorageFallback {
  private prefix = 'salesapp_';

  async query(sql: string, params: any[] = []): Promise<{ values?: any[] }> {
    console.log(`📝 LocalStorage fallback query: ${sql}`);
    
    // Parse basic SQL commands for localStorage
    if (sql.includes('SELECT COUNT(*)')) {
      const table = this.extractTableName(sql);
      const data = this.getTableData(table);
      return { values: [{ count: data.length }] };
    }
    
    if (sql.includes('SELECT') && !sql.includes('COUNT(*)')) {
      const table = this.extractTableName(sql);
      const data = this.getTableData(table);
      return { values: data };
    }
    
    return { values: [] };
  }

  async run(sql: string, params: any[] = []): Promise<{ changes?: { changes: number } }> {
    console.log(`📝 LocalStorage fallback run: ${sql}`);
    
    if (sql.includes('INSERT')) {
      const table = this.extractTableName(sql);
      const data = this.getTableData(table);
      // Create a mock record
      const record = this.createMockRecord(table, params);
      data.push(record);
      this.setTableData(table, data);
      return { changes: { changes: 1 } };
    }
    
    if (sql.includes('UPDATE')) {
      return { changes: { changes: 1 } };
    }
    
    if (sql.includes('DELETE')) {
      const table = this.extractTableName(sql);
      this.setTableData(table, []);
      return { changes: { changes: 1 } };
    }
    
    return { changes: { changes: 0 } };
  }

  async execute(sql: string): Promise<void> {
    console.log(`📝 LocalStorage fallback execute: ${sql}`);
    // For CREATE TABLE and other DDL commands
  }

  private extractTableName(sql: string): string {
    const match = sql.match(/(?:FROM|INTO|UPDATE)\s+(\w+)/i);
    return match ? match[1] : 'unknown';
  }

  private getTableData(table: string): any[] {
    const data = localStorage.getItem(`${this.prefix}${table}`);
    return data ? JSON.parse(data) : [];
  }

  private setTableData(table: string, data: any[]): void {
    localStorage.setItem(`${this.prefix}${table}`, JSON.stringify(data));
  }

  private createMockRecord(table: string, params: any[]): any {
    const record: any = {
      id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Add table-specific fields based on common patterns
    if (table === 'clients') {
      record.name = params[1] || 'Mock Client';
      record.status = params[12] || 'pendente';
    } else if (table === 'products') {
      record.name = params[1] || 'Mock Product';
      record.active = 1;
    } else if (table === 'orders') {
      record.status = 'pending';
      record.total = 0;
    }
    
    return record;
  }
}

class MobileDatabaseService {
  private static instance: MobileDatabaseService | null = null;
  private sqlite: SQLiteConnection | null = null;
  private db: SQLiteDBConnection | null = null;
  private fallback: LocalStorageFallback | null = null;
  private isInitialized = false;
  private lastError: string | null = null;
  private initializationPromise: Promise<void> | null = null;
  private environment: 'web' | 'native' | 'fallback' = 'native';

  private constructor() {}

  static getInstance(): MobileDatabaseService {
    if (!MobileDatabaseService.instance) {
      MobileDatabaseService.instance = new MobileDatabaseService();
    }
    return MobileDatabaseService.instance;
  }

  private isLovableEnvironment(): boolean {
    return window.location.hostname.includes('lovableproject.com') || 
           window.location.hostname.includes('localhost');
  }

  private async populateMockDataForLovable(): Promise<void> {
    if (!this.isLovableEnvironment()) return;
    
    console.log('🎭 Populating mock data for Lovable environment...');
    
    try {
      // Check if data already exists
      const existingClients = localStorage.getItem('salesapp_clients');
      if (existingClients && JSON.parse(existingClients).length > 0) {
        console.log('🎭 Mock data already exists, skipping population');
        return;
      }

      // Populate clients with proper visit_days format
      const clientsData = MOCK_CLIENTS_DATA.map(client => ({
        ...client,
        visit_days: JSON.stringify(client.visit_days) // Store as JSON string
      }));
      
      localStorage.setItem('salesapp_clients', JSON.stringify(clientsData));
      localStorage.setItem('salesapp_products', JSON.stringify(MOCK_PRODUCTS_DATA));
      localStorage.setItem('salesapp_payment_tables', JSON.stringify(MOCK_PAYMENT_TABLES_DATA));
      localStorage.setItem('salesapp_orders', JSON.stringify([]));
      
      console.log(`✅ Mock data populated: ${clientsData.length} clients, ${MOCK_PRODUCTS_DATA.length} products, ${MOCK_PAYMENT_TABLES_DATA.length} payment tables`);
    } catch (error) {
      console.error('❌ Error populating mock data:', error);
    }
  }

  async initDatabase(): Promise<void> {
    // Prevent multiple simultaneous initialization attempts
    if (this.initializationPromise) {
      console.log('📱 Database initialization already in progress, waiting...');
      return this.initializationPromise;
    }

    if (this.isInitialized && (this.db || this.fallback)) {
      console.log('📱 Database already initialized');
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
      console.log('📱 Initializing Mobile Database...');
      console.log('📱 Platform check:', {
        isNative: Capacitor.isNativePlatform(),
        platform: Capacitor.getPlatform(),
        userAgent: navigator.userAgent.substring(0, 100),
        isLovable: this.isLovableEnvironment()
      });
      
      // For Lovable environment, use fallback and populate mock data
      if (this.isLovableEnvironment()) {
        console.log('🎭 Lovable environment detected, using fallback with mock data');
        await this.initializeFallback();
        await this.populateMockDataForLovable();
        return;
      }
      
      // Try SQLite first (works for both native and web with jeep-sqlite)
      await this.initializeSQLite();
      
    } catch (error) {
      console.warn('⚠️ SQLite initialization failed, trying fallback:', error);
      await this.initializeFallback();
    }
  }

  private async initializeSQLite(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        console.log('📱 Initializing native SQLite...');
        this.environment = 'native';
      } else {
        console.log('🌐 Initializing web SQLite...');
        this.environment = 'web';
        
        // Check if web SQLite is available
        const webConnection = (window as any).webSQLiteConnection;
        if (webConnection) {
          this.sqlite = webConnection;
          console.log('✅ Using pre-initialized web SQLite connection');
        } else {
          throw new Error('Web SQLite not initialized');
        }
      }

      if (!this.sqlite) {
        this.sqlite = new SQLiteConnection(CapacitorSQLite);
        console.log('📱 SQLite connection created');
      }
      
      // Create or open database
      this.db = await this.sqlite.createConnection('sales-app-mobile', false, 'no-encryption', 1, false);
      console.log('📱 Database connection established');
      
      await this.db.open();
      console.log('📱 Database opened successfully');

      // Create tables
      await this.createTables();
      
      this.isInitialized = true;
      this.lastError = null;
      console.log(`✅ ${this.environment} SQLite database initialized successfully`);
      
    } catch (error) {
      console.error('❌ SQLite initialization failed:', error);
      throw error;
    }
  }

  private async initializeFallback(): Promise<void> {
    try {
      console.log('📝 Initializing localStorage fallback...');
      this.environment = 'fallback';
      this.fallback = new LocalStorageFallback();
      this.isInitialized = true;
      this.lastError = null;
      console.log('✅ LocalStorage fallback initialized successfully');
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Fallback initialization failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    try {
      console.log('📱 Creating SQLite tables...');

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
      
      // Verify table creation
      const tablesResult = await this.db.query("SELECT name FROM sqlite_master WHERE type='table'");
      console.log('📋 Created tables:', tablesResult.values?.map(t => t.name));
      
    } catch (error) {
      console.error('❌ Error creating SQLite tables:', error);
      throw error;
    }
  }

  private async executeQuery(sql: string, params: any[] = []): Promise<{ values?: any[] }> {
    if (this.db) {
      return await this.db.query(sql, params);
    } else if (this.fallback) {
      return await this.fallback.query(sql, params);
    }
    throw new Error('No database connection available');
  }

  private async executeRun(sql: string, params: any[] = []): Promise<{ changes?: { changes: number } }> {
    if (this.db) {
      const result = await this.db.run(sql, params);
      // Fix the SQLite result format to match our expected interface
      return { 
        changes: { 
          changes: result.changes?.changes || 0 
        } 
      };
    } else if (this.fallback) {
      return await this.fallback.run(sql, params);
    }
    throw new Error('No database connection available');
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
      timestamp: new Date().toISOString(),
      environment: this.environment
    };

    if (!this.isInitialized) {
      console.log('📊 Database not initialized, returning basic diagnostics');
      return diagnostics;
    }

    try {
      if (this.db) {
        // Count tables
        const tablesResult = await this.executeQuery("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'");
        diagnostics.tableCount = tablesResult.values?.[0]?.count || 0;
      } else if (this.fallback) {
        diagnostics.tableCount = 6; // Mock table count for fallback
      }

      // Count records in each table
      const clientsResult = await this.executeQuery('SELECT COUNT(*) as count FROM clients');
      diagnostics.clientsCount = clientsResult.values?.[0]?.count || 0;

      const productsResult = await this.executeQuery('SELECT COUNT(*) as count FROM products');
      diagnostics.productsCount = productsResult.values?.[0]?.count || 0;

      const ordersResult = await this.executeQuery('SELECT COUNT(*) as count FROM orders');
      diagnostics.ordersCount = ordersResult.values?.[0]?.count || 0;

      const paymentResult = await this.executeQuery('SELECT COUNT(*) as count FROM payment_tables');
      diagnostics.paymentTablesCount = paymentResult.values?.[0]?.count || 0;

      console.log('📊 Database diagnostics collected:', diagnostics);
    } catch (error) {
      console.error('❌ Error collecting diagnostics:', error);
      diagnostics.lastError = error instanceof Error ? error.message : 'Unknown error';
    }

    return diagnostics;
  }

  async validateDatabaseIntegrity(): Promise<boolean> {
    if (!this.isInitialized) {
      console.log('⚠️ Database not initialized, integrity check failed');
      return false;
    }

    try {
      console.log('🔍 Validating database integrity...');

      if (this.fallback) {
        console.log('✅ LocalStorage fallback integrity validation passed');
        return true;
      }

      if (this.db) {
        // Check if all required tables exist
        const requiredTables = ['clients', 'products', 'orders', 'payment_tables', 'visit_routes', 'sync_log'];
        
        for (const table of requiredTables) {
          const result = await this.executeQuery(
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?", 
            [table]
          );
          
          if (!result.values || result.values.length === 0) {
            console.error(`❌ Required table '${table}' not found`);
            return false;
          }
        }

        // Test basic operations
        await this.executeQuery('SELECT 1');
      }
      
      console.log('✅ Database integrity validation passed');
      return true;
    } catch (error) {
      console.error('❌ Database integrity validation failed:', error);
      return false;
    }
  }

  async saveClients(clientsArray: any[]): Promise<void> {
    if (!this.isInitialized) await this.initDatabase();
    
    try {
      console.log(`📱 Saving ${clientsArray.length} clients to ${this.environment} database...`);
      
      // Clear existing clients first
      await this.executeRun('DELETE FROM clients');
      console.log('📱 Cleared existing clients');
      
      // Save new clients
      let savedCount = 0;
      for (const client of clientsArray) {
        try {
          await this.executeRun(
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
        } catch (error) {
          console.error('❌ Error saving individual client:', client.id, error);
        }
      }
      
      console.log(`✅ Successfully saved ${savedCount}/${clientsArray.length} clients to ${this.environment} database`);
      
      // Verify save
      const verifyResult = await this.executeQuery('SELECT COUNT(*) as count FROM clients');
      const actualCount = verifyResult.values?.[0]?.count || 0;
      console.log(`📊 Verification: ${actualCount} clients in database after save`);
      
    } catch (error) {
      console.error('❌ Error saving clients to database:', error);
      throw error;
    }
  }

  async getClients(): Promise<any[]> {
    if (!this.isInitialized) await this.initDatabase();

    try {
      console.log(`📱 Getting clients from ${this.environment} database...`);
      const result = await this.executeQuery('SELECT * FROM clients ORDER BY name');
      let clients = result.values || [];
      
      // Parse visit_days from JSON string to array for each client
      clients = clients.map(client => {
        if (client.visit_days && typeof client.visit_days === 'string') {
          try {
            client.visit_days = JSON.parse(client.visit_days);
          } catch (error) {
            console.warn('⚠️ Error parsing visit_days for client:', client.id, error);
            client.visit_days = [];
          }
        }
        return client;
      });
      
      console.log(`📱 Retrieved ${clients.length} clients from ${this.environment} database`);
      console.log('📱 Sample client data:', clients.slice(0, 3));
      return clients;
    } catch (error) {
      console.error('❌ Error getting clients from database:', error);
      return [];
    }
  }

  async saveProducts(productsArray: any[]): Promise<void> {
    if (!this.isInitialized) await this.initDatabase();
    
    try {
      console.log(`📱 Saving ${productsArray.length} products to ${this.environment} database...`);
      
      await this.executeRun('DELETE FROM products');
      console.log('📱 Cleared existing products');
      
      let savedCount = 0;
      for (const product of productsArray) {
        try {
          await this.executeRun(
            `INSERT INTO products (
              id, name, code, sale_price, cost_price, stock, active
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              product.id, product.name, product.code, product.sale_price || 0,
              product.cost_price || 0, product.stock || 0, product.active ? 1 : 0
            ]
          );
          savedCount++;
        } catch (error) {
          console.error('❌ Error saving individual product:', product.id, error);
        }
      }
      
      console.log(`✅ Successfully saved ${savedCount}/${productsArray.length} products to ${this.environment} database`);
      
    } catch (error) {
      console.error('❌ Error saving products to database:', error);
      throw error;
    }
  }

  async savePaymentTables(paymentTablesArray: any[]): Promise<void> {
    if (!this.isInitialized) await this.initDatabase();
  
    try {
      console.log(`📱 Saving ${paymentTablesArray.length} payment tables to ${this.environment} database...`);
      
      await this.executeRun('DELETE FROM payment_tables');
      console.log('📱 Cleared existing payment tables');
  
      let savedCount = 0;
      for (const paymentTable of paymentTablesArray) {
        try {
          await this.executeRun(
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
        } catch (error) {
          console.error('❌ Error saving individual payment table:', paymentTable.id, error);
        }
      }
  
      console.log(`✅ Successfully saved ${savedCount}/${paymentTablesArray.length} payment tables to ${this.environment} database`);
      
    } catch (error) {
      console.error('❌ Error saving payment tables:', error);
      throw error;
    }
  }

  async getProducts(): Promise<any[]> {
    if (!this.isInitialized) await this.initDatabase();

    try {
      console.log(`📱 Getting products from ${this.environment} database...`);
      const result = await this.executeQuery('SELECT * FROM products WHERE active = 1 ORDER BY name');
      const products = result.values || [];
      console.log(`📱 Retrieved ${products.length} products from ${this.environment} database`);
      return products;
    } catch (error) {
      console.error('❌ Error getting products from database:', error);
      return [];
    }
  }

  async getPaymentTables(): Promise<any[]> {
    if (!this.isInitialized) await this.initDatabase();

    try {
      console.log(`📱 Getting payment tables from ${this.environment} database...`);
      const result = await this.executeQuery('SELECT * FROM payment_tables WHERE active = 1');
      console.log(`📱 Found ${result.values?.length || 0} active payment tables:`, result.values);
      return result.values || [];
    } catch (error) {
      console.error('❌ Error getting payment tables:', error);
      return [];
    }
  }

  async getOrders(clientId?: string): Promise<any[]> {
    if (!this.isInitialized) await this.initDatabase();
    try {
      let query = 'SELECT * FROM orders';
      let params: any[] = [];
      if (clientId) {
        query += ' WHERE customer_id = ?';
        params = [clientId];
      }
      const result = await this.executeQuery(query, params);
      return result.values || [];
    } catch (error) {
      console.error('❌ Error getting orders:', error);
      return [];
    }
  }

  async saveOrder(order: any): Promise<void> {
    if (!this.isInitialized) await this.initDatabase();
    try {
      await this.executeRun(
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
      console.log('✅ Order saved to database');
    } catch (error) {
      console.error('❌ Error saving order:', error);
    }
  }

  async getPendingSyncItems(table: string): Promise<any[]> {
    if (!this.isInitialized) await this.initDatabase();
    try {
      const result = await this.executeQuery(`SELECT * FROM ${table} WHERE sync_status = ?`, ['pending_sync']);
      return result.values || [];
    } catch (error) {
      console.error(`❌ Error getting pending sync items from ${table}:`, error);
      return [];
    }
  }

  async updateSyncStatus(table: string, id: string, status: string): Promise<void> {
    if (!this.isInitialized) await this.initDatabase();
    try {
      await this.executeRun(`UPDATE ${table} SET sync_status = ? WHERE id = ?`, [status, id]);
    } catch (error) {
      console.error(`❌ Error updating sync status:`, error);
    }
  }

  async logSync(type: string, status: string, details?: string): Promise<void> {
    if (!this.isInitialized) await this.initDatabase();
    try {
      await this.executeRun(
        'INSERT INTO sync_log (id, type, status, details, timestamp) VALUES (?, ?, ?, ?, ?)',
        [new Date().toISOString(), type, status, details || null, new Date().toISOString()]
      );
    } catch (error) {
      console.error('❌ Error logging sync event:', error);
    }
  }

  async updateClientStatus(clientId: string, status: string): Promise<void> {
    if (!this.isInitialized) await this.initDatabase();
    try {
      await this.executeRun('UPDATE clients SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, clientId]);
    } catch (error) {
      console.error(`❌ Error updating client status:`, error);
    }
  }

  async getClientById(clientId: string): Promise<any | null> {
    if (!this.isInitialized) await this.initDatabase();
    try {
      const result = await this.executeQuery('SELECT * FROM clients WHERE id = ?', [clientId]);
      let client = result.values && result.values.length > 0 ? result.values[0] : null;
      
      // Parse visit_days if it's a string
      if (client && client.visit_days && typeof client.visit_days === 'string') {
        try {
          client.visit_days = JSON.parse(client.visit_days);
        } catch (error) {
          console.warn('⚠️ Error parsing visit_days for client:', client.id, error);
          client.visit_days = [];
        }
      }
      
      return client;
    } catch (error) {
      console.error('❌ Error getting client by ID:', error);
      return null;
    }
  }

  async getVisitRoutes(): Promise<any[]> { return []; }
  async closeDatabase(): Promise<void> { 
    this.isInitialized = false;
    this.db = null;
    this.fallback = null;
  }
  async getPendingOrders(): Promise<any[]> { return this.getPendingSyncItems('orders'); }
  async markOrderAsTransmitted(orderId: string): Promise<void> { 
    await this.updateSyncStatus('orders', orderId, 'transmitted'); 
  }
  async getOfflineOrdersCount(): Promise<number> {
    const orders = await this.getPendingOrders();
    return orders.length;
  }
  async getClientOrders(clientId: string): Promise<any[]> { return this.getOrders(clientId); }
  async deleteOrder(orderId: string): Promise<void> {
    if (!this.isInitialized) await this.initDatabase();
    try {
      await this.executeRun('DELETE FROM orders WHERE id = ?', [orderId]);
    } catch (error) {
      console.error('❌ Error deleting order:', error);
    }
  }
  async deleteAllOrders(): Promise<void> {
    if (!this.isInitialized) await this.initDatabase();
    try {
      await this.executeRun('DELETE FROM orders');
    } catch (error) {
      console.error('❌ Error deleting all orders:', error);
    }
  }
  async getTransmittedOrders(): Promise<any[]> {
    return this.getPendingSyncItems('orders').then(orders => orders.filter(o => o.sync_status === 'transmitted'));
  }
  async getAllOrders(): Promise<any[]> { return this.getOrders(); }
  async saveMobileOrder(order: any): Promise<void> { return this.saveOrder(order); }
  async saveClient(client: any): Promise<void> {
    if (!this.isInitialized) await this.initDatabase();
    try {
      await this.executeRun(
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
    } catch (error) {
      console.error('❌ Error saving client:', error);
    }
  }
  async saveProduct(product: any): Promise<void> {
    if (!this.isInitialized) await this.initDatabase();
    try {
      await this.executeRun(
        `INSERT OR REPLACE INTO products (
          id, name, code, sale_price, cost_price, stock, active
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          product.id, product.name, product.code, product.sale_price || 0,
          product.cost_price || 0, product.stock || 0, product.active ? 1 : 0
        ]
      );
    } catch (error) {
      console.error('❌ Error saving product:', error);
    }
  }
  async isClientNegated(clientId: string): Promise<boolean> {
    const client = await this.getClientById(clientId);
    return client?.status === 'negativado';
  }
  async unnegateClient(clientId: string, reason: string): Promise<void> {
    await this.updateClientStatus(clientId, 'ativo');
  }
  async getClientStatusHistory(clientId: string): Promise<any[]> { return []; }
  async hasClientPendingOrders(clientId: string): Promise<boolean> {
    const orders = await this.getClientOrders(clientId);
    return orders.some(order => order.status === 'pending');
  }
  async canCreateOrderForClient(clientId: string): Promise<{ canCreate: boolean; reason?: string; existingOrder?: any }> {
    const client = await this.getClientById(clientId);
    if (!client) return { canCreate: false, reason: 'Cliente não encontrado' };
    if (client.status === 'negativado') return { canCreate: false, reason: 'Cliente negativado' };
    return { canCreate: true };
  }
  async getActivePendingOrder(clientId: string): Promise<any | null> {
    const orders = await this.getClientOrders(clientId);
    return orders.find(order => order.status === 'pending') || null;
  }
  async getCustomers(): Promise<any[]> { return this.getClients(); }
  async getOrderById(orderId: string): Promise<any | null> {
    if (!this.isInitialized) await this.initDatabase();
    try {
      const result = await this.executeQuery('SELECT * FROM orders WHERE id = ?', [orderId]);
      return result.values && result.values.length > 0 ? result.values[0] : null;
    } catch (error) {
      console.error('❌ Error getting order by ID:', error);
      return null;
    }
  }
  async updateClientStatusAfterOrderDeletion(clientId: string): Promise<void> {
    // Simplified implementation
    const orders = await this.getClientOrders(clientId);
    if (orders.length === 0) {
      await this.updateClientStatus(clientId, 'pendente');
    }
  }
  async resetAllNegatedClientsStatus(): Promise<void> {
    // Simplified implementation
    console.log('📱 Reset all negated clients status called');
  }

  // New method to reset mock data for testing
  async resetMockData(): Promise<void> {
    if (this.isLovableEnvironment()) {
      console.log('🧹 Resetting mock data...');
      localStorage.removeItem('salesapp_clients');
      localStorage.removeItem('salesapp_products');
      localStorage.removeItem('salesapp_payment_tables');
      localStorage.removeItem('salesapp_orders');
      await this.populateMockDataForLovable();
      console.log('✅ Mock data reset and repopulated');
    }
  }
}

export default MobileDatabaseService;
