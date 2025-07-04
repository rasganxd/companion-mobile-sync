
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
      console.log('🚫 [MOCK DETECTOR LOG] Produto mock detectado por ID:', product.id, product.name);
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
      console.log('🚫 [MOCK DETECTOR LOG] Produto mock detectado:', {
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
    if (!product) {
      console.log('❌ [MOCK DETECTOR LOG] Product validation failed: product is null/undefined');
      return false;
    }
    
    // Verificar se é mock primeiro
    if (this.isMockProduct(product)) {
      console.log('🚫 [MOCK DETECTOR LOG] Product rejected: detected as mock product');
      return false;
    }
    
    // ✅ LOGS DETALHADOS: Validar cada campo individualmente
    const validationLog = {
      name: product.name,
      id: product.id || 'MISSING',
      hasId: !!product.id,
      hasName: !!product.name,
      sale_price: product.sale_price,
      sale_price_type: typeof product.sale_price,
      sale_price_valid: false,
      code: product.code,
      code_type: typeof product.code,
      code_valid: false,
      overall_valid: false
    };
    
    // Validar sale_price - aceitar numbers ou strings que podem ser convertidas
    if (typeof product.sale_price === 'number' && !isNaN(product.sale_price)) {
      validationLog.sale_price_valid = true;
    } else if (typeof product.sale_price === 'string' && !isNaN(parseFloat(product.sale_price))) {
      validationLog.sale_price_valid = true;
    }
    
    // Validar code - aceitar numbers ou strings que podem ser convertidas
    if (typeof product.code === 'number' && !isNaN(product.code)) {
      validationLog.code_valid = true;
    } else if (typeof product.code === 'string' && !isNaN(parseInt(product.code))) {
      validationLog.code_valid = true;
    }
    
    // Produto real deve ter estrutura básica válida
    const hasValidStructure = validationLog.hasId && 
                             validationLog.hasName && 
                             validationLog.sale_price_valid &&
                             validationLog.code_valid;
    
    validationLog.overall_valid = hasValidStructure;
    
    if (!hasValidStructure) {
      console.log('⚠️ [MOCK DETECTOR LOG] Product validation failed:', validationLog);
      return false;
    }
    
    // Log apenas produtos válidos ocasionalmente para não poluir
    if (Math.random() < 0.1) { // 10% chance de logar produtos válidos
      console.log('✅ [MOCK DETECTOR LOG] Product validation passed:', validationLog);
    }
    
    return true;
  }

  // Função para obter lista de IDs de produtos que devem ser removidos
  static getProductIdsToRemove(products: any[]): string[] {
    console.log(`🔍 [MOCK DETECTOR LOG] Analyzing ${products.length} products for removal`);
    
    const productsToRemove = products
      .filter(product => this.isMockProduct(product) || !this.isValidRealProduct(product))
      .map(product => product.id)
      .filter(id => id); // Remover IDs undefined/null
    
    console.log(`🗑️ [MOCK DETECTOR LOG] ${productsToRemove.length} products marked for removal out of ${products.length}`);
    
    return productsToRemove;
  }

  // ✅ NOVA FUNÇÃO: Estatísticas detalhadas de validação
  static getValidationStats(products: any[]): any {
    let validCount = 0;
    let mockCount = 0;
    let invalidStructureCount = 0;
    let missingIdCount = 0;
    let missingNameCount = 0;
    let invalidPriceCount = 0;
    let invalidCodeCount = 0;
    
    products.forEach(product => {
      if (!product) return;
      
      if (!product.id) missingIdCount++;
      if (!product.name) missingNameCount++;
      
      // Validar sale_price
      if (typeof product.sale_price !== 'number' || isNaN(product.sale_price)) {
        if (typeof product.sale_price !== 'string' || isNaN(parseFloat(product.sale_price))) {
          invalidPriceCount++;
        }
      }
      
      // Validar code
      if (typeof product.code !== 'number' || isNaN(product.code)) {
        if (typeof product.code !== 'string' || isNaN(parseInt(product.code))) {
          invalidCodeCount++;
        }
      }
      
      if (this.isMockProduct(product)) {
        mockCount++;
      } else if (this.isValidRealProduct(product)) {
        validCount++;
      } else {
        invalidStructureCount++;
      }
    });
    
    const stats = {
      total: products.length,
      valid: validCount,
      mock: mockCount,
      invalidStructure: invalidStructureCount,
      missingId: missingIdCount,
      missingName: missingNameCount,
      invalidPrice: invalidPriceCount,
      invalidCode: invalidCodeCount
    };
    
    console.log('📊 [MOCK DETECTOR LOG] Validation Statistics:', stats);
    return stats;
  }
}
