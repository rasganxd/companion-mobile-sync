import { openDB } from 'idb';
import { SalesAppDBSchema, DatabaseInstance } from './types';

export class DatabaseInitializer {
  private static readonly DB_NAME = 'sales-app-db';
  private static readonly DB_VERSION = 3; // ✅ ATUALIZADO: Nova versão com estruturas completas

  static async initialize(): Promise<DatabaseInstance> {
    try {
      console.log('🔧 Initializing database with version', this.DB_VERSION);
      
      const targetVersion = this.DB_VERSION;
      
      const db = await openDB<SalesAppDBSchema>(this.DB_NAME, targetVersion, {
        upgrade(db, oldVersion) {
          console.log(`🔧 Upgrading database from version ${oldVersion} to ${targetVersion}`);
          
          try {
            this.initializeDatabase(db, oldVersion, targetVersion);
            
            console.log('✅ Database schema upgrade completed successfully');
          } catch (upgradeError) {
            console.error('❌ Error during database upgrade:', upgradeError);
            throw upgradeError;
          }
        },
        blocked() {
          console.warn('⚠️ Database upgrade blocked - another tab may be open');
        },
        blocking() {
          console.warn('⚠️ Database upgrade blocking - closing connection');
        },
        terminated() {
          console.warn('⚠️ Database upgrade terminated unexpectedly');
        }
      });
      
      console.log('✅ Database initialized successfully with version', targetVersion);
      return db;
    } catch (error) {
      console.error('❌ Error initializing database:', error);
      
      // If there's a version conflict or upgrade error, try to clear and retry
      if (error instanceof Error && (
        error.message.includes('version') || 
        error.message.includes('aborted') ||
        error.message.includes('upgradeneeded')
      )) {
        console.log('🔄 Database error detected, attempting cleanup and retry...');
        try {
          await this.clearDatabase();
          // Retry initialization after clearing
          return this.initialize();
        } catch (cleanupError) {
          console.error('❌ Error during cleanup and retry:', cleanupError);
          throw cleanupError;
        }
      }
      
      throw error;
    }
  }

  static initializeDatabase(db: any, oldVersion: number, newVersion: number, transaction?: any): void {
    console.log(`Initializing database from version ${oldVersion} to ${newVersion}...`);
    
    // Create clients table
    if (!db.objectStoreNames.contains('clients')) {
      const clientStore = db.createObjectStore('clients', { keyPath: 'id' });
      clientStore.createIndex('name', 'name', { unique: false });
      clientStore.createIndex('code', 'code', { unique: false });
      console.log('Created clients table');
    }

    // Create products table
    if (!db.objectStoreNames.contains('products')) {
      const productStore = db.createObjectStore('products', { keyPath: 'id' });
      productStore.createIndex('name', 'name', { unique: false });
      productStore.createIndex('code', 'code', { unique: false });
      console.log('Created products table');
    }

    // Create orders table
    if (!db.objectStoreNames.contains('orders')) {
      const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
      orderStore.createIndex('customer_id', 'customer_id', { unique: false });
      orderStore.createIndex('date', 'date', { unique: false });
      orderStore.createIndex('status', 'status', { unique: false });
      orderStore.createIndex('sync_status', 'sync_status', { unique: false });
      console.log('Created orders table');
    }

    // Create visit_routes table
    if (!db.objectStoreNames.contains('visit_routes')) {
      const routeStore = db.createObjectStore('visit_routes', { keyPath: 'id' });
      routeStore.createIndex('name', 'name', { unique: false });
      console.log('Created visit_routes table');
    }

    // Create payment_tables table
    if (!db.objectStoreNames.contains('payment_tables')) {
      const paymentStore = db.createObjectStore('payment_tables', { keyPath: 'id' });
      paymentStore.createIndex('name', 'name', { unique: false });
      console.log('Created payment_tables table');
    }

    // Create sync_log table
    if (!db.objectStoreNames.contains('sync_log')) {
      const syncLogStore = db.createObjectStore('sync_log', { keyPath: 'id', autoIncrement: true });
      syncLogStore.createIndex('type', 'type', { unique: false });
      syncLogStore.createIndex('timestamp', 'timestamp', { unique: false });
      console.log('Created sync_log table');
    }

    console.log('Database initialization completed');
  }

  static async clearDatabase(): Promise<void> {
    try {
      console.log('🗑️ Clearing database...');
      
      // Delete the existing database
      const deleteRequest = indexedDB.deleteDatabase(this.DB_NAME);
      
      return new Promise((resolve, reject) => {
        deleteRequest.onsuccess = () => {
          console.log('✅ Database cleared successfully');
          resolve();
        };
        
        deleteRequest.onerror = () => {
          console.error('❌ Error clearing database:', deleteRequest.error);
          reject(deleteRequest.error);
        };
        
        deleteRequest.onblocked = () => {
          console.warn('⚠️ Database deletion blocked - close all tabs and try again');
          // Don't reject immediately, give it a chance
          setTimeout(() => {
            reject(new Error('Database deletion blocked'));
          }, 5000);
        };
      });
    } catch (error) {
      console.error('❌ Error during database cleanup:', error);
      throw error;
    }
  }

  static async forceCleanDatabase(): Promise<void> {
    try {
      console.log('🔄 Force cleaning database - closing all connections...');
      
      // Close any existing connections first
      const existingDb = await openDB(this.DB_NAME, 1).catch(() => null);
      if (existingDb) {
        existingDb.close();
      }
      
      // Wait a bit for connections to close
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Now attempt to delete
      await this.clearDatabase();
    } catch (error) {
      console.error('❌ Error during force cleanup:', error);
      throw error;
    }
  }
}
