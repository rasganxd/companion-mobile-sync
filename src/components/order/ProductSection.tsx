import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Package, Plus } from 'lucide-react';
import ProductSearchDialog from '@/components/order/ProductSearchDialog';

interface Product {
  id: string;
  name: string;
  price: number;
  code: number;
  stock: number;
  unit?: string;
  cost?: number;
}

interface ProductSectionProps {
  products: Product[];
  selectedProduct: Product | null;
  quantity: number;
  unitPrice: number;
  onSelectProduct: (product: Product | null) => void;
  onQuantityChange: (quantity: number) => void;
  onUnitPriceChange: (price: number) => void;
  onAddProduct: () => void;
}

const ProductSection: React.FC<ProductSectionProps> = ({
  products,
  selectedProduct,
  quantity,
  unitPrice,
  onSelectProduct,
  onQuantityChange,
  onUnitPriceChange,
  onAddProduct
}) => {
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');

  const handleSelectProduct = (product: Product) => {
    onSelectProduct(product);
    onUnitPriceChange(product.price);
    setShowProductSearch(false);
    setProductSearchTerm('');
  };

  const formatPriceForDisplay = (value: number): string => {
    return value.toFixed(2).replace('.', ',');
  };

  const parsePriceFromInput = (value: string): number => {
    const cleanValue = value.replace(',', '.');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = parsePriceFromInput(inputValue);
    onUnitPriceChange(numericValue);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.code.toString().includes(productSearchTerm)
  );

  return (
    <>
      <Card className="bg-white shadow-sm">
        <CardContent className="p-4">
          <Label className="text-sm font-medium text-gray-600 block mb-3">Produto:</Label>
          
          {/* Seleção de Produto */}
          {selectedProduct ? (
            <div 
              className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3 cursor-pointer hover:bg-green-100 transition-colors mb-4"
              onClick={() => setShowProductSearch(true)}
            >
              <div className="flex items-center gap-3">
                <Package size={20} className="text-green-600" />
                <div>
                  <p className="font-medium text-green-900">{selectedProduct.name}</p>
                  <p className="text-sm text-green-700">
                    Código: {selectedProduct.code} • R$ {selectedProduct.price.toFixed(2)}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-green-600 hover:bg-green-200"
              >
                Alterar
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => setShowProductSearch(true)}
              variant="outline"
              className="w-full h-12 border-dashed border-2 border-gray-300 text-gray-500 hover:border-green-400 hover:text-green-600 mb-4"
            >
              <Search size={20} className="mr-2" />
              Selecionar Produto
            </Button>
          )}

          {/* Campos de Quantidade e Preço */}
          {selectedProduct && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Quantidade</Label>
                <Input
                  type="number"
                  value={quantity || ''}
                  onChange={(e) => onQuantityChange(Number(e.target.value))}
                  min="1"
                  step="1"
                  className="text-center"
                  placeholder=""
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Preço Unit.</Label>
                <Input
                  type="text"
                  value={formatPriceForDisplay(unitPrice)}
                  onChange={handlePriceChange}
                  className="text-center"
                  placeholder="0,00"
                />
              </div>
            </div>
          )}

          {/* Total do Item */}
          {selectedProduct && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-900">Total do Item:</span>
                <span className="font-bold text-blue-600">
                  R$ {(quantity * unitPrice).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Botão Adicionar */}
          <Button 
            onClick={onAddProduct}
            disabled={!selectedProduct || quantity <= 0}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus size={16} className="mr-2" />
            Adicionar ao Pedido
          </Button>
        </CardContent>
      </Card>

      {/* Modal de Busca de Produtos */}
      <ProductSearchDialog
        isOpen={showProductSearch}
        onClose={() => setShowProductSearch(false)}
        searchTerm={productSearchTerm}
        onSearchChange={setProductSearchTerm}
        products={filteredProducts}
        onSelectProduct={handleSelectProduct}
      />
    </>
  );
};

export default ProductSection;
