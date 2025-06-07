
import { IDBPDatabase, DBSchema } from 'idb';

export interface SalesAppDBSchema extends DBSchema {
  clients: {
    key: string;
    value: any;
  };
  visit_routes: {
    key: string;
    value: any;
  };
  orders: {
    key: string;
    value: any;
    indexes: { 'customer_id': string };
  };
  products: {
    key: string;
    value: any;
  };
  sync_log: {
    key: string;
    value: any;
  };
}

// Valid table names for the schema - explicitly define to avoid issues with indexes
export type ValidTableName = 'clients' | 'visit_routes' | 'orders' | 'products' | 'sync_log';

// Type guard to check if a string is a valid table name
export function isValidTableName(tableName: string): tableName is ValidTableName {
  const validTables: ValidTableName[] = ['clients', 'visit_routes', 'orders', 'products', 'sync_log'];
  return validTables.includes(tableName as ValidTableName);
}

export type DatabaseInstance = IDBPDatabase<SalesAppDBSchema>;
