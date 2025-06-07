
import { openDB } from 'idb';
import { SalesAppDBSchema, DatabaseInstance } from './types';

export class DatabaseInitializer {
  private static readonly DB_NAME = 'SalesAppDB';
  private static readonly DB_VERSION = 1;

  static async initialize(): Promise<DatabaseInstance> {
    try {
      const db = await openDB<SalesAppDBSchema>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('clients')) {
            db.createObjectStore('clients', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('visit_routes')) {
            db.createObjectStore('visit_routes', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('orders')) {
            const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
            orderStore.createIndex('customer_id', 'customer_id');
          }
          if (!db.objectStoreNames.contains('products')) {
            db.createObjectStore('products', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('sync_log')) {
            db.createObjectStore('sync_log', { keyPath: 'id' });
          }
        },
      });
      
      console.log('✅ Database initialized successfully');
      return db;
    } catch (error) {
      console.error('❌ Error initializing database:', error);
      throw error;
    }
  }
}
