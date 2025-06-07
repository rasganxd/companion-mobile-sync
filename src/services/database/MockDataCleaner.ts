
import { MockDataDetector } from './MockDataDetector';
import { DatabaseInstance } from './types';

export class MockDataCleaner {
  constructor(private db: DatabaseInstance) {}

  async cleanMockData(): Promise<void> {
    try {
      console.log('🗑️ Forçando limpeza de dados mock do IndexedDB...');
      
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
      
      // Clean mock products
      const productStore = tx.objectStore('products');
      const allProducts = await productStore.getAll();
      let removedProductsCount = 0;
      
      for (const product of allProducts) {
        if (MockDataDetector.isMockProduct(product)) {
          await productStore.delete(product.id);
          removedProductsCount++;
          console.log('🗑️ Produto mock removido:', product.name);
        }
      }
      
      await tx.done;
      
      console.log(`✅ Limpeza forçada concluída: ${removedClientsCount} clientes e ${removedProductsCount} produtos mock removidos`);
      
    } catch (error) {
      console.error('❌ Erro ao forçar limpeza de dados mock:', error);
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
    const realProducts = products.filter(product => !MockDataDetector.isMockProduct(product));
    
    const uniqueProducts = realProducts.reduce((acc: any[], current: any) => {
      const existingProduct = acc.find(product => product.id === current.id);
      if (!existingProduct) {
        acc.push(current);
      } else {
        console.log('🔍 Produto duplicado removido:', current);
      }
      return acc;
    }, []);
    
    return uniqueProducts;
  }

  async saveRealClients(clientsArray: any[]): Promise<void> {
    const realClients = clientsArray.filter(client => !MockDataDetector.isMockClient(client));
    
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
    const realProducts = productsArray.filter(product => !MockDataDetector.isMockProduct(product));
    
    if (realProducts.length === 0) {
      console.log('ℹ️ Nenhum produto real para salvar');
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
    if (MockDataDetector.isMockProduct(product)) {
      console.log('🚫 Produto mock rejeitado:', product.name);
      return;
    }
    
    await this.db.put('products', product);
    console.log('✅ Real product saved:', product);
  }
}
