
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
            // Create clients table
            if (!db.objectStoreNames.contains('clients')) {
              console.log('📋 Creating clients table');
              db.createObjectStore('clients', { keyPath: 'id' });
            }
            
            // Create visit_routes table
            if (!db.objectStoreNames.contains('visit_routes')) {
              console.log('📋 Creating visit_routes table');
              db.createObjectStore('visit_routes', { keyPath: 'id' });
            }
            
            // Create orders table with customer_id index
            if (!db.objectStoreNames.contains('orders')) {
              console.log('📋 Creating orders table');
              const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
              orderStore.createIndex('customer_id', 'customer_id');
            }
            
            // Create products table
            if (!db.objectStoreNames.contains('products')) {
              console.log('📋 Creating products table');
              db.createObjectStore('products', { keyPath: 'id' });
            }
            
            // Create payment_tables table
            if (!db.objectStoreNames.contains('payment_tables')) {
              console.log('📋 Creating payment_tables table');
              db.createObjectStore('payment_tables', { keyPath: 'id' });
            }
            
            // ✅ NOVO: Create payment_methods table
            if (!db.objectStoreNames.contains('payment_methods')) {
              console.log('📋 Creating payment_methods table');
              db.createObjectStore('payment_methods', { keyPath: 'id' });
            }
            
            // ✅ NOVO: Create units table
            if (!db.objectStoreNames.contains('units')) {
              console.log('📋 Creating units table');
              db.createObjectStore('units', { keyPath: 'id' });
            }
            
            // ✅ NOVO: Create order_items table
            if (!db.objectStoreNames.contains('order_items')) {
              console.log('📋 Creating order_items table');
              const orderItemsStore = db.createObjectStore('order_items', { keyPath: 'id' });
              orderItemsStore.createIndex('order_id', 'order_id');
            }
            
            // Create sync_log table
            if (!db.objectStoreNames.contains('sync_log')) {
              console.log('📋 Creating sync_log table');
              db.createObjectStore('sync_log', { keyPath: 'id' });
            }
            
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
