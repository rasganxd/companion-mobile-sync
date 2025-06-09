
class SupabaseService {
  private baseUrl = 'https://ufvnubabpcyimahbubkd.supabase.co/functions/v1';
  private anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmdm51YmFicGN5aW1haGJ1YmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MzQ1NzIsImV4cCI6MjA2MzQxMDU3Mn0.rL_UAaLky3SaSAigQPrWAZjhkM8FBmeO0w-pEiB5aro';

  async authenticateSalesRep(code: string, password: string) {
    console.log('🔐 Authenticating sales rep with improved headers:', code);
    
    try {
      // Tentar API online primeiro com headers corretos
      const response = await fetch(`${this.baseUrl}/mobile-auth`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.anonKey}`,
          'Content-Type': 'application/json',
          'apikey': this.anonKey
        },
        body: JSON.stringify({ code, password })
      });

      console.log('📡 Auth response status:', response.status);
      console.log('📡 Auth response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Online authentication successful');
        return result;
      }
      
      const errorData = await response.json().catch(() => ({ error: 'Erro de comunicação com o servidor' }));
      console.error('❌ Online auth failed, trying local fallback:', errorData);
      
      // Fallback para autenticação local
      return await this.authenticateLocal(code, password);
      
    } catch (error) {
      console.error('❌ Network error, trying local fallback:', error);
      // Fallback para autenticação local
      return await this.authenticateLocal(code, password);
    }
  }

  private async authenticateLocal(code: string, password: string) {
    console.log('🔄 Attempting local authentication for code:', code);
    
    try {
      // Buscar dados locais de vendedores com dados reais
      const salesReps = this.getLocalSalesReps();
      const salesRep = salesReps.find(rep => rep.code === code);
      
      if (!salesRep || !salesRep.active) {
        console.log('❌ Local auth: Sales rep not found or inactive');
        return { 
          success: false, 
          error: 'Vendedor não encontrado ou inativo' 
        };
      }
      
      if (salesRep.password !== password) {
        console.log('❌ Local auth: Invalid password');
        return { 
          success: false, 
          error: 'Código ou senha incorretos' 
        };
      }
      
      console.log('✅ Local authentication successful');
      
      // Remover senha dos dados retornados
      const { password: _, ...salesRepData } = salesRep;
      
      return { 
        success: true, 
        salesRep: salesRepData,
        sessionToken: `local_${salesRep.id}_${Date.now()}`
      };
      
    } catch (error) {
      console.error('❌ Local authentication error:', error);
      return { 
        success: false, 
        error: 'Erro na autenticação local' 
      };
    }
  }

  private getLocalSalesReps() {
    // Dados de exemplo para teste local com dados reais
    const localData = localStorage.getItem('local_sales_reps');
    if (localData) {
      try {
        return JSON.parse(localData);
      } catch (error) {
        console.error('Error parsing local sales reps data:', error);
      }
    }

    // Dados reais do vendedor Candatti para fallback
    return [
      {
        id: '1',
        code: '1',
        name: 'Candatti',
        email: 'candatti@empresa.com',
        phone: '(11) 99999-9999',
        password: 'senha123',
        active: true
      }
    ];
  }

  async getClientsForSalesRep(salesRepId: string, sessionToken: string) {
    console.log('📥 Fetching clients for sales rep:', salesRepId);
    console.log('🔑 Using session token type:', sessionToken.startsWith('local_') ? 'LOCAL' : 'SUPABASE');
    
    // Validar parâmetros antes de fazer a requisição
    if (!salesRepId) {
      console.error('❌ Sales rep ID is required');
      throw new Error('ID do vendedor é obrigatório para buscar clientes');
    }

    if (!sessionToken) {
      console.error('❌ Session token is required');
      throw new Error('Token de sessão é obrigatório para buscar clientes');
    }
    
    try {
      const requestBody = { 
        type: 'clients',
        sales_rep_id: salesRepId 
      };
      
      console.log('📤 Sending request body:', requestBody);

      const response = await fetch(`${this.baseUrl}/mobile-data-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
          'apikey': this.anonKey
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Clients sync response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Clients sync error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: 'Erro ao buscar clientes: ' + errorText };
        }
        
        // For local tokens, return empty array instead of throwing error
        if (sessionToken.startsWith('local_')) {
          console.log('🔄 Local token detected, returning empty array for graceful degradation');
          return [];
        }
        
        throw new Error(errorData.error || 'Erro ao buscar clientes');
      }

      const data = await response.json();
      console.log(`✅ Successfully fetched ${data.clients?.length || 0} clients`);
      return data.clients || [];
    } catch (error) {
      console.error('❌ Network error fetching clients:', error);
      
      // For local tokens, return empty array instead of throwing error
      if (sessionToken.startsWith('local_')) {
        console.log('🔄 Local token with network error, returning empty array');
        return [];
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Erro de conexão ao buscar clientes. Verifique sua internet.');
      }
      throw error;
    }
  }

  async getProducts(sessionToken: string) {
    console.log('📥 Fetching products from Supabase');
    console.log('🔑 Using session token type:', sessionToken.startsWith('local_') ? 'LOCAL' : 'SUPABASE');
    
    // Validar parâmetros antes de fazer a requisição
    if (!sessionToken) {
      console.error('❌ Session token is required');
      throw new Error('Token de sessão é obrigatório para buscar produtos');
    }
    
    try {
      const requestBody = { type: 'products' };
      console.log('📤 Sending request body:', requestBody);

      const response = await fetch(`${this.baseUrl}/mobile-data-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
          'apikey': this.anonKey
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Products sync response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Products sync error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: 'Erro ao buscar produtos: ' + errorText };
        }
        
        // For local tokens, return empty array instead of throwing error
        if (sessionToken.startsWith('local_')) {
          console.log('🔄 Local token detected, returning empty array for graceful degradation');
          return [];
        }
        
        throw new Error(errorData.error || 'Erro ao buscar produtos');
      }

      const data = await response.json();
      console.log(`✅ Successfully fetched ${data.products?.length || 0} products`);
      return data.products || [];
    } catch (error) {
      console.error('❌ Network error fetching products:', error);
      
      // For local tokens, return empty array instead of throwing error
      if (sessionToken.startsWith('local_')) {
        console.log('🔄 Local token with network error, returning empty array');
        return [];
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Erro de conexão ao buscar produtos. Verifique sua internet.');
      }
      throw error;
    }
  }

  async getPaymentTables(sessionToken: string) {
    console.log('📥 Fetching payment tables from Supabase');
    console.log('🔑 Using session token type:', sessionToken.startsWith('local_') ? 'LOCAL' : 'SUPABASE');
    
    // Validar parâmetros antes de fazer a requisição
    if (!sessionToken) {
      console.error('❌ Session token is required');
      throw new Error('Token de sessão é obrigatório para buscar tabelas de pagamento');
    }
    
    try {
      const requestBody = { type: 'payment_tables' };
      console.log('📤 Sending request body:', requestBody);

      const response = await fetch(`${this.baseUrl}/mobile-data-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
          'apikey': this.anonKey
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Payment tables sync response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Payment tables sync error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: 'Erro ao buscar tabelas de pagamento: ' + errorText };
        }
        
        // For local tokens, return empty array instead of throwing error
        if (sessionToken.startsWith('local_')) {
          console.log('🔄 Local token detected, returning empty array for graceful degradation');
          return [];
        }
        
        throw new Error(errorData.error || 'Erro ao buscar tabelas de pagamento');
      }

      const data = await response.json();
      console.log(`✅ Successfully fetched ${data.payment_tables?.length || 0} payment tables`);
      return data.payment_tables || [];
    } catch (error) {
      console.error('❌ Network error fetching payment tables:', error);
      
      // For local tokens, return empty array instead of throwing error
      if (sessionToken.startsWith('local_') ) {
        console.log('🔄 Local token with network error, returning empty array');
        return [];
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Erro de conexão ao buscar tabelas de pagamento. Verifique sua internet.');
      }
      throw error;
    }
  }

  async transmitOrders(orders: any[], sessionToken: string) {
    console.log(`📤 Transmitting ${orders.length} orders to Supabase individually`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Transmitir cada pedido individualmente
    for (const order of orders) {
      try {
        console.log(`📤 Transmitting order ${order.id}:`, {
          customer_id: order.customer_id,
          customer_name: order.customer_name,
          total: order.total,
          date: order.date,
          itemsCount: order.items?.length || 0
        });

        const response = await fetch(`${this.baseUrl}/mobile-orders-import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
          },
          body: JSON.stringify(order) // Enviar pedido individual, não array
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMsg = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
          console.error(`❌ Error transmitting order ${order.id}:`, errorMsg);
          errors.push(`Pedido ${order.id}: ${errorMsg}`);
          errorCount++;
        } else {
          const result = await response.json();
          console.log(`✅ Order ${order.id} transmitted successfully:`, result);
          successCount++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error(`❌ Network error transmitting order ${order.id}:`, errorMsg);
        errors.push(`Pedido ${order.id}: ${errorMsg}`);
        errorCount++;
      }
    }

    const result = {
      success: successCount > 0,
      successCount,
      errorCount,
      totalOrders: orders.length,
      errors: errors.length > 0 ? errors : undefined
    };

    if (errorCount > 0) {
      result.error = `${errorCount} de ${orders.length} pedidos falharam na transmissão`;
    }

    console.log('📊 Transmission summary:', result);
    return result;
  }
}

export const supabaseService = new SupabaseService();
