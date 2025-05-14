
import {
  getAllRecords,
  getRecordById,
  insertRecord,
  updateRecord,
  deleteRecord,
  executeQuery,
  generateUniqueId,
} from '../database';

export interface OrderItem {
  id?: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  code: string;
  unit: string;
  synced?: number;
}

export interface Order {
  id: string;
  client_id: string;
  sales_rep_id: string;
  order_date: string;
  payment_method: string;
  total: number;
  status: string;
  version?: number;
  synced?: number;
  items?: OrderItem[];
}

/**
 * Get all orders
 */
export async function getAllOrders(): Promise<Order[]> {
  return await getAllRecords<Order>('orders');
}

/**
 * Get orders by client ID
 */
export async function getOrdersByClientId(clientId: string): Promise<Order[]> {
  const query = 'SELECT * FROM orders WHERE client_id = ? ORDER BY order_date DESC';
  return await executeQuery<Order>(query, [clientId]);
}

/**
 * Get unsynced orders
 */
export async function getUnsyncedOrders(): Promise<Order[]> {
  const query = 'SELECT * FROM orders WHERE synced = 0';
  return await executeQuery<Order>(query);
}

/**
 * Get order by ID with items
 */
export async function getOrderWithItems(orderId: string): Promise<Order | null> {
  const order = await getRecordById<Order>('orders', orderId);
  
  if (!order) return null;
  
  const items = await getOrderItems(orderId);
  return { ...order, items };
}

/**
 * Get order items
 */
export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const query = 'SELECT * FROM order_items WHERE order_id = ?';
  return await executeQuery<OrderItem>(query, [orderId]);
}

/**
 * Create a new order with items
 */
export async function createOrder(
  order: Omit<Order, 'id' | 'items'>, 
  items: Omit<OrderItem, 'id' | 'order_id'>[]
): Promise<string> {
  const orderId = await insertRecord('orders', {
    ...order,
    synced: 0,
    version: 1,
  });
  
  // Insert order items
  for (const item of items) {
    await insertRecord('order_items', {
      ...item,
      order_id: orderId,
      synced: 0,
    });
  }
  
  return orderId;
}

/**
 * Update order status
 */
export async function updateOrderStatus(orderId: string, status: string): Promise<void> {
  await updateRecord<Order>('orders', orderId, {
    status,
    synced: 0,
  });
}

/**
 * Delete an order and its items
 */
export async function deleteOrder(orderId: string): Promise<void> {
  // Delete order items first
  await executeQuery('DELETE FROM order_items WHERE order_id = ?', [orderId]);
  
  // Then delete the order
  await deleteRecord('orders', orderId);
}
