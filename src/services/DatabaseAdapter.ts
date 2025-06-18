
import MobileDatabaseService from './MobileDatabaseService';
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

// Esta função sempre retorna o MobileDatabaseService para ambiente mobile
export function getDatabaseAdapter(): DatabaseAdapter {
  console.log('📱 Mobile-only app: Using Mobile SQLite database service');
  
  const platform = Capacitor.getPlatform();
  console.log('📱 Platform details:', {
    platform,
    isNative: Capacitor.isNativePlatform(),
    timestamp: new Date().toISOString()
  });
  
  try {
    const mobileService = MobileDatabaseService.getInstance();
    console.log('✅ Mobile SQLite database service initialized successfully');
    
    // ✅ IMPLEMENTAR getCustomers() que corrige o parsing de visit_days
    const originalGetCustomers = mobileService.getCustomers?.bind(mobileService);
    if (!originalGetCustomers) {
      // Se getCustomers não existe, criar baseado em getClients
      mobileService.getCustomers = async function() {
        console.log('🔄 getCustomers() calling getClients() and parsing visit_days...');
        const clients = await this.getClients();
        console.log(`📊 Raw clients from DB: ${clients.length}`, clients);
        
        const processedClients = clients.map(client => {
          let visitDays = client.visit_days;
          
          // Parse visit_days se for string JSON
          if (typeof visitDays === 'string') {
            try {
              visitDays = JSON.parse(visitDays);
            } catch (error) {
              console.warn(`⚠️ Failed to parse visit_days for client ${client.id}:`, error);
              visitDays = [];
            }
          }
          
          // Garantir que visit_days seja array
          if (!Array.isArray(visitDays)) {
            visitDays = [];
          }
          
          const processedClient = {
            ...client,
            visit_days: visitDays
          };
          
          console.log(`👤 Processed client ${client.name}:`, {
            id: client.id,
            name: client.name,
            active: client.active,
            sales_rep_id: client.sales_rep_id,
            visit_days: visitDays,
            original_visit_days: client.visit_days
          });
          
          return processedClient;
        });
        
        console.log(`✅ getCustomers() returning ${processedClients.length} processed clients`);
        return processedClients;
      };
    } else {
      // Se getCustomers já existe, melhorar com parsing correto
      mobileService.getCustomers = async function() {
        console.log('🔄 Enhanced getCustomers() with visit_days parsing...');
        const clients = await originalGetCustomers();
        console.log(`📊 Raw customers from existing method: ${clients.length}`, clients);
        
        const processedClients = clients.map(client => {
          let visitDays = client.visit_days;
          
          // Parse visit_days se for string JSON
          if (typeof visitDays === 'string') {
            try {
              visitDays = JSON.parse(visitDays);
            } catch (error) {
              console.warn(`⚠️ Failed to parse visit_days for client ${client.id}:`, error);
              visitDays = [];
            }
          }
          
          // Garantir que visit_days seja array
          if (!Array.isArray(visitDays)) {
            visitDays = [];
          }
          
          return {
            ...client,
            visit_days: visitDays
          };
        });
        
        console.log(`✅ Enhanced getCustomers() returning ${processedClients.length} processed clients`);
        return processedClients;
      };
    }
    
    return mobileService as DatabaseAdapter;
  } catch (error) {
    console.error('❌ Critical error initializing Mobile SQLite database:', error);
    throw new Error(`Failed to initialize mobile database: ${error}`);
  }
}

export default DatabaseAdapter;
