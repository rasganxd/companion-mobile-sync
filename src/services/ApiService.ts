import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  customer_id: string;
  customer_name?: string;
  sales_rep_id?: string;
  date: string;
  status: 'pending' | 'processed' | 'cancelled' | 'delivered';
  total: number;
  notes?: string;
  items?: OrderItem[];
  code?: number;
}

export interface Customer {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  sales_rep_id?: string;
}

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  salesRepId: string; // Mantido para compatibilidade, mas não usado
}

class ApiService {
  private static instance: ApiService;
  private baseUrl = 'https://ufvnubabpcyimahbubkd.supabase.co/rest/v1';
  private apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmdm51YmFicGN5aW1haGJ1YmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MzQ1NzIsImV4cCI6MjA2MzQxMDU3Mn0.rL_UAaLky3SaSAigQPrWAZjhkM8FBmeO0w-pEiB5aro';

  private constructor() {}

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': this.apiKey,
      'Accept': 'application/json'
    };

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getAuthHeaders();
    
    try {
      console.log('🔄 Making API request:', { url, method: options.method || 'GET', body: options.body });
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', { status: response.status, statusText: response.statusText, body: errorText });
        
        if (response.status === 401) {
          throw new Error('Não autorizado - faça login novamente');
        }
        if (response.status === 403) {
          throw new Error('Acesso negado');
        }
        
        // Parse error message for better user feedback
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message && errorData.message.includes('null value in column "code"')) {
            throw new Error('Erro: Campo código obrigatório não foi gerado. Tente novamente.');
          }
        } catch (parseError) {
          // If can't parse, use original error
        }
        
        throw new Error(`Erro na API: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ API Response:', data);
      return Array.isArray(data) ? data as T : [data] as T;
    } catch (error) {
      console.error('❌ API request error:', error);
      throw error;
    }
  }

  private async getNextOrderCode(): Promise<number> {
    try {
      console.log('🔢 Getting next order code...');
      
      const { data, error } = await supabase.rpc('get_next_order_code');
      
      if (error) {
        console.error('❌ Error getting next order code:', error);
        throw new Error('Erro ao gerar código do pedido');
      }
      
      console.log('✅ Generated order code:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to get next order code:', error);
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
    try {
      console.log('📝 Creating order with data:', order);
      
      // Get next order code
      const code = await this.getNextOrderCode();
      
      // Remove sales_rep_id se estiver vazio - será automaticamente inferido pelo RLS via auth.uid()
      const cleanOrder = { ...order, code };
      if (cleanOrder.sales_rep_id === '' || !cleanOrder.sales_rep_id) {
        delete cleanOrder.sales_rep_id;
      }
      
      console.log('📝 Creating order with code:', cleanOrder);
      
      const response = await this.request<Order[]>('/orders', {
        method: 'POST',
        body: JSON.stringify(cleanOrder),
      });
      
      console.log('✅ Order created successfully:', response[0]);
      return response[0];
    } catch (error) {
      console.error('❌ Error creating order:', error);
      throw error;
    }
  }

  async getOrders(filters: {
    customer_id?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Order[]> {
    const params = new URLSearchParams();
    
    // Removido: sales_rep_id filtro manual - RLS cuida automaticamente
    
    if (filters.customer_id) {
      params.append('customer_id', `eq.${filters.customer_id}`);
    }
    if (filters.status) {
      params.append('status', `eq.${filters.status}`);
    }
    if (filters.start_date) {
      params.append('date', `gte.${filters.start_date}`);
    }
    if (filters.end_date) {
      params.append('date', `lte.${filters.end_date}`);
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
    const response = await this.request<Order[]>(`/orders?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    
    return response[0];
  }

  async deleteOrder(id: string): Promise<void> {
    await this.request(`/orders?id=eq.${id}`, {
      method: 'DELETE',
    });
  }

  async createOrderItem(item: Omit<OrderItem, 'id'>): Promise<OrderItem> {
    const response = await this.request<OrderItem[]>('/order_items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    
    return response[0];
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return await this.request<OrderItem[]>(`/order_items?order_id=eq.${orderId}`);
  }

  async createOrderWithItems(order: Omit<Order, 'id'>, items: Omit<OrderItem, 'id' | 'order_id'>[]): Promise<Order> {
    try {
      console.log('📦 Creating order with items:', { order, items });
      
      // Criar pedido primeiro
      const createdOrder = await this.createOrder(order);
      
      // Depois criar todos os itens
      if (items.length > 0) {
        console.log('📋 Creating order items...');
        const itemPromises = items.map(item => 
          this.createOrderItem({
            ...item,
            order_id: createdOrder.id!
          })
        );
        
        await Promise.all(itemPromises);
        console.log('✅ All order items created successfully');
      }
      
      return createdOrder;
    } catch (error) {
      console.error('❌ Error creating order with items:', error);
      throw error;
    }
  }

  // Customers CRUD operations
  async getCustomers(filters: {
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Customer[]> {
    const params = new URLSearchParams();
    
    // Removido: sales_rep_id filtro manual - RLS cuida automaticamente
    
    if (filters.search) {
      params.append('name', `ilike.%${filters.search}%`);
    }
    if (filters.limit) {
      params.append('limit', filters.limit.toString());
    }
    if (filters.offset) {
      params.append('offset', filters.offset.toString());
    }

    return await this.request<Customer[]>(`/customers?${params.toString()}`);
  }

  async createCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    // Removido: sales_rep_id é automaticamente inferido pelo RLS via auth.uid()
    const response = await this.request<Customer[]>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
    
    return response[0];
  }

  // Método para configurar a API (mantido para compatibilidade)
  setConfig(config: ApiConfig): void {
    // Método mantido para compatibilidade, mas não usado
    console.log('setConfig called - using direct Supabase integration with auth.uid()');
  }

  getConfig(): ApiConfig | null {
    return {
      baseUrl: this.baseUrl,
      apiKey: this.apiKey,
      salesRepId: 'auto-supabase-auth' // Indicador de que usa auth automático
    };
  }
}

export default ApiService;
