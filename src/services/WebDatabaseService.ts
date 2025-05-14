
class WebDatabaseService {
  private static instance: WebDatabaseService;
  private storage: Record<string, any[]> = {
    clients: [],
    orders: [],
    visit_routes: [],
    sync_log: []
  };

  private constructor() {
    // Load initial data from localStorage if available
    try {
      const savedData = localStorage.getItem('vendas_fortes_db');
      if (savedData) {
        this.storage = JSON.parse(savedData);
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }

  static getInstance(): WebDatabaseService {
    if (!WebDatabaseService.instance) {
      WebDatabaseService.instance = new WebDatabaseService();
    }
    return WebDatabaseService.instance;
  }

  async initDatabase(): Promise<void> {
    console.log('Web database initialized successfully');
    return Promise.resolve();
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('vendas_fortes_db', JSON.stringify(this.storage));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  async getClients(): Promise<any[]> {
    return Promise.resolve([...this.storage.clients]);
  }

  async getVisitRoutes(): Promise<any[]> {
    return Promise.resolve([...this.storage.visit_routes]);
  }

  async getOrders(clientId?: string): Promise<any[]> {
    if (clientId) {
      return Promise.resolve(
        this.storage.orders.filter(order => order.client_id === clientId)
      );
    }
    return Promise.resolve([...this.storage.orders]);
  }

  async getPendingSyncItems(table: string): Promise<any[]> {
    if (!this.storage[table]) return Promise.resolve([]);
    
    return Promise.resolve(
      this.storage[table].filter(item => item.sync_status === 'pending')
    );
  }

  async updateSyncStatus(table: string, id: string, status: 'synced' | 'pending' | 'error'): Promise<void> {
    if (!this.storage[table]) return Promise.resolve();
    
    const index = this.storage[table].findIndex(item => item.id === id);
    if (index !== -1) {
      this.storage[table][index].sync_status = status;
      this.saveToStorage();
    }
    
    return Promise.resolve();
  }

  async logSync(type: string, status: string, details?: string): Promise<void> {
    const id = Date.now().toString();
    const syncDate = new Date().toISOString();
    
    this.storage.sync_log.push({
      id,
      sync_type: type,
      sync_date: syncDate,
      status,
      details: details || ''
    });
    
    this.saveToStorage();
    return Promise.resolve();
  }

  async closeDatabase(): Promise<void> {
    this.saveToStorage();
    return Promise.resolve();
  }
}

export default WebDatabaseService;
