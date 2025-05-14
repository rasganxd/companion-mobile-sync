
import SQLite from 'react-native-sqlite-storage';
import { v4 as uuidv4 } from 'uuid';

// Enable SQLite promise-based API
SQLite.enablePromise(true);

// Database name and location
const DATABASE = {
  name: 'mobile_sync.db',
  location: 'default',
};

// Database connection instance
let db: any; // Using 'any' type instead of SQLiteDatabase

/**
 * Initialize the database
 */
export async function initDatabase(): Promise<any> { // Changed return type to any
  if (db) {
    return db;
  }

  try {
    db = await SQLite.openDatabase(DATABASE);
    await createTables();
    return db;
  } catch (error) {
    console.error('Failed to open database:', error);
    throw error;
  }
}

/**
 * Create necessary tables if they don't exist
 */
async function createTables(): Promise<void> {
  try {
    // Clients table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        fantasy_name TEXT,
        address TEXT,
        city TEXT,
        status TEXT DEFAULT 'Pendente',
        version INTEGER DEFAULT 1,
        synced INTEGER DEFAULT 0
      );
    `);

    // Products table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        unit_price REAL NOT NULL,
        min_price REAL NOT NULL,
        stock INTEGER DEFAULT 0,
        unit TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        synced INTEGER DEFAULT 0
      );
    `);

    // Orders table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        sales_rep_id TEXT NOT NULL,
        order_date TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        total REAL NOT NULL,
        status TEXT DEFAULT 'Pendente',
        version INTEGER DEFAULT 1,
        synced INTEGER DEFAULT 0
      );
    `);

    // Order items table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        quantity REAL NOT NULL,
        price REAL NOT NULL,
        code TEXT NOT NULL,
        unit TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
      );
    `);

    // Sync logs table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS sync_logs (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        device_id TEXT NOT NULL,
        sales_rep_id TEXT NOT NULL,
        details TEXT,
        created_at TEXT NOT NULL
      );
    `);

  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
}

/**
 * Execute a query with parameters
 */
export async function executeQuery<T = any>(
  query: string, 
  params: any[] = []
): Promise<T[]> {
  try {
    const [results] = await db.executeSql(query, params);
    const items: T[] = [];
    
    for (let i = 0; i < results.rows.length; i++) {
      items.push(results.rows.item(i));
    }
    
    return items;
  } catch (error) {
    console.error('Query execution error:', query, params, error);
    throw error;
  }
}

/**
 * Generate a unique ID for new records
 */
export function generateUniqueId(): string {
  return uuidv4();
}

/**
 * Insert a record into a table
 */
export async function insertRecord<T extends object>(
  table: string, 
  data: T
): Promise<string> {
  const id = generateUniqueId();
  const dataWithId = { ...data, id };

  const columns = Object.keys(dataWithId).join(', ');
  const placeholders = Object.keys(dataWithId)
    .map(() => '?')
    .join(', ');
  
  const values = Object.values(dataWithId);

  const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
  
  await executeQuery(query, values);
  return id;
}

/**
 * Update a record in a table
 */
export async function updateRecord<T extends object>(
  table: string, 
  id: string, 
  data: Partial<T>
): Promise<void> {
  // Version control - increment version
  const dataWithVersion = { 
    ...data, 
    version: db.executeSql(`SELECT version FROM ${table} WHERE id = ?`, [id])
      .then(([results]) => results.rows.item(0).version + 1)
  };

  const setClause = Object.keys(dataWithVersion)
    .map(key => `${key} = ?`)
    .join(', ');
  
  const values = [...Object.values(dataWithVersion), id];

  const query = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
  
  await executeQuery(query, values);
}

/**
 * Get a record by ID
 */
export async function getRecordById<T = any>(
  table: string, 
  id: string
): Promise<T | null> {
  const query = `SELECT * FROM ${table} WHERE id = ?`;
  const results = await executeQuery<T>(query, [id]);
  
  return results.length > 0 ? results[0] : null;
}

/**
 * Get all records from a table
 */
export async function getAllRecords<T = any>(table: string): Promise<T[]> {
  const query = `SELECT * FROM ${table}`;
  return await executeQuery<T>(query);
}

/**
 * Get all unsynchronized records from a table
 */
export async function getUnsyncedRecords<T = any>(table: string): Promise<T[]> {
  const query = `SELECT * FROM ${table} WHERE synced = 0`;
  return await executeQuery<T>(query);
}

/**
 * Mark records as synchronized
 */
export async function markAsSynced(table: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  
  const placeholders = ids.map(() => '?').join(',');
  const query = `UPDATE ${table} SET synced = 1 WHERE id IN (${placeholders})`;
  
  await executeQuery(query, ids);
}

/**
 * Delete a record by ID
 */
export async function deleteRecord(table: string, id: string): Promise<void> {
  const query = `DELETE FROM ${table} WHERE id = ?`;
  await executeQuery(query, [id]);
}

/**
 * Clear a table
 */
export async function clearTable(table: string): Promise<void> {
  const query = `DELETE FROM ${table}`;
  await executeQuery(query);
}
