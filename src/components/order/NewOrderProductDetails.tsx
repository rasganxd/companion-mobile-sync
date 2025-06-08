
import React from 'react';
import { Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Product {
  id: string;
  name: string;
  price: number;
  sale_price?: number;
  code: number;
  unit?: string;
  min_price?: number;
  has_subunit?: boolean;
  subunit?: string;
  subunit_ratio?: number;
}

interface NewOrderProductDetailsProps {
  currentProduct: Product | null;
  quantity: number;
  unitPrice: number;
  onQuantityChange: (quantity: number) => void;
  onUnitPriceChange: (price: number) => void;
  onAddProduct: () => void;
}

const NewOrderProductDetails: React.FC<NewOrderProductDetailsProps> = ({
  currentProduct,
  quantity,
  unitPrice,
  onQuantityChange,
  onUnitPriceChange,
  onAddProduct
}) => {
  if (!currentProduct) return null;

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <Package size={20} className="text-blue-600" />
          <div>
            <div className="font-semibold">{currentProduct.code} - {currentProduct.name}</div>
          </div>
        </div>
      </div>

      {/* Detalhes do produto em grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="bg-blue-50 p-2 rounded">
            <div className="text-xs text-gray-600">Preço Unitário</div>
            <div className="font-semibold text-blue-700">
              R$ {(currentProduct.sale_price || currentProduct.price || 0).toFixed(2)}
            </div>
          </div>
          {currentProduct.min_price && currentProduct.min_price > 0 && (
            <div className="bg-yellow-50 p-2 rounded">
              <div className="text-xs text-gray-600">Preço Mínimo</div>
              <div className="font-semibold text-yellow-700">
                R$ {currentProduct.min_price.toFixed(2)}
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="bg-green-50 p-2 rounded">
            <div className="text-xs text-gray-600">Unidade</div>
            <div className="font-semibold text-green-700">
              {currentProduct.unit || 'UN'}
            </div>
          </div>
          {currentProduct.has_subunit && currentProduct.subunit && (
            <div className="bg-purple-50 p-2 rounded">
              <div className="text-xs text-gray-600">Sub-unidade</div>
              <div className="font-semibold text-purple-700">
                {currentProduct.subunit} (1:{currentProduct.subunit_ratio || 1})
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quantidade e Valor */}
      <div className="grid grid-cols-2 gap-4 py-0">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
          <Input 
            type="number" 
            value={quantity} 
            onChange={e => onQuantityChange(parseInt(e.target.value) || 1)} 
            min="1" 
            className="text-center font-semibold text-lg" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valor Unitário</label>
          <Input 
            type="number" 
            value={unitPrice} 
            onChange={e => onUnitPriceChange(parseFloat(e.target.value) || 0)} 
            min="0" 
            step="0.01" 
            className="text-center font-semibold text-lg" 
          />
        </div>
      </div>

      {/* Total do item */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex justify-between items-center">
          <span className="font-medium text-green-900 text-sm">Total do Item:</span>
          <span className="font-bold text-green-600 text-base">
            R$ {(quantity * unitPrice).toFixed(2)}
          </span>
        </div>
      </div>

      <Button 
        onClick={onAddProduct} 
        disabled={!currentProduct || quantity <= 0} 
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
      >
        <Package size={18} className="mr-2" />
        Adicionar ao Pedido
      </Button>
    </div>
  );
};

export default NewOrderProductDetails;
