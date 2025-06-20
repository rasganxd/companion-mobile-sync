
export class MockDataDetector {
  private static clientMockPatterns = [
    'Mykaela',
    'Cliente Principal',
    'Empresa Mykaela',
    'Mock',
    'Test',
    'Teste'
  ];

  private static productMockPatterns = [
    'Produto Premium',
    'Produto Standard', 
    'Premium A',
    'Standard B',
    'Mock',
    'Test',
    'Teste'
  ];

  // IDs específicos de produtos mock conhecidos
  private static knownMockProductIds = [
    '7ae3c3f1-21f4-414d-ab6c-66de674e57df' // SKOL PROFISSA 300ML que aparece mas não existe no Supabase
  ];

  static isMockClient(client: any): boolean {
    if (!client) return false;
    
    const clientName = client.name?.toLowerCase() || '';
    const companyName = client.company_name?.toLowerCase() || '';
    
    return this.clientMockPatterns.some(pattern => 
      clientName.includes(pattern.toLowerCase()) || 
      companyName.includes(pattern.toLowerCase())
    );
  }

  static isMockProduct(product: any): boolean {
    if (!product) return false;
    
    // Verificar ID específico de produto mock conhecido
    if (this.knownMockProductIds.includes(product.id)) {
      console.log('🚫 Produto mock detectado por ID:', product.id, product.name);
      return true;
    }
    
    const productName = product.name?.toLowerCase() || '';
    
    // Verificar padrões de nome
    const isMockByName = this.productMockPatterns.some(pattern => 
      productName.includes(pattern.toLowerCase())
    );
    
    // Verificar se tem estrutura de dados inconsistente (mistura de campos antigos e novos)
    const hasInconsistentStructure = product.cost && product.sale_price && !product.cost_price;
    
    if (isMockByName || hasInconsistentStructure) {
      console.log('🚫 Produto mock detectado:', {
        id: product.id,
        name: product.name,
        reason: isMockByName ? 'nome' : 'estrutura inconsistente'
      });
      return true;
    }
    
    return false;
  }

  // Nova função para validar se o produto deve existir baseado na estrutura de dados
  static isValidRealProduct(product: any): boolean {
    if (!product) return false;
    
    // Verificar se é mock primeiro
    if (this.isMockProduct(product)) return false;
    
    // Produto real deve ter estrutura consistente
    const hasValidStructure = product.id && 
                             product.name && 
                             typeof product.sale_price === 'number' &&
                             typeof product.code === 'number';
    
    if (!hasValidStructure) {
      console.log('⚠️ Produto com estrutura inválida:', product);
      return false;
    }
    
    return true;
  }

  // Função para obter lista de IDs de produtos que devem ser removidos
  static getProductIdsToRemove(products: any[]): string[] {
    return products
      .filter(product => this.isMockProduct(product) || !this.isValidRealProduct(product))
      .map(product => product.id)
      .filter(id => id); // Remover IDs undefined/null
  }
}
