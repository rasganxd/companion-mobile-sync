
class WebDatabaseService {
  private static instance: WebDatabaseService;
  private storage: Record<string, any[]> = {
    clients: [],
    orders: [],
    visit_routes: [],
    sync_log: [],
    products: [] // Adding products array
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
      },
      // Novos clientes adicionados
      {
        id: "6",
        codigo: "106",
        status: "Ativo",
        nome: "Carla Regina Monteiro",
        fantasia: "SUPERMERCADO BOM PREÇO",
        endereco: "Av. Brasil, 789",
        comprador: "Carla",
        bairro: "São Cristóvão",
        cidade: "Chapecó",
        telefone: ["(49)99765-4321", "(49)3322-5678", ""],
        tipoFJ: "J",
        diasMaxPrazo: "30",
        canal: "001-SUPERMERCAD",
        rotatividade: "Semanal",
        proximaVisita: "22/05/2025",
        restricao: "Livre",
        sync_status: "synced"
      },
      {
        id: "7",
        codigo: "107",
        status: "Ativo",
        nome: "Paulo Roberto Silveira",
        fantasia: "MERCADINHO DO PAULO",
        endereco: "Rua XV de Novembro, 1523",
        comprador: "Paulo",
        bairro: "Centro",
        cidade: "Xaxim",
        telefone: ["(49)99876-1234", "", ""],
        tipoFJ: "J",
        diasMaxPrazo: "15",
        canal: "001-SUPERMERCAD",
        rotatividade: "Quinzenal",
        proximaVisita: "28/05/2025",
        restricao: "Livre",
        sync_status: "synced"
      },
      {
        id: "8",
        codigo: "108",
        status: "Pendente",
        nome: "Mariana Costa e Silva",
        fantasia: "PANIFICADORA SABOR DO PÃO",
        endereco: "Av. Getúlio Vargas, 456",
        comprador: "Mariana",
        bairro: "Efapi",
        cidade: "Chapecó",
        telefone: ["(49)99832-9876", "", ""],
        tipoFJ: "J",
        diasMaxPrazo: "7",
        canal: "003-PADARIAS",
        rotatividade: "Semanal",
        proximaVisita: "17/05/2025",
        restricao: "Limite de crédito",
        sync_status: "pending"
      },
      {
        id: "9",
        codigo: "109",
        status: "Ativo",
        nome: "Luiz Fernando Machado",
        fantasia: "CONVENIÊNCIA 24 HORAS",
        endereco: "Rua Pedro Álvares Cabral, 89",
        comprador: "Luiz",
        bairro: "Bela Vista",
        cidade: "Chapecó",
        telefone: ["(49)99867-5555", "(49)3323-7788", ""],
        tipoFJ: "J",
        diasMaxPrazo: "10",
        canal: "002-CONVENIENC",
        rotatividade: "Semanal",
        proximaVisita: "19/05/2025",
        restricao: "Livre",
        sync_status: "synced"
      },
      {
        id: "10",
        codigo: "110",
        status: "Ativo",
        nome: "Beatriz Santos Oliveira",
        fantasia: "RESTAURANTE SABOR CASEIRO",
        endereco: "Av. Fernando Machado, 1234",
        comprador: "Beatriz",
        bairro: "Centro",
        cidade: "Chapecó",
        telefone: ["(49)99898-1111", "(49)3325-2222", ""],
        tipoFJ: "J",
        diasMaxPrazo: "20",
        canal: "004-RESTAURANTE",
        rotatividade: "Quinzenal",
        proximaVisita: "24/05/2025",
        restricao: "Livre",
        sync_status: "synced"
      }
    ];

    // Sample visit routes - updated to include new clients
    this.storage.visit_routes = [
      {
        id: "1",
        day: "Segunda",
        clients: ["1", "3", "6", "9"],
        sync_status: "synced"
      },
      {
        id: "2",
        day: "Terça",
        clients: ["2", "7", "10"],
        sync_status: "synced"
      },
      {
        id: "3",
        day: "Quarta",
        clients: ["4", "8"],
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
        clients: ["1", "2", "6"],
        sync_status: "synced"
      }
    ];

    // Sample products data
    this.storage.products = [
      {
        id: 101,
        code: "REF001",
        name: "Refrigerante Cola 2L",
        price: 8.50,
        unit: "Un",
        category: "Bebidas",
        stock: 150,
        min_stock: 20,
        supplier: "Bebidas Brasil",
        sync_status: "synced"
      },
      {
        id: 102,
        code: "BIS001",
        name: "Biscoito Cream Cracker 400g",
        price: 5.30,
        unit: "Pct",
        category: "Biscoitos",
        stock: 80,
        min_stock: 15,
        supplier: "Alimentos Nacional",
        sync_status: "synced"
      },
      {
        id: 103,
        code: "LAC001",
        name: "Leite Integral 1L",
        price: 4.75,
        unit: "Un",
        category: "Laticínios",
        stock: 120,
        min_stock: 30,
        supplier: "Laticínios Sul",
        sync_status: "synced"
      },
      {
        id: 104,
        code: "CER001",
        name: "Arroz Tipo 1 5kg",
        price: 22.90,
        unit: "Pct",
        category: "Cereais",
        stock: 75,
        min_stock: 10,
        supplier: "Cereais Brasil",
        sync_status: "synced"
      },
      {
        id: 105,
        code: "CER002",
        name: "Feijão Preto 1kg",
        price: 8.75,
        unit: "Pct",
        category: "Cereais",
        stock: 60,
        min_stock: 15,
        supplier: "Cereais Brasil",
        sync_status: "synced"
      },
      {
        id: 106,
        code: "OLE001",
        name: "Óleo de Soja 900ml",
        price: 9.50,
        unit: "Un",
        category: "Óleos",
        stock: 90,
        min_stock: 20,
        supplier: "Alimentos Nacional",
        sync_status: "synced"
      },
      {
        id: 107,
        code: "LIM001",
        name: "Detergente Líquido 500ml",
        price: 2.90,
        unit: "Un",
        category: "Limpeza",
        stock: 100,
        min_stock: 25,
        supplier: "Limpeza Total",
        sync_status: "synced"
      },
      {
        id: 108,
        code: "LIM002",
        name: "Sabão em Pó 1kg",
        price: 15.50,
        unit: "Pct",
        category: "Limpeza",
        stock: 70,
        min_stock: 15,
        supplier: "Limpeza Total",
        sync_status: "synced"
      },
      // Novos produtos adicionados
      {
        id: 109,
        code: "BEB001",
        name: "Água Mineral 500ml",
        price: 2.50,
        unit: "Un",
        category: "Bebidas",
        stock: 200,
        min_stock: 40,
        supplier: "Bebidas Brasil",
        sync_status: "synced"
      },
      {
        id: 110,
        code: "BEB002",
        name: "Suco de Laranja 1L",
        price: 7.90,
        unit: "Un",
        category: "Bebidas",
        stock: 85,
        min_stock: 20,
        supplier: "Sucos Naturais",
        sync_status: "synced"
      },
      {
        id: 111,
        code: "LAT001",
        name: "Iogurte Natural 500g",
        price: 6.50,
        unit: "Un",
        category: "Laticínios",
        stock: 60,
        min_stock: 15,
        supplier: "Laticínios Sul",
        sync_status: "synced"
      },
      {
        id: 112,
        code: "LAT002",
        name: "Queijo Mussarela 500g",
        price: 18.90,
        unit: "Un",
        category: "Laticínios",
        stock: 45,
        min_stock: 10,
        supplier: "Laticínios Sul",
        sync_status: "pending"
      },
      {
        id: 113,
        code: "CAR001",
        name: "Linguiça Calabresa 500g",
        price: 15.75,
        unit: "Pct",
        category: "Carnes",
        stock: 40,
        min_stock: 8,
        supplier: "Frigorífico Central",
        sync_status: "synced"
      },
      {
        id: 114,
        code: "CAR002",
        name: "Peito de Frango 1kg",
        price: 16.90,
        unit: "Kg",
        category: "Carnes",
        stock: 35,
        min_stock: 10,
        supplier: "Frigorífico Central",
        sync_status: "synced"
      },
      {
        id: 115,
        code: "HOR001",
        name: "Batata 1kg",
        price: 5.99,
        unit: "Kg",
        category: "Hortifruti",
        stock: 80,
        min_stock: 15,
        supplier: "Hortifruti Verde",
        sync_status: "synced"
      },
      {
        id: 116,
        code: "HOR002",
        name: "Tomate 1kg",
        price: 7.50,
        unit: "Kg",
        category: "Hortifruti",
        stock: 60,
        min_stock: 10,
        supplier: "Hortifruti Verde",
        sync_status: "pending"
      }
    ];

    // Sample orders - updated and added more orders
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
      },
      // Novos pedidos
      {
        id: "4",
        client_id: "3",
        date: "2025-05-11T09:20:00.000Z",
        payment_method: "À Vista",
        total: 175.25,
        items: [
          {
            id: 1,
            productId: 109,
            productName: "Água Mineral 500ml",
            quantity: 30,
            price: 2.50,
            code: "BEB001",
            unit: "Un"
          },
          {
            id: 2,
            productId: 110,
            productName: "Suco de Laranja 1L",
            quantity: 10,
            price: 7.90,
            code: "BEB002",
            unit: "Un"
          }
        ],
        sync_status: "synced"
      },
      {
        id: "5",
        client_id: "4",
        date: "2025-05-08T11:30:00.000Z",
        payment_method: "7 dias",
        total: 282.50,
        items: [
          {
            id: 1,
            productId: 111,
            productName: "Iogurte Natural 500g",
            quantity: 15,
            price: 6.50,
            code: "LAT001",
            unit: "Un"
          },
          {
            id: 2,
            productId: 112,
            productName: "Queijo Mussarela 500g",
            quantity: 10,
            price: 18.90,
            code: "LAT002",
            unit: "Un"
          }
        ],
        sync_status: "synced"
      },
      {
        id: "6",
        client_id: "6",
        date: "2025-05-09T13:45:00.000Z",
        payment_method: "15 dias",
        total: 471.75,
        items: [
          {
            id: 1,
            productId: 113,
            productName: "Linguiça Calabresa 500g",
            quantity: 12,
            price: 15.75,
            code: "CAR001",
            unit: "Pct"
          },
          {
            id: 2,
            productId: 114,
            productName: "Peito de Frango 1kg",
            quantity: 15,
            price: 16.90,
            code: "CAR002",
            unit: "Kg"
          }
        ],
        sync_status: "pending"
      },
      {
        id: "7",
        client_id: "7",
        date: "2025-05-05T10:00:00.000Z",
        payment_method: "À Vista",
        total: 194.70,
        items: [
          {
            id: 1,
            productId: 115,
            productName: "Batata 1kg",
            quantity: 20,
            price: 5.99,
            code: "HOR001",
            unit: "Kg"
          },
          {
            id: 2,
            productId: 116,
            productName: "Tomate 1kg",
            quantity: 12,
            price: 7.50,
            code: "HOR002",
            unit: "Kg"
          }
        ],
        sync_status: "synced"
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

  async getProducts(): Promise<any[]> {
    return Promise.resolve([...this.storage.products]);
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
