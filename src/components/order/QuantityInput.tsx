
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

interface QuantityInputProps {
  quantity: string;
  onQuantityChange: (value: string) => void;
  onAddItem: () => void;
  price: number;
}

const QuantityInput: React.FC<QuantityInputProps> = ({
  quantity,
  onQuantityChange,
  onAddItem,
  price
}) => {
  const calculateTotal = () => {
    const qty = parseFloat(quantity) || 0;
    return (qty * price).toFixed(2);
  };

  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="block mb-2 text-sm font-medium text-gray-700">Quantidade:</Label>
            <Input 
              type="number" 
              className="h-12 text-center text-lg font-medium border-2 border-gray-300 focus:border-app-blue" 
              value={quantity} 
              onChange={e => onQuantityChange(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
          
          <div>
            <Label className="block mb-2 text-sm font-medium text-gray-700">Valor Unit.:</Label>
            <Input 
              type="text" 
              className="h-12 text-center text-lg font-medium bg-gray-100 border-2 border-gray-300" 
              value={`R$ ${price.toFixed(2)}`} 
              readOnly 
            />
          </div>
        </div>
        
        <div>
          <Label className="block mb-2 text-sm font-medium text-gray-700">Total do Item:</Label>
          <div className="bg-white p-3 rounded-md border-2 border-green-300 text-center">
            <span className="text-xl font-bold text-green-600">
              R$ {calculateTotal()}
            </span>
          </div>
        </div>
        
        <Button 
          variant="default" 
          className="w-full h-14 bg-green-600 hover:bg-green-700 text-white text-lg font-medium"
          onClick={onAddItem}
        >
          <Plus size={20} className="mr-2" />
          Adicionar ao Pedido
        </Button>
      </div>
    </div>
  );
};

export default QuantityInput;
