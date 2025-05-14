
/// <reference types="vite/client" />

declare module '@react-native-community/netinfo';
declare module 'react-native-sqlite-storage' {
  export interface SQLError {
    code: number;
    message: string;
  }

  export interface ResultSet {
    insertId?: number;
    rowsAffected: number;
    rows: {
      length: number;
      item: (idx: number) => any;
      raw: () => any[];
    };
  }

  export interface SQLiteDatabase {
    transaction: (
      fn: (tx: SQLTransaction) => void,
      error?: (error: SQLError) => void,
      success?: () => void
    ) => void;
    readTransaction: (
      fn: (tx: SQLTransaction) => void,
      error?: (error: SQLError) => void,
      success?: () => void
    ) => void;
    executeSql: (sqlStatement: string, params?: any[]) => Promise<[ResultSet]>;
    close: () => Promise<void>;
  }

  export interface SQLTransaction {
    executeSql: (
      sqlStatement: string,
      params?: any[],
      success?: (tx: SQLTransaction, results: ResultSet) => void,
      error?: (error: SQLError) => void
    ) => void;
  }
  
  export function openDatabase(config: {
    name: string;
    location: string;
  }): Promise<SQLiteDatabase>;
  
  export function enablePromise(enabled: boolean): void;
  
  export default {
    openDatabase,
    enablePromise,
  };
}

declare module 'uuid';
