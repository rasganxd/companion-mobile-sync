
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface AddProductButtonProps {
  quantity: number;
  unitPrice: number;
  priceError: string | null;
  onAddProduct: () => void;
}

const AddProductButton: React.FC<AddProductButtonProps> = ({
  quantity,
  unitPrice,
  priceError,
  onAddProduct
}) => {
  return (
    <Button 
      onClick={onAddProduct}
      disabled={quantity <= 0 || unitPrice <= 0 || !!priceError}
      className="w-full bg-green-600 hover:bg-green-700 text-white"
    >
      <Plus size={16} className="mr-2" />
      {priceError ? 'Preço Inválido' : 'Adicionar ao Pedido'}
    </Button>
  );
};

export default AddProductButton;
