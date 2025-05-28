
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
}

const QuantityInput: React.FC<QuantityInputProps> = ({
  quantity,
  onQuantityChange,
  onAddItem,
  product
}) => {
  const { unitPrice, displayUnit, mainUnit, subUnit, ratio } = useProductPricing(product);

  const calculateTotal = () => {
    const qty = parseFloat(quantity) || 0;
    return (qty * unitPrice).toFixed(2);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 shadow-sm">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="block mb-2 text-sm font-semibold text-gray-700">Quantidade:</Label>
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
            <Label className="block mb-2 text-sm font-semibold text-gray-700">Preço:</Label>
            <Input 
              type="text" 
              className="h-9 text-center text-sm font-medium bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 cursor-not-allowed" 
              value={`R$ ${unitPrice.toFixed(2)}`} 
              readOnly 
            />
          </div>
        </div>
        
        {/* Mostrar informação de conversão se houver subunidade */}
        {subUnit && ratio > 1 && (
          <div className="text-sm text-gray-700 text-center bg-white p-3 rounded-lg border border-blue-200 shadow-sm">
            <div className="font-medium">1 {mainUnit} = {ratio} {subUnit}</div>
            <div className="text-gray-600 mt-1">Preço por {mainUnit}: R$ {(unitPrice * ratio).toFixed(2)}</div>
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
