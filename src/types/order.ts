
export interface LocalOrder {
  id: string;
  customer_id: string;
  customer_name: string;
  total: number;
  date: string;
  status: 'pending' | 'processed' | 'cancelled' | 'delivered';
  items?: any[];
  sync_status: 'pending_sync' | 'transmitted' | 'synced' | 'error';
  reason?: string;
  notes?: string;
  payment_method?: string;
}
