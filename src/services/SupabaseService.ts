
class SupabaseService {
  private baseUrl = 'https://ywuudpssfhkqakbwzrlf.supabase.co/functions/v1';

  async authenticateSalesRep(code: string, password: string) {
    console.log('🔐 Authenticating sales rep with Supabase:', code);
    
    const response = await fetch(`${this.baseUrl}/mobile-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro de autenticação');
    }

    const result = await response.json();
    console.log('✅ Authentication successful');
    return result;
  }

  async getClientsForSalesRep(salesRepId: string, sessionToken: string) {
    console.log('📥 Fetching clients for sales rep:', salesRepId);
    
    const response = await fetch(`${this.baseUrl}/mobile-data-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({ 
        type: 'clients',
        sales_rep_id: salesRepId 
      })
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar clientes');
    }

    const data = await response.json();
    return data.clients || [];
  }

  async getProducts(sessionToken: string) {
    console.log('📥 Fetching products from Supabase');
    
    const response = await fetch(`${this.baseUrl}/mobile-data-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({ type: 'products' })
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar produtos');
    }

    const data = await response.json();
    return data.products || [];
  }

  async getPaymentTables(sessionToken: string) {
    console.log('📥 Fetching payment tables from Supabase');
    
    const response = await fetch(`${this.baseUrl}/mobile-data-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({ type: 'payment_tables' })
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar tabelas de pagamento');
    }

    const data = await response.json();
    return data.payment_tables || [];
  }

  async transmitOrders(orders: any[], sessionToken: string) {
    console.log(`📤 Transmitting ${orders.length} orders to Supabase`);
    
    const response = await fetch(`${this.baseUrl}/mobile-orders-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({ orders })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao transmitir pedidos');
    }

    const result = await response.json();
    console.log('✅ Orders transmitted successfully');
    return result;
  }
}

export const supabaseService = new SupabaseService();
