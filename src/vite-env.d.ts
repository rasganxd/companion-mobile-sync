
/// <reference types="vite/client" />

declare module '@react-native-community/netinfo';
declare module 'react-native-sqlite-storage' {
  export interface SQLiteDatabase {
    executeSql(sqlStatement: string, params?: any[]): Promise<[any]>;
    close(): Promise<void>;
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
