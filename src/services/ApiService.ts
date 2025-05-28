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
  salesRepId: string;
  useMobileImportEndpoint?: boolean;
}

class ApiService {
  private static instance: ApiService;
  private baseUrl = 'https://ufvnubabpcyimahbubkd.supabase.co';
  private apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmdm51YmFicGN5aW1haGJ1YmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MzQ1NzIsImV4cCI6MjA2MzQxMDU3Mn0.rL_UAaLky3SaSAigQPrWAZjhkM8FBmeO0w-pEiB5aro';
  private useMobileImportEndpoint = true;

  private constructor() {}

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async getAuthHeaders(method?: string): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': this.apiKey,
      'Accept': 'application/json'
    };

    if (method === 'POST') {
      headers['Prefer'] = 'return=representation';
    }

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    return headers;
  }

  setMobileImportMode(enabled: boolean): void {
    this.useMobileImportEndpoint = enabled;
    console.log(`📱 Mobile import mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  private validateEndpointUsage(): void {
    if (this.useMobileImportEndpoint) {
      console.log('✅ Using mobile import endpoint - pedidos aguardam importação manual');
    } else {
      console.warn('⚠️ Using direct orders endpoint - pedidos aparecem diretamente no sistema');
    }
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getAuthHeaders(options.method as string);
    
    try {
      console.log('🔄 Making API request:', { 
        url, 
        method: options.method || 'GET', 
        headers: Object.keys(headers),
        body: options.body 
      });
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', { status: response.status, statusText: response.statusText, body: errorText });
        
        if (response.status === 401) {
          throw new Error('Não autorizado - faça login novamente');
        }
        if (response.status === 403) {
          throw new Error('Acesso negado');
        }
        
        throw new Error(`Erro na API: ${response.status} - ${errorText}`);
      }

      const contentLength = response.headers.get('content-length');
      const hasContent = contentLength && parseInt(contentLength) > 0;
      
      if (!hasContent || contentLength === '0') {
        console.log('⚠️ Empty response from server, but request was successful');
        if (options.method === 'POST') {
          return { success: true } as T;
        }
        return [] as T;
      }

      const responseText = await response.text();
      console.log('📄 Raw response text:', responseText);

      if (!responseText.trim()) {
        console.log('⚠️ Empty response body');
        if (options.method === 'POST') {
          return { success: true } as T;
        }
        return [] as T;
      }

      const data = JSON.parse(responseText);
      console.log('✅ Parsed API Response:', data);
      return Array.isArray(data) ? data as T : [data] as T;
    } catch (error) {
      console.error('❌ API request error:', error);
      throw error;
    }
  }

  private async requestMobileImport<T>(
    orderData: any,
    items: any[]
  ): Promise<T> {
    try {
      console.log('📱 Using mobile import endpoint...');
      
      const { data, error } = await supabase.functions.invoke('mobile-orders-import', {
        body: {
          ...orderData,
          items: items
        }
      });

      if (error) {
        console.error('❌ Mobile import error:', error);
        throw new Error(`Erro na importação móvel: ${error.message}`);
      }

      console.log('✅ Mobile import successful:', data);
      return data as T;
    } catch (error) {
      console.error('❌ Mobile import request error:', error);
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
      console.log('🔄 Testing Supabase connection...');
      
      // Verificar se o usuário está autenticado
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.error('❌ Auth error:', authError);
        throw new Error(`Erro de autenticação: ${authError.message}`);
      }
      
      if (!session) {
        console.error('❌ No active session');
        throw new Error('Usuário não está logado');
      }
      
      console.log('✅ User authenticated:', session.user.email);
      
      // Fazer uma query simples para testar a conexão
      const { data, error } = await supabase
        .from('customers')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('❌ Database connection error:', error);
        throw new Error(`Erro na conexão com banco: ${error.message}`);
      }
      
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }

  async createOrder(order: Omit<Order, 'id'>): Promise<Order> {
    try {
      console.log('📝 Creating order with data:', order);
      
      this.validateEndpointUsage();
      
      if (this.useMobileImportEndpoint) {
        console.log('📱 Using mobile import endpoint for order creation');
        const response = await this.requestMobileImport<any>(order, []);
        
        return {
          ...order,
          id: response.order_id || 'mobile-import-success',
          code: response.code
        } as Order;
      }

      console.warn('❌ ATENÇÃO: Usando endpoint direto - pedido aparecerá imediatamente no sistema');
      
      const code = await this.getNextOrderCode();
      const cleanOrder = { ...order, code };
      
      if (cleanOrder.sales_rep_id === '' || !cleanOrder.sales_rep_id) {
        delete cleanOrder.sales_rep_id;
      }
      
      console.log('📝 Creating order with code:', cleanOrder);
      
      const response = await this.request<Order[] | { success: boolean }>('/rest/v1/orders', {
        method: 'POST',
        body: JSON.stringify(cleanOrder),
      });
      
      if (response && typeof response === 'object' && 'success' in response) {
        console.log('✅ Order created successfully (no data returned)');
        return {
          ...cleanOrder,
          id: 'created-successfully'
        } as Order;
      }
      
      const orderArray = response as Order[];
      console.log('✅ Order created successfully:', orderArray[0]);
      return orderArray[0];
    } catch (error) {
      console.error('❌ Error creating order:', error);
      throw error;
    }
  }

  async createOrderWithItems(order: Omit<Order, 'id'>, items: Omit<OrderItem, 'id' | 'order_id'>[]): Promise<Order> {
    try {
      console.log('📦 Creating order with items:', { order, items });
      
      this.validateEndpointUsage();
      
      if (this.useMobileImportEndpoint) {
        console.log('📱 Using mobile import endpoint for order with items');
        const response = await this.requestMobileImport<any>(order, items);
        
        return {
          ...order,
          id: response.order_id || 'mobile-import-success',
          code: response.code,
          items: items as OrderItem[]
        } as Order;
      }

      console.warn('❌ ATENÇÃO: Usando endpoint direto - pedido aparecerá imediatamente no sistema');
      
      const createdOrder = await this.createOrder(order);
      
      if (items.length > 0 && createdOrder.id && createdOrder.id !== 'created-successfully') {
        console.log('📋 Creating order items...');
        const itemPromises = items.map(item => 
          this.createOrderItem({
            ...item,
            order_id: createdOrder.id!
          })
        );
        
        await Promise.all(itemPromises);
        console.log('✅ All order items created successfully');
      } else if (items.length > 0) {
        console.log('⚠️ Skipping item creation - no valid order ID returned');
      }
      
      return createdOrder;
    } catch (error) {
      console.error('❌ Error creating order with items:', error);
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

    return await this.request<Order[]>(`/rest/v1/orders?${params.toString()}`);
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    const response = await this.request<Order[]>(`/rest/v1/orders?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    
    return response[0];
  }

  async deleteOrder(id: string): Promise<void> {
    await this.request(`/rest/v1/orders?id=eq.${id}`, {
      method: 'DELETE',
    });
  }

  async createOrderItem(item: Omit<OrderItem, 'id'>): Promise<OrderItem> {
    const response = await this.request<OrderItem[] | { success: boolean }>('/rest/v1/order_items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    
    if (response && typeof response === 'object' && 'success' in response) {
      return {
        ...item,
        id: 'created-successfully'
      } as OrderItem;
    }
    
    const itemArray = response as OrderItem[];
    return itemArray[0];
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return await this.request<OrderItem[]>(`/rest/v1/order_items?order_id=eq.${orderId}`);
  }

  async getCustomers(filters: {
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Customer[]> {
    const params = new URLSearchParams();
    
    if (filters.search) {
      params.append('name', `ilike.%${filters.search}%`);
    }
    if (filters.limit) {
      params.append('limit', filters.limit.toString());
    }
    if (filters.offset) {
      params.append('offset', filters.offset.toString());
    }

    return await this.request<Customer[]>(`/rest/v1/customers?${params.toString()}`);
  }

  async createCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    const response = await this.request<Customer[]>('/rest/v1/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
    
    return response[0];
  }

  setConfig(config: ApiConfig): void {
    if (config.useMobileImportEndpoint !== undefined) {
      this.setMobileImportMode(config.useMobileImportEndpoint);
    }
    console.log('setConfig called - using direct Supabase integration with mobile import support');
  }

  getConfig(): ApiConfig | null {
    return {
      baseUrl: this.baseUrl,
      apiKey: this.apiKey,
      salesRepId: 'auto-supabase-auth',
      useMobileImportEndpoint: this.useMobileImportEndpoint
    };
  }
}

export default ApiService;
