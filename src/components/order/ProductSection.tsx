import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import QuantityInput from '@/components/order/QuantityInput';
interface Product {
  id: string;
  name: string;
  code: number;
  price: number;
  unit: string;
  stock: number;
  has_subunit?: boolean;
  subunit?: string;
  subunit_ratio?: number;
  min_price?: number;
  max_price?: number;
}
interface ProductSectionProps {
  products: Product[];
  currentProductIndex: number;
  currentProduct: Product | null;
  quantity: string;
  selectedUnit: 'main' | 'sub';
  showProductSearch: boolean;
  productSearchTerm: string;
  onNavigateProduct: (direction: 'prev' | 'next') => void;
  onProductSearch: () => void;
  onProductSearchChange: (value: string) => void;
  onSelectProduct: (product: Product) => void;
  onQuantityChange: (value: string) => void;
  onUnitChange: (unit: 'main' | 'sub') => void;
  onAddItem: () => void;
}
const ProductSection: React.FC<ProductSectionProps> = ({
  products,
  currentProductIndex,
  currentProduct,
  quantity,
  selectedUnit,
  showProductSearch,
  productSearchTerm,
  onNavigateProduct,
  onProductSearch,
  onProductSearchChange,
  onSelectProduct,
  onQuantityChange,
  onUnitChange,
  onAddItem
}) => {
  const filteredProducts = products.filter(product => product.name.toLowerCase().includes(productSearchTerm.toLowerCase()));
  if (products.length === 0) return null;
  return <Card className="bg-white shadow-sm">
      <CardContent className="p-3 space-y-3">
        {/* Navegação e Busca de Produto */}
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-600">Produto:</Label>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onProductSearch} className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
              <Search size={16} />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onNavigateProduct('prev')} disabled={currentProductIndex === 0}>
              <ArrowLeft size={16} />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onNavigateProduct('next')} disabled={currentProductIndex === products.length - 1}>
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>

        {/* Busca de Produto */}
        {showProductSearch && <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <Input placeholder="Digite o nome do produto..." value={productSearchTerm} onChange={e => onProductSearchChange(e.target.value)} className="mb-3" autoFocus />
            {productSearchTerm && <div className="max-h-40 overflow-y-auto space-y-1">
                {filteredProducts.slice(0, 8).map(product => <div key={product.id} className="p-2 bg-white rounded border hover:bg-blue-50 cursor-pointer" onClick={() => onSelectProduct(product)}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-gray-600">Código: {product.code}</p>
                      </div>
                      <p className="text-sm font-semibold text-blue-600">
                        R$ {product.price.toFixed(2)}
                      </p>
                    </div>
                  </div>)}
                {filteredProducts.length === 0 && <p className="text-center text-gray-500 py-2">Nenhum produto encontrado</p>}
              </div>}
          </div>}
        
        {/* Informações do Produto Atual */}
        {currentProduct && <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-gray-200 px-2 py-1 rounded text-xs font-mono">
                {currentProduct.code}
              </span>
              <h3 className="font-semibold text-gray-900 text-sm">{currentProduct.name}</h3>
            </div>
            
            <QuantityInput quantity={quantity} onQuantityChange={onQuantityChange} onAddItem={onAddItem} product={currentProduct} selectedUnit={selectedUnit} onUnitChange={onUnitChange} />
          </div>}
      </CardContent>
    </Card>;
};
export default ProductSection;