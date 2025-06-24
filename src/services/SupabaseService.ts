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
        id: 'e3eff363-2d17-4f73-9918-f53c6bc0bc48',
        code: '1',
        name: 'Candatti',
        email: 'candatti@empresa.com',
        phone: '(11) 99999-9999',
        password: 'senha123',
        active: true
      }
    ];
  }

  private async retryWithBackoff(attemptFn: () => Promise<Response>, maxAttempts: number = 3): Promise<Response> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxAttempts} to reach Supabase...`);
        const response = await attemptFn();
        
        if (response.ok) {
          console.log(`✅ Success on attempt ${attempt}`);
          return response;
        }
        
        if (attempt === maxAttempts) {
          console.log(`❌ All ${maxAttempts} attempts failed`);
          return response;
        }
        
        // Backoff exponencial: 1s, 2s, 4s...
        const backoffMs = Math.pow(2, attempt - 1) * 1000;
        console.log(`⏳ Waiting ${backoffMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed with error:`, error);
        
        if (attempt === maxAttempts) {
          throw error;
        }
        
        // Backoff para erros de rede
        const backoffMs = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
    
    throw new Error('Max attempts reached');
  }

  async getClientsForSalesRep(salesRepId: string, sessionToken: string) {
    console.log('📥 Fetching clients for sales rep:', salesRepId);
    console.log('🔑 Using session token type:', sessionToken.startsWith('local_') ? 'LOCAL' : 'SUPABASE');
    
    // Extrair código do vendedor do localStorage ou do salesRep
    const salesRepData = localStorage.getItem('salesRep');
    let salesRepCode = null;
    
    if (salesRepData) {
      try {
        const parsedData = JSON.parse(salesRepData);
        salesRepCode = parsedData.code;
        console.log('📋 Sales rep code extracted from localStorage:', salesRepCode);
      } catch (error) {
        console.error('❌ Error parsing salesRep data:', error);
      }
    }
    
    // Validar parâmetros antes de fazer a requisição
    if (!salesRepId) {
      console.error('❌ Sales rep ID is required');
      throw new Error('ID do vendedor é obrigatório para buscar clientes');
    }

    if (!sessionToken) {
      console.error('❌ Session token is required');
      throw new Error('Token de sessão é obrigatório para buscar clientes');
    }
    
    // 🔄 NOVA LÓGICA: Sempre tentar buscar dados reais primeiro
    try {
      console.log('🌐 Attempting to fetch REAL data from Supabase...');
      
      const requestBody = { 
        type: 'clients',
        sales_rep_id: salesRepId,
        sales_rep_code: salesRepCode
      };
      
      console.log('📤 Sending request body:', requestBody);

      const response = await this.retryWithBackoff(() => 
        fetch(`${this.baseUrl}/mobile-data-sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`,
            'apikey': this.anonKey
          },
          body: JSON.stringify(requestBody)
        })
      );

      console.log('📡 Clients sync response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        const clients = data.clients || [];
        console.log(`✅ Successfully fetched ${clients.length} REAL clients from Supabase`);
        return clients;
      }

      const errorText = await response.text();
      console.error('❌ Clients sync error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: 'Erro ao buscar clientes: ' + errorText };
      }
      
      throw new Error(errorData.error || 'Erro ao buscar clientes do Supabase');
      
    } catch (error) {
      console.error('❌ Failed to fetch clients from Supabase:', error);
      
      // 🔄 NOVA LÓGICA: Em caso de erro, verificar se há dados locais salvos
      console.log('🔍 Checking for previously synced local data...');
      
      try {
        const { getDatabaseAdapter } = await import('./DatabaseAdapter');
        const db = getDatabaseAdapter();
        const localClients = await db.getCustomers();
        
        if (localClients && localClients.length > 0) {
          console.log(`✅ Found ${localClients.length} previously synced clients in local database`);
          return localClients.filter(client => 
            client.sales_rep_id === salesRepId && client.active
          );
        }
        
        console.log('📭 No previously synced clients found in local database');
        
      } catch (dbError) {
        console.error('❌ Error accessing local database:', dbError);
      }
      
      // Se não há dados locais e não conseguiu buscar online, retornar erro
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Erro de conexão ao buscar clientes. Verifique sua internet e tente novamente.');
      }
      
      throw new Error('Não foi possível buscar clientes do Supabase nem encontrar dados locais. Execute uma sincronização quando houver conexão.');
    }
  }

  async getProducts(sessionToken: string) {
    console.log('📥 Fetching products from Supabase with hierarchical data');
    console.log('🔑 Using session token type:', sessionToken.startsWith('local_') ? 'LOCAL' : 'SUPABASE');
    
    // Extrair código do vendedor do localStorage
    const salesRepData = localStorage.getItem('salesRep');
    let salesRepCode = null;
    
    if (salesRepData) {
      try {
        const parsedData = JSON.parse(salesRepData);
        salesRepCode = parsedData.code;
        console.log('📋 Sales rep code extracted for products:', salesRepCode);
      } catch (error) {
        console.error('❌ Error parsing salesRep data:', error);
      }
    }
    
    // Validar parâmetros antes de fazer a requisição
    if (!sessionToken) {
      console.error('❌ Session token is required');
      throw new Error('Token de sessão é obrigatório para buscar produtos');
    }
    
    // 🔄 NOVA LÓGICA: Sempre tentar buscar dados reais primeiro
    try {
      console.log('🌐 Attempting to fetch REAL products with hierarchical data from Supabase...');
      
      const requestBody = { 
        type: 'products',
        sales_rep_code: salesRepCode,
        include_hierarchy: true // ✅ NOVO: Solicitar dados hierárquicos
      };
      console.log('📤 Sending request body:', requestBody);

      const response = await this.retryWithBackoff(() => 
        fetch(`${this.baseUrl}/mobile-data-sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`,
            'apikey': this.anonKey
          },
          body: JSON.stringify(requestBody)
        })
      );

      console.log('📡 Products sync response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        const products = data.products || [];
        console.log(`✅ Successfully fetched ${products.length} REAL products with hierarchy from Supabase`);
        
        // ✅ NOVO: Log para verificar se os dados hierárquicos estão chegando
        if (products.length > 0) {
          console.log('🔍 Sample product with hierarchy:', {
            name: products[0].name,
            group_name: products[0].group_name,
            brand_name: products[0].brand_name,
            category_name: products[0].category_name
          });
        }
        
        return products;
      }

      const errorText = await response.text();
      console.error('❌ Products sync error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: 'Erro ao buscar produtos: ' + errorText };
      }
      
      throw new Error(errorData.error || 'Erro ao buscar produtos do Supabase');
      
    } catch (error) {
      console.error('❌ Failed to fetch products from Supabase:', error);
      
      // 🔄 NOVA LÓGICA: Em caso de erro, verificar se há dados locais salvos
      console.log('🔍 Checking for previously synced local products...');
      
      try {
        const { getDatabaseAdapter } = await import('./DatabaseAdapter');
        const db = getDatabaseAdapter();
        const localProducts = await db.getProducts();
        
        if (localProducts && localProducts.length > 0) {
          console.log(`✅ Found ${localProducts.length} previously synced products in local database`);
          return localProducts.filter(product => product.active);
        }
        
        console.log('📭 No previously synced products found in local database');
        
      } catch (dbError) {
        console.error('❌ Error accessing local database:', dbError);
      }
      
      // Se não há dados locais e não conseguiu buscar online, retornar erro
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Erro de conexão ao buscar produtos. Verifique sua internet e tente novamente.');
      }
      
      throw new Error('Não foi possível buscar produtos do Supabase nem encontrar dados locais. Execute uma sincronização quando houver conexão.');
    }
  }

  async getPaymentTables(sessionToken: string) {
    console.log('📥 Fetching payment tables from Supabase');
    console.log('🔑 Using session token type:', sessionToken.startsWith('local_') ? 'LOCAL' : 'SUPABASE');
    
    // Extrair código do vendedor do localStorage
    const salesRepData = localStorage.getItem('salesRep');
    let salesRepCode = null;
    
    if (salesRepData) {
      try {
        const parsedData = JSON.parse(salesRepData);
        salesRepCode = parsedData.code;
        console.log('📋 Sales rep code extracted for payment tables:', salesRepCode);
      } catch (error) {
        console.error('❌ Error parsing salesRep data:', error);
      }
    }
    
    // Validar parâmetros antes de fazer a requisição
    if (!sessionToken) {
      console.error('❌ Session token is required');
      throw new Error('Token de sessão é obrigatório para buscar tabelas de pagamento');
    }
    
    // 🔄 NOVA LÓGICA: Sempre tentar buscar dados reais primeiro
    try {
      console.log('🌐 Attempting to fetch REAL payment tables from Supabase...');
      
      const requestBody = { 
        type: 'payment_tables',
        sales_rep_code: salesRepCode
      };
      console.log('📤 Sending request body:', requestBody);

      const response = await this.retryWithBackoff(() => 
        fetch(`${this.baseUrl}/mobile-data-sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`,
            'apikey': this.anonKey
          },
          body: JSON.stringify(requestBody)
        })
      );

      console.log('📡 Payment tables sync response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        const paymentTables = data.payment_tables || [];
        console.log(`✅ Successfully fetched ${paymentTables.length} REAL payment tables from Supabase`);
        return paymentTables;
      }

      const errorText = await response.text();
      console.error('❌ Payment tables sync error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: 'Erro ao buscar tabelas de pagamento: ' + errorText };
      }
      
      throw new Error(errorData.error || 'Erro ao buscar tabelas de pagamento do Supabase');
      
    } catch (error) {
      console.error('❌ Failed to fetch payment tables from Supabase:', error);
      
      // 🔄 NOVA LÓGICA: Em caso de erro, verificar se há dados locais salvos
      console.log('🔍 Checking for previously synced local payment tables...');
      
      try {
        const { getDatabaseAdapter } = await import('./DatabaseAdapter');
        const db = getDatabaseAdapter();
        const localPaymentTables = await db.getPaymentTables();
        
        if (localPaymentTables && localPaymentTables.length > 0) {
          console.log(`✅ Found ${localPaymentTables.length} previously synced payment tables in local database`);
          return localPaymentTables.filter(table => table.active);
        }
        
        console.log('📭 No previously synced payment tables found in local database');
        
      } catch (dbError) {
        console.error('❌ Error accessing local database:', dbError);
      }
      
      // Se não há dados locais e não conseguiu buscar online, retornar erro
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Erro de conexão ao buscar tabelas de pagamento. Verifique sua internet e tente novamente.');
      }
      
      throw new Error('Não foi possível buscar tabelas de pagamento do Supabase nem encontrar dados locais. Execute uma sincronização quando houver conexão.');
    }
  }

  async getClientOrdersHistory(salesRepId: string, sessionToken: string) {
    console.log('📥 Fetching client orders history for sales rep:', salesRepId);
    console.log('🔑 Using session token type:', sessionToken.startsWith('local_') ? 'LOCAL' : 'SUPABASE');
    
    // Extrair código do vendedor do localStorage
    const salesRepData = localStorage.getItem('salesRep');
    let salesRepCode = null;
    
    if (salesRepData) {
      try {
        const parsedData = JSON.parse(salesRepData);
        salesRepCode = parsedData.code;
        console.log('📋 Sales rep code extracted for orders history:', salesRepCode);
      } catch (error) {
        console.error('❌ Error parsing salesRep data:', error);
      }
    }
    
    // Validar parâmetros antes de fazer a requisição
    if (!salesRepId) {
      console.error('❌ Sales rep ID is required');
      throw new Error('ID do vendedor é obrigatório para buscar histórico de pedidos');
    }

    if (!sessionToken) {
      console.error('❌ Session token is required');
      throw new Error('Token de sessão é obrigatório para buscar histórico de pedidos');
    }
    
    // 🔄 NOVA LÓGICA: Sempre tentar buscar dados reais primeiro
    try {
      console.log('🌐 Attempting to fetch REAL orders history from Supabase...');
      
      const requestBody = { 
        type: 'orders_history',
        sales_rep_id: salesRepId,
        sales_rep_code: salesRepCode,
        limit: 100 // Limitar aos últimos 100 pedidos
      };
      
      console.log('📤 Sending request body:', requestBody);

      const response = await this.retryWithBackoff(() => 
        fetch(`${this.baseUrl}/mobile-data-sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`,
            'apikey': this.anonKey
          },
          body: JSON.stringify(requestBody)
        })
      );

      console.log('📡 Orders history sync response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        const orders = data.orders || [];
        console.log(`✅ Successfully fetched ${orders.length} REAL orders from Supabase`);
        return orders;
      }

      const errorText = await response.text();
      console.error('❌ Orders history sync error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: 'Erro ao buscar histórico de pedidos: ' + errorText };
      }
      
      throw new Error(errorData.error || 'Erro ao buscar histórico de pedidos do Supabase');
      
    } catch (error) {
      console.error('❌ Failed to fetch orders history from Supabase:', error);
      
      // 🔄 NOVA LÓGICA: Em caso de erro, verificar se há dados locais salvos
      console.log('🔍 Checking for previously synced local orders...');
      
      try {
        const { getDatabaseAdapter } = await import('./DatabaseAdapter');
        const db = getDatabaseAdapter();
        const localOrders = await db.getAllOrders();
        
        if (localOrders && localOrders.length > 0) {
          console.log(`✅ Found ${localOrders.length} previously synced orders in local database`);
          return localOrders;
        }
        
        console.log('📭 No previously synced orders found in local database');
        
      } catch (dbError) {
        console.error('❌ Error accessing local database:', dbError);
      }
      
      // Se não há dados locais e não conseguiu buscar online, retornar erro
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Erro de conexão ao buscar histórico de pedidos. Verifique sua internet e tente novamente.');
      }
      
      throw new Error('Não foi possível buscar histórico de pedidos do Supabase nem encontrar dados locais. Execute uma sincronização quando houver conexão.');
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
      errors: errors.length > 0 ? errors : undefined,
      errorMessage: errorCount > 0 ? `${errorCount} de ${orders.length} pedidos falharam na transmissão` : undefined
    };

    console.log('📊 Transmission summary:', result);
    return result;
  }
}

export const supabaseService = new SupabaseService();
