import { createClient } from '@supabase/supabase-js';

class SupabaseService {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    this.supabaseUrl = 'https://ufvnubabpcyimahbubkd.supabase.co';
    this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmdm51YmFicGN5aW1haGJ1YmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MzQ1NzIsImV4cCI6MjA2MzQxMDU3Mn0.rL_UAaLky3SaSAigQPrWAZjhkM8FBmeO0w-pEiB5aro';
  }

  private createClient(token: string) {
    return createClient(this.supabaseUrl, this.supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  }

  async getClientsForSalesRep(salesRepId: string, sessionToken: string): Promise<any[]> {
    try {
      console.log('🔄 SupabaseService.getClientsForSalesRep - START');
      console.log(`📋 Parameters: salesRepId=${salesRepId}, tokenType=${sessionToken.startsWith('local_') ? 'LOCAL' : 'SUPABASE'}`);
      
      // ✅ CORREÇÃO: Sempre buscar dados reais do Supabase, mesmo com token local
      if (sessionToken.startsWith('local_')) {
        console.log('🔄 Local token detected, but forcing real data fetch from Supabase...');
        
        // Buscar dados reais usando API direta do Supabase
        const url = `${this.supabaseUrl}/rest/v1/customers?sales_rep_id=eq.${salesRepId}&active=eq.true&select=*`;
        console.log(`🌐 Making direct Supabase API call: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Supabase API error: ${response.status} - ${errorText}`);
          throw new Error(`Supabase API error: ${response.status}`);
        }
        
        const clients = await response.json();
        console.log(`✅ Received ${clients.length} clients from Supabase API`);
        
        // Log detalhado dos clientes recebidos
        clients.forEach((client, index) => {
          console.log(`👤 Client ${index + 1} from Supabase:`, {
            id: client.id,
            name: client.name,
            active: client.active,
            sales_rep_id: client.sales_rep_id,
            visit_days: client.visit_days,
            visit_days_type: typeof client.visit_days
          });
        });
        
        return clients;
      }
      
      // Para tokens do Supabase, usar método original
      console.log('🔄 Using Supabase client with real token...');
      const { data: clients, error } = await this.createClient(sessionToken)
        .from('customers')
        .select('*')
        .eq('sales_rep_id', salesRepId)
        .eq('active', true);

      if (error) {
        console.error('❌ Supabase query error:', error);
        throw error;
      }

      console.log(`✅ Received ${clients?.length || 0} clients from Supabase client`);
      return clients || [];
      
    } catch (error) {
      console.error('❌ Error in getClientsForSalesRep:', error);
      throw error;
    }
  }

  async getProducts(sessionToken: string): Promise<any[]> {
    try {
      console.log('🔄 SupabaseService.getProducts - START');
      
      // ✅ CORREÇÃO: Sempre buscar dados reais do Supabase, mesmo com token local
      if (sessionToken.startsWith('local_')) {
        console.log('🔄 Local token detected, but forcing real data fetch from Supabase...');
        
        const url = `${this.supabaseUrl}/rest/v1/products?select=*`;
        console.log(`🌐 Making direct Supabase API call: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Supabase API error: ${response.status} - ${errorText}`);
          throw new Error(`Supabase API error: ${response.status}`);
        }
        
        const products = await response.json();
        console.log(`✅ Received ${products.length} products from Supabase API`);
        return products;
      }
      
      // Para tokens do Supabase, usar método original
      const { data: products, error } = await this.createClient(sessionToken)
        .from('products')
        .select('*');

      if (error) {
        console.error('❌ Supabase query error:', error);
        throw error;
      }

      console.log(`✅ Received ${products?.length || 0} products from Supabase client`);
      return products || [];
      
    } catch (error) {
      console.error('❌ Error in getProducts:', error);
      throw error;
    }
  }

  async getPaymentTables(sessionToken: string): Promise<any[]> {
    try {
      console.log('🔄 SupabaseService.getPaymentTables - START');
      
      // ✅ CORREÇÃO: Sempre buscar dados reais do Supabase, mesmo com token local
      if (sessionToken.startsWith('local_')) {
        console.log('🔄 Local token detected, but forcing real data fetch from Supabase...');
        
        const url = `${this.supabaseUrl}/rest/v1/payment_tables?active=eq.true&select=*`;
        console.log(`🌐 Making direct Supabase API call: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Supabase API error: ${response.status} - ${errorText}`);
          throw new Error(`Supabase API error: ${response.status}`);
        }
        
        const paymentTables = await response.json();
        console.log(`✅ Received ${paymentTables.length} payment tables from Supabase API`);
        return paymentTables;
      }
      
      // Para tokens do Supabase, usar método original
      const { data: paymentTables, error } = await this.createClient(sessionToken)
        .from('payment_tables')
        .select('*')
        .eq('active', true);

      if (error) {
        console.error('❌ Supabase query error:', error);
        throw error;
      }

      console.log(`✅ Received ${paymentTables?.length || 0} payment tables from Supabase client`);
      return paymentTables || [];
      
    } catch (error) {
      console.error('❌ Error in getPaymentTables:', error);
      throw error;
    }
  }

  async syncSalesRep(sessionToken: string, salesRepId: string): Promise<any> {
    try {
      const { data, error } = await this.createClient(sessionToken)
        .from('sales_reps')
        .select('*')
        .eq('id', salesRepId)
        .single();

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in syncSalesRep:', error);
      throw error;
    }
  }

  async savePendingSyncItem(sessionToken: string, table: string, record: any): Promise<any> {
    try {
      const { data, error } = await this.createClient(sessionToken)
        .from('pending_sync')
        .insert([
          {
            table,
            record,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in savePendingSyncItem:', error);
      throw error;
    }
  }

  async getPendingSyncItems(sessionToken: string): Promise<any[]> {
    try {
      const { data, error } = await this.createClient(sessionToken)
        .from('pending_sync')
        .select('*');

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPendingSyncItems:', error);
      throw error;
    }
  }

  async deletePendingSyncItem(sessionToken: string, id: number): Promise<void> {
    try {
      const { error } = await this.createClient(sessionToken)
        .from('pending_sync')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deletePendingSyncItem:', error);
      throw error;
    }
  }

  async updateOrderStatus(sessionToken: string, orderId: string, status: string): Promise<void> {
    try {
      const { error } = await this.createClient(sessionToken)
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateOrderStatus:', error);
      throw error;
    }
  }

  async saveOrder(sessionToken: string, order: any): Promise<any> {
    try {
      const { data, error } = await this.createClient(sessionToken)
        .from('orders')
        .insert([order])
        .select()
        .single();

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in saveOrder:', error);
      throw error;
    }
  }

  async authenticateSalesRep(code: string, password: string): Promise<{ success: boolean; salesRep?: any; sessionToken?: string; error?: string }> {
    try {
      console.log('🔐 SupabaseService.authenticateSalesRep - START for code:', code);
      
      // Buscar vendedor por código
      const url = `${this.supabaseUrl}/rest/v1/sales_reps?code=eq.${code}&active=eq.true&select=*`;
      console.log(`🌐 Making Supabase API call: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Supabase API error: ${response.status} - ${errorText}`);
        return { success: false, error: `Erro na API: ${response.status}` };
      }
      
      const salesReps = await response.json();
      console.log(`📊 Found ${salesReps.length} sales reps`);
      
      if (salesReps.length === 0) {
        console.log('❌ Sales rep not found');
        return { success: false, error: 'Vendedor não encontrado' };
      }
      
      const salesRep = salesReps[0];
      
      // Verificar senha (implementação simples - em produção usar hash)
      if (salesRep.password !== password) {
        console.log('❌ Invalid password');
        return { success: false, error: 'Senha incorreta' };
      }
      
      // Gerar token de sessão
      const sessionToken = `supabase_session_${salesRep.id}_${Date.now()}`;
      
      console.log('✅ Authentication successful');
      return {
        success: true,
        salesRep: {
          id: salesRep.id,
          name: salesRep.name,
          code: salesRep.code,
          email: salesRep.email
        },
        sessionToken
      };
      
    } catch (error) {
      console.error('❌ Error in authenticateSalesRep:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido na autenticação' 
      };
    }
  }

  async transmitOrders(orders: any[], sessionToken: string): Promise<{ success: boolean; successCount: number; errorCount: number; errors?: string[]; errorMessage?: string }> {
    try {
      console.log('📤 SupabaseService.transmitOrders - START');
      console.log(`📋 Transmitting ${orders.length} orders`);
      
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      
      for (const order of orders) {
        try {
          // Transmitir para mobile_orders
          const url = `${this.supabaseUrl}/rest/v1/mobile_orders`;
          
          const orderData = {
            mobile_order_id: order.id,
            customer_id: order.customer_id,
            customer_name: order.customer_name,
            customer_code: order.customer_code,
            sales_rep_id: order.sales_rep_id || order.salesRepId,
            sales_rep_name: order.sales_rep_name || order.salesRepName,
            status: order.status,
            total: order.total,
            date: order.order_date || order.date || order.created_at,
            payment_table_id: order.payment_table_id,
            payment_table: order.payment_table,
            notes: order.notes,
            reason: order.reason,
            sync_status: 'transmitted'
          };
          
          console.log(`📤 Transmitting order ${order.id}:`, orderData);
          
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'apikey': this.supabaseKey,
              'Authorization': `Bearer ${this.supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(orderData)
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Failed to transmit order ${order.id}: ${response.status} - ${errorText}`);
            errors.push(`Order ${order.id}: ${response.status} - ${errorText}`);
            errorCount++;
            continue;
          }
          
          const result = await response.json();
          console.log(`✅ Order ${order.id} transmitted successfully:`, result);
          
          // Transmitir itens do pedido
          if (order.items && order.items.length > 0) {
            const mobileOrderId = result[0]?.id;
            if (mobileOrderId) {
              await this.transmitOrderItems(order.items, mobileOrderId, sessionToken);
            }
          }
          
          successCount++;
          
        } catch (itemError) {
          console.error(`❌ Error transmitting order ${order.id}:`, itemError);
          errors.push(`Order ${order.id}: ${itemError}`);
          errorCount++;
        }
      }
      
      console.log(`📊 Transmission summary: ${successCount} success, ${errorCount} errors`);
      
      return {
        success: successCount > 0,
        successCount,
        errorCount,
        errors: errors.length > 0 ? errors : undefined,
        errorMessage: errorCount > 0 ? `${errorCount} pedidos falharam na transmissão` : undefined
      };
      
    } catch (error) {
      console.error('❌ Error in transmitOrders:', error);
      return {
        success: false,
        successCount: 0,
        errorCount: orders.length,
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido na transmissão'
      };
    }
  }

  private async transmitOrderItems(items: any[], mobileOrderId: string, sessionToken: string): Promise<void> {
    try {
      const url = `${this.supabaseUrl}/rest/v1/mobile_order_items`;
      
      for (const item of items) {
        const itemData = {
          mobile_order_id: mobileOrderId,
          product_id: item.productId || item.product_id,
          product_name: item.productName || item.product_name,
          product_code: item.code || item.product_code,
          quantity: item.quantity,
          unit_price: item.price || item.unit_price,
          price: item.price || item.unit_price,
          unit: item.unit,
          total: (item.price || item.unit_price || 0) * item.quantity
        };
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(itemData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Failed to transmit item for order ${mobileOrderId}: ${response.status} - ${errorText}`);
        }
      }
    } catch (error) {
      console.error('❌ Error transmitting order items:', error);
    }
  }
}

export const supabaseService = new SupabaseService();
