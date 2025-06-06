class SupabaseService {
  private baseUrl = 'https://ufvnubabpcyimahbubkd.supabase.co/functions/v1';

  async authenticateSalesRep(code: string, password: string) {
    console.log('🔐 Authenticating sales rep with Supabase:', code);
    
    try {
      const response = await fetch(`${this.baseUrl}/mobile-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, password })
      });

      console.log('📡 Auth response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro de comunicação com o servidor' }));
        console.error('❌ Auth error response:', errorData);
        throw new Error(errorData.error || 'Erro de autenticação');
      }

      const result = await response.json();
      console.log('✅ Authentication successful');
      return result;
    } catch (error) {
      console.error('❌ Network error during authentication:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
      }
      throw error;
    }
  }

  async getClientsForSalesRep(salesRepId: string, sessionToken: string) {
    console.log('📥 Fetching clients for sales rep:', salesRepId);
    
    try {
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

      console.log('📡 Clients sync response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro ao buscar clientes' }));
        console.error('❌ Clients sync error:', errorData);
        throw new Error(errorData.error || 'Erro ao buscar clientes');
      }

      const data = await response.json();
      return data.clients || [];
    } catch (error) {
      console.error('❌ Network error fetching clients:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Erro de conexão ao buscar clientes.');
      }
      throw error;
    }
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
