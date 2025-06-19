
import MobileDatabaseService from './MobileDatabaseService';
import { supabaseService } from './SupabaseService';
import { Capacitor } from '@capacitor/core';

interface DatabaseAdapter {
  initDatabase(): Promise<void>;
  getClients(): Promise<any[]>;
  getVisitRoutes(): Promise<any[]>;
  getOrders(clientId?: string): Promise<any[]>;
  getProducts(): Promise<any[]>;
  getPendingSyncItems(table: string): Promise<any[]>;
  updateSyncStatus(table: string, id: string, status: 'synced' | 'pending_sync' | 'error' | 'transmitted' | 'deleted'): Promise<void>;
  logSync(type: string, status: string, details?: string): Promise<void>;
  saveOrder(order: any): Promise<void>;
  updateClientStatus(clientId: string, status: string): Promise<void>;
  getClientById(clientId: string): Promise<any | null>;
  closeDatabase(): Promise<void>;
  // New methods for offline flow
  getPendingOrders(): Promise<any[]>;
  markOrderAsTransmitted(orderId: string): Promise<void>;
  getOfflineOrdersCount(): Promise<number>;
  // New methods for improved order management
  getClientOrders(clientId: string): Promise<any[]>;
  deleteOrder(orderId: string): Promise<void>;
  deleteAllOrders(): Promise<void>;
  getTransmittedOrders(): Promise<any[]>;
  getAllOrders(): Promise<any[]>;
  // New method for mobile orders
  saveMobileOrder(order: any): Promise<void>;
  // ✅ NOVO: Métodos para salvar dados em batch
  saveClients(clientsArray: any[]): Promise<void>;
  saveProducts(productsArray: any[]): Promise<void>;
  savePaymentTables(paymentTablesArray: any[]): Promise<void>;
  saveClient(client: any): Promise<void>;
  saveProduct(product: any): Promise<void>;
  // ✅ NOVOS métodos para validações e controle de status
  isClientNegated(clientId: string): Promise<boolean>;
  unnegateClient(clientId: string, reason: string): Promise<void>;
  getClientStatusHistory(clientId: string): Promise<any[]>;
  hasClientPendingOrders(clientId: string): Promise<boolean>;
  canCreateOrderForClient(clientId: string): Promise<{ canCreate: boolean; reason?: string; existingOrder?: any }>;
  // ✅ NOVO: Método específico para verificar pedido ativo único
  getActivePendingOrder(clientId: string): Promise<any | null>;
  // ✅ NOVOS métodos adicionados para corrigir os erros
  getCustomers(): Promise<any[]>;
  getPaymentTables(): Promise<any[]>;
  // ✅ NOVO: Método para obter pedido por ID
  getOrderById(orderId: string): Promise<any | null>;
  // ✅ NOVO: Método para limpar dados mock
  clearMockData?(): Promise<void>;
  // ✅ NOVOS: Métodos para atualização inteligente de status
  updateClientStatusAfterOrderDeletion?(clientId: string): Promise<void>;
  resetAllNegatedClientsStatus?(): Promise<void>;
  // ✅ NOVOS: Métodos para diagnóstico mobile
  getDatabaseDiagnostics(): Promise<any>;
  validateDatabaseIntegrity(): Promise<boolean>;
  // ✅ NOVO: Método de autenticação
  authenticateSalesRep(code: string, password: string): Promise<{ success: boolean; salesRep?: any; error?: string }>;
}

// Classe híbrida que implementa DatabaseAdapter
class HybridDatabaseAdapter implements DatabaseAdapter {
  private mobileService?: MobileDatabaseService;
  private isNativePlatform: boolean;

  constructor() {
    this.isNativePlatform = Capacitor.isNativePlatform();
    console.log('🔄 HybridDatabaseAdapter initialized:', {
      platform: Capacitor.getPlatform(),
      isNative: this.isNativePlatform,
      willUseMobile: this.isNativePlatform,
      willUseSupabase: !this.isNativePlatform
    });
  }

  async initDatabase(): Promise<void> {
    if (this.isNativePlatform) {
      console.log('📱 Using native mobile database service');
      this.mobileService = MobileDatabaseService.getInstance();
      await this.mobileService.initDatabase();
    } else {
      console.log('🌐 Using web-based service (no database initialization needed)');
      // No initialization needed for web
    }
  }

  async authenticateSalesRep(code: string, password: string): Promise<{ success: boolean; salesRep?: any; error?: string }> {
    console.log('🔐 HybridDatabaseAdapter.authenticateSalesRep - START');
    console.log(`📋 Environment: ${this.isNativePlatform ? 'NATIVE' : 'WEB'}`);
    
    if (this.isNativePlatform && this.mobileService) {
      console.log('📱 Using native mobile SQLite authentication');
      return await this.mobileService.authenticateSalesRep(code, password);
    } else {
      console.log('🌐 Using web Supabase authentication');
      return await supabaseService.authenticateSalesRep(code, password);
    }
  }

  // Implementar todos os outros métodos da interface
  async getClients(): Promise<any[]> {
    if (this.isNativePlatform && this.mobileService) {
      return await this.mobileService.getClients();
    }
    return [];
  }

  async getVisitRoutes(): Promise<any[]> {
    if (this.isNativePlatform && this.mobileService) {
      return await this.mobileService.getVisitRoutes();
    }
    return [];
  }

  async getOrders(clientId?: string): Promise<any[]> {
    if (this.isNativePlatform && this.mobileService) {
      return await this.mobileService.getOrders(clientId);
    }
    return [];
  }

  async getProducts(): Promise<any[]> {
    if (this.isNativePlatform && this.mobileService) {
      return await this.mobileService.getProducts();
    }
    return [];
  }

  async getPendingSyncItems(table: string): Promise<any[]> {
    if (this.isNativePlatform && this.mobileService) {
      return await this.mobileService.getPendingSyncItems(table);
    }
    return [];
  }

  async updateSyncStatus(table: string, id: string, status: 'synced' | 'pending_sync' | 'error' | 'transmitted' | 'deleted'): Promise<void> {
    if (this.isNativePlatform && this.mobileService) {
      await this.mobileService.updateSyncStatus(table, id, status);
    }
  }

  async logSync(type: string, status: string, details?: string): Promise<void> {
    if (this.isNativePlatform && this.mobileService) {
      await this.mobileService.logSync(type, status, details);
    }
  }

  async saveOrder(order: any): Promise<void> {
    if (this.isNativePlatform && this.mobileService) {
      await this.mobileService.saveOrder(order);
    }
  }

  async updateClientStatus(clientId: string, status: string): Promise<void> {
    if (this.isNativePlatform && this.mobileService) {
      await this.mobileService.updateClientStatus(clientId, status);
    }
  }

  async getClientById(clientId: string): Promise<any | null> {
    if (this.isNativePlatform && this.mobileService) {
      return await this.mobileService.getClientById(clientId);
    }
    return null;
  }

  async closeDatabase(): Promise<void> {
    if (this.isNativePlatform && this.mobileService) {
      await this.mobileService.closeDatabase();
    }
  }

  async getPendingOrders(): Promise<any[]> {
    if (this.isNativePlatform && this.mobileService) {
      return await this.mobileService.getPendingOrders();
    }
    return [];
  }

  async markOrderAsTransmitted(orderId: string): Promise<void> {
    if (this.isNativePlatform && this.mobileService) {
      await this.mobileService.markOrderAsTransmitted(orderId);
    }
  }

  async getOfflineOrdersCount(): Promise<number> {
    if (this.isNativePlatform && this.mobileService) {
      return await this.mobileService.getOfflineOrdersCount();
    }
    return 0;
  }

  async getClientOrders(clientId: string): Promise<any[]> {
    if (this.isNativePlatform && this.mobileService) {
      return await this.mobileService.getClientOrders(clientId);
    }
    return [];
  }

  async deleteOrder(orderId: string): Promise<void> {
    if (this.isNativePlatform && this.mobileService) {
      await this.mobileService.deleteOrder(orderId);
    }
  }

  async deleteAllOrders(): Promise<void> {
    if (this.isNativePlatform && this.mobileService) {
      await this.mobileService.deleteAllOrders();
    }
  }

  async getTransmittedOrders(): Promise<any[]> {
    if (this.isNativePlatform && this.mobileService) {
      return await this.mobileService.getTransmittedOrders();
    }
    return [];
  }

  async getAllOrders(): Promise<any[]> {
    if (this.isNativePlatform && this.mobileService) {
      return await this.mobileService.getAllOrders();
    }
    return [];
  }

  async saveMobileOrder(order: any): Promise<void> {
    if (this.isNativePlatform && this.mobileService) {
      await this.mobileService.saveMobileOrder(order);
    }
  }

  async saveClients(clientsArray: any[]): Promise<void> {
    if (this.isNativePlatform && this.mobileService) {
      await this.mobileService.saveClients(clientsArray);
    }
  }

  async saveProducts(productsArray: any[]): Promise<void> {
    if (this.isNativePlatform && this.mobileService) {
      await this.mobileService.saveProducts(productsArray);
    }
  }

  async savePaymentTables(paymentTablesArray: any[]): Promise<void> {
    if (this.isNativePlatform && this.mobileService) {
      await this.mobileService.savePaymentTables(paymentTablesArray);
    }
  }

  async saveClient(client: any): Promise<void> {
    if (this.isNativePlatform && this.mobileService) {
      await this.mobileService.saveClient(client);
    }
  }

  async saveProduct(product: any): Promise<void> {
    if (this.isNativePlatform && this.mobileService) {
      await this.mobileService.saveProduct(product);
    }
  }

  async isClientNegated(clientId: string): Promise<boolean> {
    if (this.isNativePlatform && this.mobileService) {
      return await this.mobileService.isClientNegated(clientId);
    }
    return false;
  }

  async unnegateClient(clientId: string, reason: string): Promise<void> {
    if (this.isNativePlatform && this.mobileService) {
      await this.mobileService.unnegateClient(clientId, reason);
    }
  }

  async getClientStatusHistory(clientId: string): Promise<any[]> {
    if (this.isNativePlatform && this.mobileService) {
      return await this.mobileService.getClientStatusHistory(clientId);
    }
    return [];
  }

  async hasClientPendingOrders(clientId: string): Promise<boolean> {
    if (this.isNativePlatform && this.mobileService) {
      return await this.mobileService.hasClientPendingOrders(clientId);
    }
    return false;
  }

  async canCreateOrderForClient(clientId: string): Promise<{ canCreate: boolean; reason?: string; existingOrder?: any }> {
    if (this.isNativePlatform && this.mobileService) {
      return await this.mobileService.canCreateOrderForClient(clientId);
    }
    return { canCreate: true };
  }

  async getActivePendingOrder(clientId: string): Promise<any | null> {
    if (this.isNativePlatform && this.mobileService) {
      return await this.mobileService.getActivePendingOrder(clientId);
    }
    return null;
  }

  async getCustomers(): Promise<any[]> {
    if (this.isNativePlatform && this.mobileService) {
      return await this.mobileService.getCustomers();
    }
    return [];
  }

  async getPaymentTables(): Promise<any[]> {
    if (this.isNativePlatform && this.mobileService) {
      return await this.mobileService.getPaymentTables();
    }
    return [];
  }

  async getOrderById(orderId: string): Promise<any | null> {
    if (this.isNativePlatform && this.mobileService) {
      return await this.mobileService.getOrderById(orderId);
    }
    return null;
  }

  async clearMockData(): Promise<void> {
    if (this.isNativePlatform && this.mobileService && this.mobileService.clearMockData) {
      await this.mobileService.clearMockData();
    }
  }

  async updateClientStatusAfterOrderDeletion(clientId: string): Promise<void> {
    if (this.isNativePlatform && this.mobileService && this.mobileService.updateClientStatusAfterOrderDeletion) {
      await this.mobileService.updateClientStatusAfterOrderDeletion(clientId);
    }
  }

  async resetAllNegatedClientsStatus(): Promise<void> {
    if (this.isNativePlatform && this.mobileService && this.mobileService.resetAllNegatedClientsStatus) {
      await this.mobileService.resetAllNegatedClientsStatus();
    }
  }

  async getDatabaseDiagnostics(): Promise<any> {
    if (this.isNativePlatform && this.mobileService) {
      return await this.mobileService.getDatabaseDiagnostics();
    }
    return { platform: 'web', diagnostics: 'No database diagnostics available for web platform' };
  }

  async validateDatabaseIntegrity(): Promise<boolean> {
    if (this.isNativePlatform && this.mobileService) {
      return await this.mobileService.validateDatabaseIntegrity();
    }
    return true;
  }
}

// Esta função sempre retorna o adaptador híbrido
export function getDatabaseAdapter(): DatabaseAdapter {
  console.log('📱 getDatabaseAdapter: Creating hybrid adapter');
  
  const platform = Capacitor.getPlatform();
  console.log('📱 Platform details:', {
    platform,
    isNative: Capacitor.isNativePlatform(),
    timestamp: new Date().toISOString()
  });
  
  try {
    const hybridAdapter = new HybridDatabaseAdapter();
    console.log('✅ Hybrid database adapter initialized successfully');
    return hybridAdapter;
  } catch (error) {
    console.error('❌ Critical error initializing hybrid database adapter:', error);
    throw new Error(`Failed to initialize hybrid database adapter: ${error}`);
  }
}

export default DatabaseAdapter;
