
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useProductPricing } from '@/hooks/useProductPricing';

interface Product {
  id: string;
  name: string;
  price: number;
  code?: number;
  stock: number;
  unit?: string;
  cost?: number;
  has_subunit?: boolean;
  subunit?: string;
  subunit_ratio?: number;
}

interface QuantityInputProps {
  quantity: string;
  onQuantityChange: (value: string) => void;
  onAddItem: () => void;
  product: Product;
  selectedUnit?: 'main' | 'sub';
  onUnitChange?: (unit: 'main' | 'sub') => void;
}

const QuantityInput: React.FC<QuantityInputProps> = ({
  quantity,
  onQuantityChange,
  onAddItem,
  product,
  selectedUnit = 'sub',
  onUnitChange
}) => {
  const { unitPrice, displayUnit, mainUnit, subUnit, ratio } = useProductPricing(product, selectedUnit);

  const calculateTotal = () => {
    const qty = parseFloat(quantity) || 0;
    return (qty * unitPrice).toFixed(2);
  };

  const hasSubunit = product.has_subunit && product.subunit_ratio && product.subunit_ratio > 1 && subUnit;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 shadow-sm">
      <div className="space-y-4">
        {/* Seletor de Unidade - Mais visível */}
        {hasSubunit && onUnitChange && (
          <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm">
            <Label className="block mb-2 text-sm font-semibold text-gray-700">Tipo de Unidade:</Label>
            <Select value={selectedUnit} onValueChange={(value: 'main' | 'sub') => onUnitChange(value)}>
              <SelectTrigger className="w-full h-10 bg-white border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-300 shadow-lg rounded-lg">
                <SelectItem value="sub" className="hover:bg-blue-50 py-2">
                  <div className="flex flex-col">
                    <span className="font-medium">{subUnit}</span>
                    <span className="text-xs text-gray-500">Unidade menor</span>
                  </div>
                </SelectItem>
                <SelectItem value="main" className="hover:bg-blue-50 py-2">
                  <div className="flex flex-col">
                    <span className="font-medium">{mainUnit}</span>
                    <span className="text-xs text-gray-500">Unidade principal</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* Informação de conversão mais clara */}
            <div className="mt-2 text-sm text-gray-700 bg-blue-50 p-2 rounded border border-blue-200">
              <div className="font-medium text-center">
                1 {mainUnit} = {ratio} {subUnit}
              </div>
              <div className="text-center text-xs text-gray-600 mt-1">
                Preço por {mainUnit}: R$ {(unitPrice * ratio).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="block mb-2 text-sm font-semibold text-gray-700">Quantidade ({displayUnit}):</Label>
            <Input 
              type="number" 
              className="h-9 text-center text-sm font-medium border-2 border-gray-300 focus:border-app-blue focus:ring-2 focus:ring-app-blue/20 transition-all duration-200" 
              value={quantity} 
              onChange={e => onQuantityChange(e.target.value)} 
              placeholder="0" 
              min="0" 
              step="0.01" 
            />
          </div>
          
          <div>
            <Label className="block mb-2 text-sm font-semibold text-gray-700">Preço ({displayUnit}):</Label>
            <Input 
              type="text" 
              className="h-9 text-center text-sm font-medium bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 cursor-not-allowed" 
              value={`R$ ${unitPrice.toFixed(2)}`} 
              readOnly 
            />
          </div>
        </div>
        
        {/* Total do item */}
        {quantity && parseFloat(quantity) > 0 && (
          <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Total do Item:</span>
              <span className="text-lg font-bold text-blue-700">R$ {calculateTotal()}</span>
            </div>
          </div>
        )}
        
        <Button 
          variant="default" 
          className="w-full h-9 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-sm font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-98 shadow-md hover:shadow-lg" 
          onClick={onAddItem}
        >
          <Plus size={18} className="mr-2" />
          Adicionar ao Pedido
        </Button>
      </div>
    </div>
  );
};

export default QuantityInput;
