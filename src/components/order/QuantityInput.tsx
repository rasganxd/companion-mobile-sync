
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

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
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label className="block mb-1 text-sm font-medium text-gray-700">Quantidade:</Label>
        <div className="flex">
          <Input 
            type="number"
            className="h-9 flex-1 border border-gray-300 text-sm"
            value={quantity}
            onChange={(e) => onQuantityChange(e.target.value)}
          />
          <Button 
            variant="default"
            className="ml-2 w-9 h-9 bg-app-blue text-sm p-0"
            onClick={onAddItem}
          >
            E
          </Button>
        </div>
      </div>
      <div>
        <Label className="block mb-1 text-sm font-medium text-gray-700">Valor:</Label>
        <Input 
          type="text" 
          className="h-9 bg-white border border-gray-300 text-sm" 
          value={price.toFixed(2)}
          readOnly 
        />
      </div>
    </div>
  );
};

export default QuantityInput;
