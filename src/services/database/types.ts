
import { IDBPDatabase } from 'idb';

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
    indexes: { customer_id: string };
  };
  products: {
    key: string;
    value: any;
  };
  payment_tables: {
    key: string;
    value: any;
  };
  sync_log: {
    key: string;
    value: any;
  };
}

export type DatabaseInstance = IDBPDatabase<SalesAppDBSchema>;

export type ValidTableName = 'clients' | 'visit_routes' | 'orders' | 'products' | 'payment_tables' | 'sync_log';

export function isValidTableName(table: string): table is ValidTableName {
  return ['clients', 'visit_routes', 'orders', 'products', 'payment_tables', 'sync_log'].includes(table);
}

interface DBSchema {
  [key: string]: {
    key: any;
    value: any;
    indexes?: { [key: string]: any };
  };
}
