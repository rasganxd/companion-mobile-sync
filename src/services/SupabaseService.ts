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
}

export const supabaseService = new SupabaseService();
