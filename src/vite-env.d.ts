
/// <reference types="vite/client" />

// SQLite DB Types
interface SQLiteDatabase {
  transaction: (callback: (tx: SQLiteTransaction) => void) => void;
  executeSql: (sql: string, params?: any[]) => Promise<[SQLiteResultSet]>;
  close: () => Promise<void>;
}

interface SQLiteTransaction {
  executeSql: (
    sql: string,
    params?: any[],
    success?: (tx: SQLiteTransaction, results: SQLiteResultSet) => void,
    error?: (error: Error) => void
  ) => void;
}

interface SQLiteResultSet {
  rows: {
    length: number;
    item: (index: number) => any;
    raw: () => any[];
  };
  rowsAffected: number;
  insertId?: number;
}

// Sync Types
interface SyncStatus {
  lastSync: Date | null;
  inProgress: boolean;
  pendingUploads: number;
  pendingDownloads: number;
  connected: boolean;
}

interface SyncSettings {
  autoSync: boolean;
  syncInterval: number; // in minutes
  syncOnWifiOnly: boolean;
  syncEnabled: boolean;
}

