
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import ProductNavigation from './ProductNavigation';
import ProductDetails from './ProductDetails';
import QuantityInput from './QuantityInput';

interface Product {
  id: string;
  name: string;
  price: number;
  code?: number;
  stock: number;
  unit?: string;
  cost?: number;
}

interface ProductFormProps {
  product: Product;
  quantity: string;
  onQuantityChange: (value: string) => void;
  paymentMethod: string;
  onPaymentMethodChange: (value: string) => void;
  onProductChange: (direction: 'prev' | 'next' | 'first' | 'last') => void;
  onProductSearch: () => void;
  onAddItem: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({
  product,
  quantity,
  onQuantityChange,
  paymentMethod,
  onPaymentMethodChange,
  onProductChange,
  onProductSearch,
  onAddItem
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="bg-white">
          <Label className="block mb-1 text-sm font-medium text-gray-700">Unidade:</Label>
          <Select defaultValue={product.unit || 'UN'}>
            <SelectTrigger className="h-9 w-full bg-white border border-gray-300 text-sm">
              <SelectValue placeholder="Unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UN">UN - Unidade</SelectItem>
              <SelectItem value="PT">PT - Pacote</SelectItem>
              <SelectItem value="CX">CX - Caixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="block mb-1 text-sm font-medium text-gray-700">Tabela:</Label>
          <Select defaultValue={paymentMethod} onValueChange={onPaymentMethodChange}>
            <SelectTrigger className="h-9 w-full bg-white border border-gray-300 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="01 A VISTA">01 A VISTA</SelectItem>
              <SelectItem value="02 PRAZO">02 PRAZO</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <QuantityInput 
          quantity={quantity} 
          onQuantityChange={onQuantityChange} 
          onAddItem={onAddItem} 
          price={product.price} 
        />
      </div>
      
      <div className="space-y-3">
        <ProductNavigation 
          onProductChange={onProductChange} 
          onProductSearch={onProductSearch} 
        />
        
        <ProductDetails product={product} />
      </div>
    </div>
  );
};

export default ProductForm;
