
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Package, Plus } from 'lucide-react';

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

interface Client {
  id: string;
  name: string;
  company_name?: string;
  sales_rep_id?: string;
}

interface OrderItem {
  id: number;
  productId: string;
  productName: string;
  code: number;
  quantity: number;
  price: number;
  unit: string;
}

interface ProductSectionProps {
  products: Product[];
  selectedClient: Client | null;
  onAddItem: (item: OrderItem) => void;
}

const ProductSection: React.FC<ProductSectionProps> = ({
  products,
  selectedClient,
  onAddItem
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [selectedUnit, setSelectedUnit] = useState('main');

  const filteredProducts = products.filter(product => 
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code?.toString().includes(searchTerm)
  );

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setPrice(product.price);
      setSelectedUnit('main');
      setQuantity(1);
    }
  };

  const handleAddToOrder = () => {
    if (!selectedProduct) return;

    const orderItem: OrderItem = {
      id: Date.now(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      code: selectedProduct.code,
      quantity,
      price,
      unit: selectedUnit === 'main' ? selectedProduct.unit : (selectedProduct.subunit || selectedProduct.unit)
    };

    onAddItem(orderItem);
    
    // Reset form
    setSelectedProduct(null);
    setQuantity(1);
    setPrice(0);
    setSelectedUnit('main');
    setSearchTerm('');
  };

  return (
    <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300 animate-scale-in">
      <CardContent className="p-4">
        <Label className="text-sm font-semibold text-gray-700 block mb-3 flex items-center gap-2">
          <Package size={16} className="text-blue-600" />
          Adicionar Produto:
        </Label>

        {/* Product Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar produto por nome ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-md focus:shadow-lg focus:border-blue-500"
          />
        </div>

        {/* Product Selection */}
        {searchTerm && (
          <div className="mb-4 max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg animate-fade-in">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer border-b border-gray-100 transition-all duration-200"
                onClick={() => handleProductSelect(product.id)}
              >
                <div className="font-medium text-gray-900">{product.name}</div>
                <div className="text-sm text-gray-600">
                  Código: {product.code} • R$ {product.price.toFixed(2)} • Estoque: {product.stock}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Product Details */}
        {selectedProduct && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 mb-4 animate-scale-in">
            <h4 className="font-semibold text-gray-900 mb-2">{selectedProduct.name}</h4>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-xs font-medium text-gray-600">Quantidade:</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="mt-1 h-10 bg-white border-blue-200 focus:border-blue-500"
                />
              </div>
              
              <div>
                <Label className="text-xs font-medium text-gray-600">Preço:</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="mt-1 h-10 bg-white border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>

            {selectedProduct.has_subunit && (
              <div className="mb-4">
                <Label className="text-xs font-medium text-gray-600">Unidade:</Label>
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger className="mt-1 h-10 bg-white border-blue-200 focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">{selectedProduct.unit}</SelectItem>
                    <SelectItem value="sub">{selectedProduct.subunit}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              onClick={handleAddToOrder}
              disabled={!selectedClient}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={16} className="mr-2" />
              Adicionar ao Pedido
            </Button>
          </div>
        )}

        {!selectedClient && (
          <div className="text-center py-4 text-gray-500 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200 border-dashed animate-fade-in">
            <Package size={24} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-medium">Selecione um cliente primeiro</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductSection;
