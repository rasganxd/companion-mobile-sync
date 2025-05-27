
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import ProductNavigation from './ProductNavigation';
import ProductDetails from './ProductDetails';
import QuantityInput from './QuantityInput';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  price: number;
  code?: number;
  stock: number;
  unit?: string;
  cost?: number;
}

interface PaymentTable {
  id: string;
  name: string;
  description?: string;
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
  const [paymentTables, setPaymentTables] = useState<PaymentTable[]>([]);

  useEffect(() => {
    const fetchPaymentTables = async () => {
      try {
        const { data, error } = await supabase
          .from('payment_tables')
          .select('id, name, description')
          .eq('active', true)
          .order('name');

        if (error) {
          console.error('Error fetching payment tables:', error);
          return;
        }

        setPaymentTables(data || []);
      } catch (error) {
        console.error('Error fetching payment tables:', error);
      }
    };

    fetchPaymentTables();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="bg-white">
          <Label className="block mb-1 text-sm font-medium text-gray-700">Unidade:</Label>
          <Input
            value={product.unit || 'UN'}
            readOnly
            className="h-9 w-full bg-gray-100 border border-gray-300 text-sm cursor-not-allowed"
          />
        </div>
        
        <div>
          <Label className="block mb-1 text-sm font-medium text-gray-700">Tabela:</Label>
          <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
            <SelectTrigger className="h-9 w-full bg-white border border-gray-300 text-sm">
              <SelectValue placeholder="Selecione uma tabela" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-300 shadow-lg z-50">
              {paymentTables.map((table) => (
                <SelectItem key={table.id} value={table.name} className="hover:bg-gray-100">
                  {table.name}
                  {table.description && (
                    <span className="text-xs text-gray-500 ml-2">- {table.description}</span>
                  )}
                </SelectItem>
              ))}
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
