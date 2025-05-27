
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import ProductNavigation from './ProductNavigation';
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
    <div className="space-y-4">
      {/* Product Navigation */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <ProductNavigation 
          onProductChange={onProductChange} 
          onProductSearch={onProductSearch} 
        />
      </div>
      
      {/* Product Details Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="block mb-1 text-xs font-medium text-gray-700">Unidade:</Label>
          <Input
            value={product.unit || 'UN'}
            readOnly
            className="h-8 w-full bg-gray-100 border border-gray-300 text-xs cursor-not-allowed"
          />
        </div>
        
        <div>
          <Label className="block mb-1 text-xs font-medium text-gray-700">Preço Unitário:</Label>
          <Input
            value={`R$ ${product.cost?.toFixed(2) || '0,00'}`}
            readOnly
            className="h-8 w-full bg-gray-100 border border-gray-300 text-xs cursor-not-allowed"
          />
        </div>
      </div>
      
      {/* Payment Table */}
      <div>
        <Label className="block mb-1 text-xs font-medium text-gray-700">Tabela de Pagamento:</Label>
        <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
          <SelectTrigger className="h-8 w-full bg-white border border-gray-300 text-xs">
            <SelectValue placeholder="Selecione uma tabela" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-300 shadow-lg z-50">
            {paymentTables.map((table) => (
              <SelectItem key={table.id} value={table.name} className="hover:bg-gray-100 py-2">
                <div>
                  <div className="font-medium text-xs">{table.name}</div>
                  {table.description && (
                    <div className="text-xs text-gray-500">{table.description}</div>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Quantity Input */}
      <QuantityInput 
        quantity={quantity} 
        onQuantityChange={onQuantityChange} 
        onAddItem={onAddItem} 
        price={product.price} 
      />
    </div>
  );
};

export default ProductForm;
