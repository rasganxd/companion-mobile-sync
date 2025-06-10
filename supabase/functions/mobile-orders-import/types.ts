
export interface OrderItem {
  product_name: string;
  product_code?: number;
  quantity: number;
  price: number;
  total: number;
  description?: string;
  unit?: string;
}

export interface MobileOrder {
  customer_id: string;
  customer_name?: string;
  date: string;
  status: 'pending' | 'processed' | 'cancelled' | 'delivered';
  total: number;
  notes?: string;
  payment_method?: string;
  items?: OrderItem[];
  test?: boolean;
  reason?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  sales_rep_id?: string;
  sales_rep_data?: any;
}

export interface SalesRep {
  id: string;
  code: number;
  name: string;
  email: string;
  active: boolean;
}
