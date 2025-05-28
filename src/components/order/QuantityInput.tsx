
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
    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="block mb-1 text-xs font-medium text-gray-700">Quantidade:</Label>
            <Input 
              type="number" 
              className="h-8 text-center text-sm font-medium border border-gray-300 focus:border-app-blue" 
              value={quantity} 
              onChange={e => onQuantityChange(e.target.value)} 
              placeholder="0" 
              min="0" 
              step="0.01" 
            />
          </div>
          
          <div>
            <Label className="block mb-1 text-xs font-medium text-gray-700">Preço:</Label>
            <Input 
              type="text" 
              className="h-8 text-center text-sm font-medium bg-gray-100 border border-gray-300" 
              value={`R$ ${unitPrice.toFixed(2)}`} 
              readOnly 
            />
          </div>
        </div>
        
        {/* Mostrar informação de conversão se houver subunidade */}
        {subUnit && ratio > 1 && (
          <div className="text-xs text-gray-600 text-center bg-white p-2 rounded border">
            <div>1 {mainUnit} = {ratio} {subUnit}</div>
            <div>Preço por {mainUnit}: R$ {(unitPrice * ratio).toFixed(2)}</div>
          </div>
        )}
        
        <Button 
          variant="default" 
          className="w-full h-8 bg-green-600 hover:bg-green-700 text-white text-xs font-medium" 
          onClick={onAddItem}
        >
          <Plus size={16} className="mr-1" />
          Adicionar ao Pedido
        </Button>
      </div>
    </div>
  );
};

export default QuantityInput;
