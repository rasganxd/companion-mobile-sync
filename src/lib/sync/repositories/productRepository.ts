
import {
  getAllRecords,
  getRecordById,
  insertRecord,
  updateRecord,
  deleteRecord,
  executeQuery,
} from '../database';

export interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  unit_price: number;
  min_price: number;
  stock: number;
  unit: string;
  version?: number;
  synced?: number;
}

/**
 * Get all products
 */
export async function getAllProducts(): Promise<Product[]> {
  return await getAllRecords<Product>('products');
}

/**
 * Get product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  return await getRecordById<Product>('products', id);
}

/**
 * Get product by code
 */
export async function getProductByCode(code: string): Promise<Product | null> {
  const query = 'SELECT * FROM products WHERE code = ?';
  const results = await executeQuery<Product>(query, [code]);
  return results.length > 0 ? results[0] : null;
}

/**
 * Search products by name or code
 */
export async function searchProducts(term: string): Promise<Product[]> {
  const query = `
    SELECT * FROM products 
    WHERE name LIKE ? OR code LIKE ?
    ORDER BY name
  `;
  const searchTerm = `%${term}%`;
  return await executeQuery<Product>(query, [searchTerm, searchTerm]);
}

/**
 * Create a new product
 */
export async function createProduct(product: Omit<Product, 'id'>): Promise<string> {
  return await insertRecord('products', {
    ...product,
    synced: 0,
    version: 1,
  });
}

/**
 * Update an existing product
 */
export async function updateProduct(id: string, productData: Partial<Product>): Promise<void> {
  await updateRecord<Product>('products', id, {
    ...productData,
    synced: 0,
  });
}

/**
 * Update product stock
 */
export async function updateProductStock(id: string, newStock: number): Promise<void> {
  await updateRecord<Product>('products', id, {
    stock: newStock,
    synced: 0,
  });
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<void> {
  await deleteRecord('products', id);
}
