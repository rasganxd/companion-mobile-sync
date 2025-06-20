
import { MockDataDetector } from './MockDataDetector';
import { DatabaseInstance } from './types';

export class MockDataCleaner {
  constructor(private db: DatabaseInstance) {}

  async cleanMockData(): Promise<void> {
    try {
      console.log('🗑️ Iniciando limpeza FORÇADA de dados mock do IndexedDB...');
      
      const tx = this.db.transaction(['clients', 'products'], 'readwrite');
      
      // Clean mock clients
      const clientStore = tx.objectStore('clients');
      const allClients = await clientStore.getAll();
      let removedClientsCount = 0;
      
      for (const client of allClients) {
        if (MockDataDetector.isMockClient(client)) {
          await clientStore.delete(client.id);
          removedClientsCount++;
          console.log('🗑️ Cliente mock removido:', client.name || client.company_name);
        }
      }
      
      // Clean mock products with enhanced detection
      const productStore = tx.objectStore('products');
      const allProducts = await productStore.getAll();
      let removedProductsCount = 0;
      
      console.log('🔍 Analisando produtos para limpeza:', allProducts.length);
      
      for (const product of allProducts) {
        if (MockDataDetector.isMockProduct(product) || !MockDataDetector.isValidRealProduct(product)) {
          await productStore.delete(product.id);
          removedProductsCount++;
          console.log('🗑️ Produto mock/inválido removido:', {
            id: product.id,
            name: product.name,
            code: product.code
          });
        }
      }
      
      await tx.done;
      
      console.log(`✅ Limpeza FORÇADA concluída: ${removedClientsCount} clientes e ${removedProductsCount} produtos mock/inválidos removidos`);
      
    } catch (error) {
      console.error('❌ Erro ao forçar limpeza de dados mock:', error);
    }
  }

  // Nova função para limpeza completa de produtos
  async forceCleanAllProducts(): Promise<void> {
    try {
      console.log('🗑️ LIMPEZA COMPLETA: Removendo TODOS os produtos do IndexedDB...');
      
      const tx = this.db.transaction('products', 'readwrite');
      const productStore = tx.objectStore('products');
      
      // Limpar completamente a tabela de produtos
      await productStore.clear();
      await tx.done;
      
      console.log('✅ LIMPEZA COMPLETA: Todos os produtos foram removidos do IndexedDB');
      
    } catch (error) {
      console.error('❌ Erro na limpeza completa de produtos:', error);
    }
  }

  filterRealClients(clients: any[]): any[] {
    const realClients = clients.filter(client => !MockDataDetector.isMockClient(client));
    
    const uniqueClients = realClients.reduce((acc: any[], current: any) => {
      const existingClient = acc.find(client => client.id === current.id);
      if (!existingClient) {
        acc.push(current);
      } else {
        console.log('🔍 Cliente duplicado removido:', current);
      }
      return acc;
    }, []);
    
    return uniqueClients;
  }

  filterRealProducts(products: any[]): any[] {
    console.log('🔍 Filtrando produtos reais de', products.length, 'produtos total');
    
    const realProducts = products.filter(product => {
      const isValid = MockDataDetector.isValidRealProduct(product);
      if (!isValid) {
        console.log('🚫 Produto filtrado:', {
          id: product.id,
          name: product.name,
          reason: MockDataDetector.isMockProduct(product) ? 'mock' : 'estrutura inválida'
        });
      }
      return isValid;
    });
    
    const uniqueProducts = realProducts.reduce((acc: any[], current: any) => {
      const existingProduct = acc.find(product => product.id === current.id);
      if (!existingProduct) {
        acc.push(current);
      } else {
        console.log('🔍 Produto duplicado removido:', current);
      }
      return acc;
    }, []);
    
    console.log(`✅ Produtos filtrados: ${uniqueProducts.length} produtos reais válidos`);
    return uniqueProducts;
  }

  async saveRealClients(clientsArray: any[]): Promise<void> {
    const realClients = this.filterRealClients(clientsArray);
    
    if (realClients.length === 0) {
      console.log('ℹ️ Nenhum cliente real para salvar');
      return;
    }
    
    const tx = this.db.transaction('clients', 'readwrite');
    realClients.forEach(client => {
      tx.store.put(client);
    });
    await tx.done;
    console.log(`✅ Saved ${realClients.length} real clients in batch (filtered from ${clientsArray.length} total)`);
  }

  async saveRealProducts(productsArray: any[]): Promise<void> {
    console.log(`💾 Iniciando salvamento de ${productsArray.length} produtos...`);
    
    const realProducts = this.filterRealProducts(productsArray);
    
    if (realProducts.length === 0) {
      console.log('ℹ️ Nenhum produto real válido para salvar');
      return;
    }
    
    const tx = this.db.transaction('products', 'readwrite');
    realProducts.forEach(product => {
      tx.store.put(product);
    });
    await tx.done;
    console.log(`✅ Saved ${realProducts.length} real products in batch (filtered from ${productsArray.length} total)`);
  }

  async saveRealClient(client: any): Promise<void> {
    if (MockDataDetector.isMockClient(client)) {
      console.log('🚫 Cliente mock rejeitado:', client.name || client.company_name);
      return;
    }
    
    await this.db.put('clients', client);
    console.log('✅ Real client saved:', client);
  }

  async saveRealProduct(product: any): Promise<void> {
    if (!MockDataDetector.isValidRealProduct(product)) {
      console.log('🚫 Produto mock/inválido rejeitado:', {
        id: product.id,
        name: product.name,
        reason: MockDataDetector.isMockProduct(product) ? 'mock' : 'estrutura inválida'
      });
      return;
    }
    
    await this.db.put('products', product);
    console.log('✅ Real product saved:', {
      id: product.id,
      name: product.name,
      code: product.code,
      sale_price: product.sale_price
    });
  }
}
