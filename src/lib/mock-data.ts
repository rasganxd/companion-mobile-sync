
import {
  ClientRepository,
  ProductRepository,
  initDatabase,
  generateUniqueId,
  executeQuery
} from './sync';

// Sample products data for offline testing
const mockProducts = [
  { id: generateUniqueId(), name: 'VINHO COLONIAL BORDO SECO 2L', price: 65.00, code: 'P001', unit_price: 10.83, min_price: 55.00, stock: 0, unit: 'PT' },
  { id: generateUniqueId(), name: 'CERVEJA LATA 350ML', price: 4.50, code: 'P002', unit_price: 3.75, min_price: 4.00, stock: 24, unit: 'UN' },
  { id: generateUniqueId(), name: 'ÁGUA MINERAL COM GÁS 500ML', price: 2.50, code: 'P003', unit_price: 1.95, min_price: 2.20, stock: 36, unit: 'UN' },
  { id: generateUniqueId(), name: 'REFRIGERANTE COLA 2L', price: 8.90, code: 'P004', unit_price: 7.50, min_price: 8.00, stock: 12, unit: 'UN' },
  { id: generateUniqueId(), name: 'SUCO DE LARANJA 1L', price: 6.75, code: 'P005', unit_price: 5.50, min_price: 6.00, stock: 8, unit: 'UN' },
];

// Sample clients data for offline testing
const mockClients = [
  { 
    id: generateUniqueId(),
    name: 'NILSO ALVES FERREIRA',
    fantasy_name: 'BAR DO NILSON',
    address: 'RUA MARECHAL DEODORO 2325',
    city: 'CHAPECO',
    status: 'Pendente'
  },
  { 
    id: generateUniqueId(),
    name: 'MARIA SILVA SOUZA',
    fantasy_name: 'MERCADO CENTRAL',
    address: 'AV FERNANDO MACHADO 1500',
    city: 'CHAPECO',
    status: 'Visitado'
  },
  { 
    id: generateUniqueId(),
    name: 'JOÃO CARLOS FERREIRA',
    fantasy_name: 'RESTAURANTE BOM GOSTO',
    address: 'RUA NEREU RAMOS 789',
    city: 'CHAPECO',
    status: 'Pendente'
  },
  { 
    id: generateUniqueId(),
    name: 'ANTONIO JOSE SANTOS',
    fantasy_name: 'LANCHONETE DELICIA',
    address: 'RUA GUAPORÉ 456',
    city: 'CHAPECO',
    status: 'Pendente'
  }
];

/**
 * Seed the database with mock data for offline testing
 */
export async function seedDatabaseWithMockData() {
  try {
    // Initialize database if not already done
    await initDatabase();
    
    // Check if data already exists
    const existingProducts = await executeQuery('SELECT COUNT(*) as count FROM products');
    const existingClients = await executeQuery('SELECT COUNT(*) as count FROM clients');
    
    // Only seed if no data exists
    if (existingProducts[0].count === 0) {
      console.log('Seeding database with mock products...');
      for (const product of mockProducts) {
        await ProductRepository.createProduct({
          ...product,
          synced: 1, // Mark as synced
        });
      }
    }
    
    if (existingClients[0].count === 0) {
      console.log('Seeding database with mock clients...');
      for (const client of mockClients) {
        await ClientRepository.createClient({
          ...client,
          synced: 1, // Mark as synced
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error seeding mock data:', error);
    return false;
  }
}
