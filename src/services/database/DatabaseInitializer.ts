
import { openDB } from 'idb';
import { SalesAppDBSchema, DatabaseInstance } from './types';

export class DatabaseInitializer {
  private static readonly DB_NAME = 'sales-app-db';
  private static readonly DB_VERSION = 2;

  static async initialize(): Promise<DatabaseInstance> {
    try {
      console.log('🔧 Initializing database with version', this.DB_VERSION);
      
      const db = await openDB<SalesAppDBSchema>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db, oldVersion) {
          console.log(`🔧 Upgrading database from version ${oldVersion} to ${this.DB_VERSION}`);
          
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
          
          // Create sync_log table
          if (!db.objectStoreNames.contains('sync_log')) {
            console.log('📋 Creating sync_log table');
            db.createObjectStore('sync_log', { keyPath: 'id' });
          }
        },
      });
      
      console.log('✅ Database initialized successfully with version', this.DB_VERSION);
      return db;
    } catch (error) {
      console.error('❌ Error initializing database:', error);
      
      // If there's a version conflict, try to clear the database and retry
      if (error instanceof Error && error.message.includes('version')) {
        console.log('🔄 Version conflict detected, attempting database cleanup...');
        await this.clearDatabase();
        return this.initialize();
      }
      
      throw error;
    }
  }

  static async clearDatabase(): Promise<void> {
    try {
      console.log('🗑️ Clearing corrupted database...');
      
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
          reject(new Error('Database deletion blocked'));
        };
      });
    } catch (error) {
      console.error('❌ Error during database cleanup:', error);
      throw error;
    }
  }
}
