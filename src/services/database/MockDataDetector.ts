
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
    
    const productName = product.name?.toLowerCase() || '';
    
    return this.productMockPatterns.some(pattern => 
      productName.includes(pattern.toLowerCase())
    );
  }
}
