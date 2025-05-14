
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
      } else {
        // Initialize with sample data if no data exists
        this.initializeSampleData();
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      // Initialize with sample data if there was an error
      this.initializeSampleData();
    }
  }

  private initializeSampleData() {
    // Sample clients
    this.storage.clients = [
      {
        id: "1",
        codigo: "101",
        status: "Ativo",
        nome: "Marcelo Oliveira Santos",
        fantasia: "MERCADO DO MARCELO",
        endereco: "Rua das Flores, 123",
        comprador: "Marcelo",
        bairro: "Centro",
        cidade: "Chapecó",
        telefone: ["(49)99875-4321", "(49)3322-1234", ""],
        tipoFJ: "J",
        diasMaxPrazo: "30",
        canal: "001-SUPERMERCAD",
        rotatividade: "Semanal",
        proximaVisita: "20/05/2025",
        restricao: "Livre",
        sync_status: "synced"
      },
      {
        id: "2",
        codigo: "102",
        status: "Ativo",
        nome: "Ana Paula da Silva",
        fantasia: "MINIMERCADO DA ANA",
        endereco: "Av. Principal, 456",
        comprador: "Ana",
        bairro: "Vila Nova",
        cidade: "Chapecó",
        telefone: ["(49)99912-3456", "", ""],
        tipoFJ: "J",
        diasMaxPrazo: "15",
        canal: "001-SUPERMERCAD",
        rotatividade: "Quinzenal",
        proximaVisita: "25/05/2025",
        restricao: "Livre",
        sync_status: "synced"
      },
      {
        id: "3",
        codigo: "103",
        status: "Pendente",
        nome: "Roberto Carlos Ferreira",
        fantasia: "CONVENIÊNCIA DO ROBERTO",
        endereco: "Rua Marechal Deodoro, 789",
        comprador: "Roberto",
        bairro: "Paraíso",
        cidade: "Chapecó",
        telefone: ["(49)99832-5678", "(49)3321-8765", ""],
        tipoFJ: "J",
        diasMaxPrazo: "7",
        canal: "002-CONVENIENC",
        rotatividade: "Semanal",
        proximaVisita: "18/05/2025",
        restricao: "Limite de crédito",
        sync_status: "pending"
      },
      {
        id: "4",
        codigo: "104",
        status: "Ativo",
        nome: "Fernanda Mendes Costa",
        fantasia: "PADARIA PÃO FRESCO",
        endereco: "Travessa das Acácias, 45",
        comprador: "Fernanda",
        bairro: "Jardim",
        cidade: "Chapecó",
        telefone: ["(49)99867-4321", "", ""],
        tipoFJ: "J",
        diasMaxPrazo: "10",
        canal: "003-PADARIAS",
        rotatividade: "Semanal",
        proximaVisita: "16/05/2025",
        restricao: "Livre",
        sync_status: "synced"
      },
      {
        id: "5",
        codigo: "105",
        status: "Inativo",
        nome: "José Ricardo Almeida",
        fantasia: "RESTAURANTE DO ZÉ",
        endereco: "Rua das Palmeiras, 222",
        comprador: "José",
        bairro: "Santa Maria",
        cidade: "Chapecó",
        telefone: ["(49)99898-7654", "(49)3325-9876", ""],
        tipoFJ: "J",
        diasMaxPrazo: "0",
        canal: "004-RESTAURANTE",
        rotatividade: "Mensal",
        proximaVisita: "10/06/2025",
        restricao: "Bloqueado por inadimplência",
        sync_status: "synced"
      }
    ];

    // Sample visit routes
    this.storage.visit_routes = [
      {
        id: "1",
        day: "Segunda",
        clients: ["1", "3"],
        sync_status: "synced"
      },
      {
        id: "2",
        day: "Terça",
        clients: ["2"],
        sync_status: "synced"
      },
      {
        id: "3",
        day: "Quarta",
        clients: ["4"],
        sync_status: "synced"
      },
      {
        id: "4",
        day: "Quinta",
        clients: ["5"],
        sync_status: "pending"
      },
      {
        id: "5",
        day: "Sexta",
        clients: ["1", "2"],
        sync_status: "synced"
      }
    ];

    // Sample orders
    this.storage.orders = [
      {
        id: "1",
        client_id: "1",
        date: "2025-05-10T14:30:00.000Z",
        payment_method: "À Vista",
        total: 234.50,
        items: [
          {
            id: 1,
            productId: 101,
            productName: "Refrigerante Cola 2L",
            quantity: 10,
            price: 8.50,
            code: "REF001",
            unit: "Un"
          },
          {
            id: 2,
            productId: 102,
            productName: "Biscoito Cream Cracker 400g",
            quantity: 15,
            price: 5.30,
            code: "BIS001",
            unit: "Pct"
          },
          {
            id: 3,
            productId: 103,
            productName: "Leite Integral 1L",
            quantity: 12,
            price: 4.75,
            code: "LAC001",
            unit: "Un"
          }
        ],
        sync_status: "synced"
      },
      {
        id: "2",
        client_id: "1",
        date: "2025-05-03T10:15:00.000Z",
        payment_method: "30 dias",
        total: 312.75,
        items: [
          {
            id: 1,
            productId: 104,
            productName: "Arroz Tipo 1 5kg",
            quantity: 5,
            price: 22.90,
            code: "CER001",
            unit: "Pct"
          },
          {
            id: 2,
            productId: 105,
            productName: "Feijão Preto 1kg",
            quantity: 10,
            price: 8.75,
            code: "CER002",
            unit: "Pct"
          },
          {
            id: 3,
            productId: 106,
            productName: "Óleo de Soja 900ml",
            quantity: 8,
            price: 9.50,
            code: "OLE001",
            unit: "Un"
          }
        ],
        sync_status: "synced"
      },
      {
        id: "3",
        client_id: "2",
        date: "2025-05-12T16:45:00.000Z",
        payment_method: "15 dias",
        total: 156.80,
        items: [
          {
            id: 1,
            productId: 107,
            productName: "Detergente Líquido 500ml",
            quantity: 12,
            price: 2.90,
            code: "LIM001",
            unit: "Un"
          },
          {
            id: 2,
            productId: 108,
            productName: "Sabão em Pó 1kg",
            quantity: 6,
            price: 15.50,
            code: "LIM002",
            unit: "Pct"
          }
        ],
        sync_status: "pending"
      }
    ];

    // Save initialized data
    this.saveToStorage();
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
