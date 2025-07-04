

import { SQLiteDBConnection } from '@capacitor-community/sqlite';

interface MigrationResult {
  success: boolean;
  version: number;
  error?: string;
}

export class DatabaseMigrationManager {
  private static readonly CURRENT_VERSION = 3;
  private static readonly VERSION_KEY = 'db_schema_version';

  static async checkAndMigrate(db: SQLiteDBConnection): Promise<MigrationResult> {
    try {
      const currentVersion = await this.getCurrentVersion(db);
      console.log(`📱 [MIGRATION] Current database version: ${currentVersion}`);
      
      if (currentVersion < this.CURRENT_VERSION) {
        console.log(`📱 [MIGRATION] Migrating from version ${currentVersion} to ${this.CURRENT_VERSION}`);
        await this.performMigration(db, currentVersion);
        await this.setCurrentVersion(db, this.CURRENT_VERSION);
        
        return {
          success: true,
          version: this.CURRENT_VERSION
        };
      }
      
      return {
        success: true,
        version: currentVersion
      };
    } catch (error) {
      console.error('❌ [MIGRATION] Migration failed:', error);
      return {
        success: false,
        version: 0,
        error: error instanceof Error ? error.message : 'Unknown migration error'
      };
    }
  }

  private static async getCurrentVersion(db: SQLiteDBConnection): Promise<number> {
    try {
      const result = await db.query('PRAGMA user_version');
      return result.values?.[0]?.user_version || 0;
    } catch (error) {
      console.warn('⚠️ [MIGRATION] Could not get version, assuming 0');
      return 0;
    }
  }

  private static async setCurrentVersion(db: SQLiteDBConnection, version: number): Promise<void> {
    await db.execute(`PRAGMA user_version = ${version}`);
  }

  private static async performMigration(db: SQLiteDBConnection, fromVersion: number): Promise<void> {
    if (fromVersion < 1) {
      await this.migrateToVersion1(db);
    }
    if (fromVersion < 2) {
      await this.migrateToVersion2(db);
    }
    if (fromVersion < 3) {
      await this.migrateToVersion3(db);
    }
  }

  private static async migrateToVersion1(db: SQLiteDBConnection): Promise<void> {
    console.log('📱 [MIGRATION] Migrating to version 1 - Adding basic fields');
    
    // ✅ CORRIGIDO: Usar 'clients' como nome da tabela
    const migrations = [
      'ALTER TABLE clients ADD COLUMN email TEXT',
      'ALTER TABLE clients ADD COLUMN document TEXT',
      'ALTER TABLE clients ADD COLUMN zip_code TEXT',
      'ALTER TABLE clients ADD COLUMN neighborhood TEXT',
      'ALTER TABLE orders ADD COLUMN code INTEGER',
      'ALTER TABLE orders ADD COLUMN due_date DATETIME'
    ];

    for (const migration of migrations) {
      try {
        await db.execute(migration);
      } catch (error) {
        // Campo já existe, continuar
        console.log(`⚠️ [MIGRATION] Field might already exist: ${migration}`);
      }
    }
  }

  private static async migrateToVersion2(db: SQLiteDBConnection): Promise<void> {
    console.log('📱 [MIGRATION] Migrating to version 2 - Adding extended fields');
    
    // ✅ CORRIGIDO: Usar 'clients' como nome da tabela
    const migrations = [
      'ALTER TABLE clients ADD COLUMN credit_limit NUMERIC',
      'ALTER TABLE clients ADD COLUMN visit_frequency TEXT',
      'ALTER TABLE clients ADD COLUMN payment_terms TEXT',
      'ALTER TABLE clients ADD COLUMN region TEXT',
      'ALTER TABLE clients ADD COLUMN category TEXT',
      'ALTER TABLE orders ADD COLUMN discount REAL DEFAULT 0',
      'ALTER TABLE orders ADD COLUMN payments TEXT',
      'ALTER TABLE orders ADD COLUMN delivery_address TEXT',
      'ALTER TABLE orders ADD COLUMN visit_notes TEXT',
      'ALTER TABLE payment_tables ADD COLUMN terms TEXT',
      'ALTER TABLE payment_tables ADD COLUMN notes TEXT'
    ];

    for (const migration of migrations) {
      try {
        await db.execute(migration);
      } catch (error) {
        console.log(`⚠️ [MIGRATION] Field might already exist: ${migration}`);
      }
    }
  }

  private static async migrateToVersion3(db: SQLiteDBConnection): Promise<void> {
    console.log('📱 [MIGRATION] Migrating to version 3 - Creating missing tables');
    
    // Criar tabelas completamente novas
    await db.execute(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS units (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        description TEXT NOT NULL,
        package_quantity REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT,
        product_id TEXT,
        product_code INTEGER,
        product_name TEXT,
        quantity REAL NOT NULL,
        unit TEXT DEFAULT 'UN',
        unit_price REAL,
        price REAL NOT NULL,
        discount REAL DEFAULT 0,
        total REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ✅ CORRIGIDO: Usar 'clients' como nome da tabela nos índices
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_clients_sales_rep_id ON clients(sales_rep_id)',
      'CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)',
      'CREATE INDEX IF NOT EXISTS idx_products_code ON products(code)'
    ];

    for (const index of indexes) {
      try {
        await db.execute(index);
      } catch (error) {
        console.log(`⚠️ [MIGRATION] Index might already exist: ${index}`);
      }
    }
  }
}

