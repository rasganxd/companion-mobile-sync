
import { executeQuery, getUnsyncedRecords, markAsSynced, insertRecord } from './database';
import { ConnectionStatus, checkConnection } from './connectionStatus';

// Constants for API endpoints
const API_BASE_URL = 'https://your-supabase-project.functions.supabase.co/mobile-sync';
const ENDPOINTS = {
  GET_SALES_REPS: `${API_BASE_URL}/get-sales-reps`,
  GET_CUSTOMERS: `${API_BASE_URL}/get-customers`,
  GET_PRODUCTS: `${API_BASE_URL}/get-products`,
  GET_ORDERS: `${API_BASE_URL}/get-orders`,
  SYNC_ORDERS: `${API_BASE_URL}/sync-orders`,
  LOG_SYNC: `${API_BASE_URL}/log-sync`,
};

// Device unique identifier
let deviceId: string = null;

/**
 * Initialize device ID
 */
export function initDeviceId(id: string): void {
  deviceId = id;
}

/**
 * Get authentication headers
 */
function getAuthHeaders(token: string) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Fetch data from the API
 */
async function fetchFromApi<T>(url: string, token: string): Promise<T> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
}

/**
 * Post data to the API
 */
async function postToApi<T, R>(url: string, data: T, token: string): Promise<R> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API post error:', error);
    throw error;
  }
}

/**
 * Download clients from the server
 */
export async function downloadClients(token: string, salesRepId: string): Promise<number> {
  const url = `${ENDPOINTS.GET_CUSTOMERS}?salesRepId=${salesRepId}`;
  const clients = await fetchFromApi<any[]>(url, token);
  
  // Clear current clients first
  await executeQuery('DELETE FROM clients');
  
  // Insert new clients
  for (const client of clients) {
    await insertRecord('clients', {
      ...client,
      synced: 1,
    });
  }
  
  return clients.length;
}

/**
 * Download products from the server
 */
export async function downloadProducts(token: string): Promise<number> {
  const products = await fetchFromApi<any[]>(ENDPOINTS.GET_PRODUCTS, token);
  
  // Clear current products first
  await executeQuery('DELETE FROM products');
  
  // Insert new products
  for (const product of products) {
    await insertRecord('products', {
      ...product,
      synced: 1,
    });
  }
  
  return products.length;
}

/**
 * Download orders for a specific sales rep
 */
export async function downloadOrders(token: string, salesRepId: string): Promise<number> {
  const url = `${ENDPOINTS.GET_ORDERS}?salesRepId=${salesRepId}`;
  const orders = await fetchFromApi<any[]>(url, token);
  
  // We don't clear orders because we might have local orders that haven't been synced yet
  
  for (const order of orders) {
    // Check if order already exists locally
    const existingOrder = await executeQuery(
      'SELECT id FROM orders WHERE id = ?',
      [order.id]
    );
    
    if (existingOrder.length === 0) {
      // Insert new order
      await insertRecord('orders', {
        ...order,
        synced: 1,
      });
      
      // Insert order items
      for (const item of order.items) {
        await insertRecord('order_items', {
          ...item,
          order_id: order.id,
          synced: 1,
        });
      }
    }
  }
  
  return orders.length;
}

/**
 * Upload unsynchronized orders to the server
 */
export async function uploadOrders(token: string, salesRepId: string): Promise<number> {
  // Get unsynchronized orders
  const orders = await getUnsyncedRecords<any>('orders');
  if (orders.length === 0) return 0;
  
  const ordersWithItems = [];
  
  // Collect items for each order
  for (const order of orders) {
    const items = await executeQuery(
      'SELECT * FROM order_items WHERE order_id = ?',
      [order.id]
    );
    
    ordersWithItems.push({
      ...order,
      items,
    });
  }
  
  // Send to server
  const payload = {
    salesRepId,
    deviceId,
    orders: ordersWithItems,
  };
  
  const result = await postToApi(ENDPOINTS.SYNC_ORDERS, payload, token);
  
  // Mark orders as synced if successful
  const orderIds = orders.map(order => order.id);
  await markAsSynced('orders', orderIds);
  
  // Mark order items as synced
  for (const orderId of orderIds) {
    const items = await executeQuery(
      'SELECT id FROM order_items WHERE order_id = ?',
      [orderId]
    );
    
    const itemIds = items.map(item => item.id);
    await markAsSynced('order_items', itemIds);
  }
  
  return orders.length;
}

/**
 * Log synchronization event
 */
export async function logSyncEvent(
  token: string,
  eventType: 'upload' | 'download' | 'error',
  salesRepId: string,
  details: any = {}
): Promise<void> {
  const payload = {
    eventType,
    deviceId,
    salesRepId,
    details,
  };
  
  await postToApi(ENDPOINTS.LOG_SYNC, payload, token);
  
  // Also save locally
  await insertRecord('sync_logs', {
    event_type: eventType,
    device_id: deviceId,
    sales_rep_id: salesRepId,
    details: JSON.stringify(details),
    created_at: new Date().toISOString(),
  });
}

/**
 * Perform a full synchronization
 */
export async function fullSync(token: string, salesRepId: string): Promise<{
  uploaded: number;
  clients: number;
  products: number;
  orders: number;
  success: boolean;
}> {
  const result = {
    uploaded: 0,
    clients: 0,
    products: 0,
    orders: 0,
    success: false,
  };

  try {
    const isConnected = await checkConnection();
    if (!isConnected) {
      return { ...result };
    }

    // First upload any pending orders
    result.uploaded = await uploadOrders(token, salesRepId);
    await logSyncEvent(token, 'upload', salesRepId, { count: result.uploaded });

    // Then download updated data
    result.clients = await downloadClients(token, salesRepId);
    result.products = await downloadProducts(token);
    result.orders = await downloadOrders(token, salesRepId);

    await logSyncEvent(token, 'download', salesRepId, {
      clients: result.clients,
      products: result.products,
      orders: result.orders,
    });

    result.success = true;
    return result;
  } catch (error) {
    await logSyncEvent(token, 'error', salesRepId, { 
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Get local sync logs
 */
export async function getLocalSyncLogs(): Promise<any[]> {
  return await executeQuery(
    'SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 100'
  );
}
