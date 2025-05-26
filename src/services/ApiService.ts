
import { toast } from 'sonner';

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_name: string;
  product_code?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  description?: string;
}

export interface Order {
  id?: string;
  client_id: string;
  client_name?: string;
  sales_rep_id: string;
  order_date: string;
  status: 'pending' | 'processed' | 'cancelled' | 'delivered';
  total_amount: number;
  notes?: string;
  items?: OrderItem[];
}

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  salesRepId: string;
}

class ApiService {
  private static instance: ApiService;
  private config: ApiConfig | null = null;

  private constructor() {
    this.loadConfig();
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private loadConfig(): void {
    const savedConfig = localStorage.getItem('api_config');
    if (savedConfig) {
      try {
        this.config = JSON.parse(savedConfig);
      } catch (error) {
        console.error('Error loading API config:', error);
      }
    }
  }

  setConfig(config: ApiConfig): void {
    this.config = config;
    localStorage.setItem('api_config', JSON.stringify(config));
  }

  getConfig(): ApiConfig | null {
    return this.config;
  }

  private getHeaders(): Record<string, string> {
    if (!this.config?.apiKey) {
      throw new Error('API Key não configurada');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Accept': 'application/json'
    };
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.config?.baseUrl) {
      throw new Error('URL base da API não configurada');
    }

    const url = `${this.config.baseUrl}/api/rest${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Não autorizado - verifique sua API Key');
        }
        if (response.status === 403) {
          throw new Error('Acesso negado');
        }
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.request('/orders?limit=1');
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Orders CRUD operations
  async createOrder(order: Omit<Order, 'id'>): Promise<Order> {
    return await this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  async getOrders(filters: {
    sales_rep_id?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Order[]> {
    const params = new URLSearchParams();
    
    // Always filter by current sales rep
    if (this.config?.salesRepId) {
      params.append('sales_rep_id', `eq.${this.config.salesRepId}`);
    }
    
    if (filters.status) {
      params.append('status', `eq.${filters.status}`);
    }
    if (filters.start_date) {
      params.append('order_date', `gte.${filters.start_date}`);
    }
    if (filters.end_date) {
      params.append('order_date', `lte.${filters.end_date}`);
    }
    if (filters.limit) {
      params.append('limit', filters.limit.toString());
    }
    if (filters.offset) {
      params.append('offset', filters.offset.toString());
    }

    return await this.request<Order[]>(`/orders?${params.toString()}`);
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    return await this.request<Order>(`/orders?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteOrder(id: string): Promise<void> {
    await this.request(`/orders?id=eq.${id}`, {
      method: 'DELETE',
    });
  }

  // Order Items CRUD operations
  async createOrderItem(item: Omit<OrderItem, 'id'>): Promise<OrderItem> {
    return await this.request<OrderItem>('/order_items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return await this.request<OrderItem[]>(`/order_items?order_id=eq.${orderId}`);
  }

  async createOrderWithItems(order: Omit<Order, 'id'>, items: Omit<OrderItem, 'id' | 'order_id'>[]): Promise<Order> {
    // Create order first
    const createdOrder = await this.createOrder(order);
    
    // Then create all items
    const itemPromises = items.map(item => 
      this.createOrderItem({
        ...item,
        order_id: createdOrder.id!
      })
    );
    
    await Promise.all(itemPromises);
    
    return createdOrder;
  }
}

export default ApiService;
