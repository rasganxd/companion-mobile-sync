
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

  // ✅ NOVA FUNÇÃO: Detectar clientes órfãos (sem sales_rep_id válido)
  static isOrphanClient(client: any, validSalesRepIds: string[]): boolean {
    if (!client?.sales_rep_id) {
      console.log('🚫 [ORPHAN DETECTOR] Cliente sem sales_rep_id:', client?.name);
      return true;
    }
    
    if (!validSalesRepIds.includes(client.sales_rep_id)) {
      console.log('🚫 [ORPHAN DETECTOR] Cliente com sales_rep_id inválido:', {
        clientName: client.name,
        salesRepId: client.sales_rep_id,
        validIds: validSalesRepIds
      });
      return true;
    }
    
    return false;
  }

  // ✅ NOVA FUNÇÃO: Detectar dados duplicados
  static findDuplicateClients(clients: any[]): { duplicates: any[], unique: any[] } {
    const seen = new Set();
    const duplicates: any[] = [];
    const unique: any[] = [];
    
    clients.forEach(client => {
      if (seen.has(client.id)) {
        duplicates.push(client);
        console.log('🔍 [DUPLICATE DETECTOR] Cliente duplicado encontrado:', client.name, client.id);
      } else {
        seen.add(client.id);
        unique.push(client);
      }
    });
    
    return { duplicates, unique };
  }

  // ✅ FUNÇÃO MELHORADA: Validar estrutura de dados do cliente
  static isValidClientStructure(client: any): boolean {
    if (!client) {
      console.log('❌ [CLIENT VALIDATOR] Cliente é null/undefined');
      return false;
    }

    const validationChecks = {
      hasId: !!client.id,
      hasName: !!client.name,
      hasValidSalesRepId: !!client.sales_rep_id,
      idIsUuid: typeof client.id === 'string' && client.id.length === 36,
      salesRepIdIsUuid: typeof client.sales_rep_id === 'string' && client.sales_rep_id.length === 36,
    };

    const isValid = Object.values(validationChecks).every(check => check);
    
    if (!isValid) {
      console.log('⚠️ [CLIENT VALIDATOR] Cliente com estrutura inválida:', {
        clientName: client.name || 'SEM NOME',
        clientId: client.id || 'SEM ID',
        checks: validationChecks
      });
    }

    return isValid;
  }

  static isMockClient(client: any): boolean {
    if (!client) return false;
    
    const clientName = client.name?.toLowerCase() || '';
    const companyName = client.company_name?.toLowerCase() || '';
    
    const isMockByName = this.clientMockPatterns.some(pattern => 
      clientName.includes(pattern.toLowerCase()) || 
      companyName.includes(pattern.toLowerCase())
    );

    if (isMockByName) {
      console.log('🚫 [MOCK DETECTOR] Cliente mock detectado:', client.name);
    }
    
    return isMockByName;
  }

  static isMockProduct(product: any): boolean {
    if (!product) return false;
    
    // Verificar ID específico de produto mock conhecido
    if (this.knownMockProductIds.includes(product.id)) {
      console.log('🚫 [MOCK DETECTOR] Produto mock detectado por ID:', product.id, product.name);
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
      console.log('🚫 [MOCK DETECTOR] Produto mock detectado:', {
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
      console.log('❌ [PRODUCT VALIDATOR] Product is null/undefined');
      return false;
    }
    
    // Verificar se é mock primeiro
    if (this.isMockProduct(product)) {
      console.log('🚫 [PRODUCT VALIDATOR] Product rejected: detected as mock product');
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
      console.log('⚠️ [PRODUCT VALIDATOR] Product validation failed:', validationLog);
      return false;
    }
    
    // Log apenas produtos válidos ocasionalmente para não poluir
    if (Math.random() < 0.1) { // 10% chance de logar produtos válidos
      console.log('✅ [PRODUCT VALIDATOR] Product validation passed:', validationLog);
    }
    
    return true;
  }

  // ✅ NOVA FUNÇÃO: Análise completa de integridade de dados
  static analyzeDataIntegrity(clients: any[], products: any[], validSalesRepIds: string[] = []) {
    console.log('🔍 [INTEGRITY ANALYZER] Iniciando análise completa...');
    
    // Análise de clientes
    const clientAnalysis = {
      total: clients.length,
      mock: 0,
      orphan: 0,
      duplicates: 0,
      invalidStructure: 0,
      valid: 0
    };

    const { duplicates: duplicateClients, unique: uniqueClients } = this.findDuplicateClients(clients);
    clientAnalysis.duplicates = duplicateClients.length;

    uniqueClients.forEach(client => {
      if (this.isMockClient(client)) {
        clientAnalysis.mock++;
      } else if (!this.isValidClientStructure(client)) {
        clientAnalysis.invalidStructure++;
      } else if (validSalesRepIds.length > 0 && this.isOrphanClient(client, validSalesRepIds)) {
        clientAnalysis.orphan++;
      } else {
        clientAnalysis.valid++;
      }
    });

    // Análise de produtos
    const productAnalysis = this.getValidationStats(products);

    const totalIssues = clientAnalysis.mock + clientAnalysis.orphan + clientAnalysis.duplicates + 
                       clientAnalysis.invalidStructure + productAnalysis.mock + productAnalysis.invalidStructure;

    console.log('📊 [INTEGRITY ANALYZER] Análise completa:', {
      clientes: clientAnalysis,
      produtos: productAnalysis,
      totalProblemas: totalIssues,
      necessitaLimpeza: totalIssues > 0
    });

    return {
      clients: clientAnalysis,
      products: productAnalysis,
      totalIssues,
      needsCleanup: totalIssues > 0
    };
  }

  // Função para obter lista de IDs de produtos que devem ser removidos
  static getProductIdsToRemove(products: any[]): string[] {
    console.log(`🔍 [MOCK DETECTOR] Analyzing ${products.length} products for removal`);
    
    const productsToRemove = products
      .filter(product => this.isMockProduct(product) || !this.isValidRealProduct(product))
      .map(product => product.id)
      .filter(id => id); // Remover IDs undefined/null
    
    console.log(`🗑️ [MOCK DETECTOR] ${productsToRemove.length} products marked for removal out of ${products.length}`);
    
    return productsToRemove;
  }

  // ✅ FUNÇÃO MELHORADA: Estatísticas detalhadas de validação
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
    
    console.log('📊 [MOCK DETECTOR] Validation Statistics:', stats);
    return stats;
  }
}
