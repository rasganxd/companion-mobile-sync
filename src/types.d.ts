
// Sync related types
interface SyncStatus {
  lastSync: Date | null;
  inProgress: boolean;
  pendingUploads: number;
  pendingDownloads: number;
  connected: boolean;
}

interface SyncSettings {
  autoSync: boolean;
  syncInterval: number; // Minutes
  syncOnWifiOnly: boolean;
  syncEnabled: boolean;
}

// Client related types
interface Client {
  id: string | number;
  name?: string;
  fantasyName?: string;
  nome?: string; 
  fantasia?: string;
  codigo?: string;
  status?: string;
  [key: string]: any;
}

// Order related types
interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  code: string;
  unit: string;
}

interface Order {
  id: string;
  client_id: string;
  date: string;
  payment_method: string;
  total: number;
  items: OrderItem[];
  sync_status: string;
}

// Product related types
interface Product {
  id: number;
  code: string;
  name: string;
  price: number;
  unit: string;
  category: string;
  stock: number;
  min_stock: number;
  supplier: string;
  sync_status: string;
}

// Route related types
interface VisitRoute {
  id: string;
  day: string;
  clients: string[];
  sync_status: string;
}
