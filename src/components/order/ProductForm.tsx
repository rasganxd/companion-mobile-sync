
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import ProductNavigation from './ProductNavigation';
import QuantityInput from './QuantityInput';
import { useProductPricing } from '@/hooks/useProductPricing';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';

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
  const { displayUnit, mainUnit, subUnit, ratio, pricePerMainUnit } = useProductPricing(product);

  useEffect(() => {
    const fetchPaymentTables = async () => {
      try {
        // Buscar tabelas de pagamento do banco local
        const db = getDatabaseAdapter();
        const tables = await db.getPaymentTables();
        
        // Converter para o formato esperado
        const formattedTables = tables.map(table => ({
          id: table.id || table.name,
          name: table.name,
          description: table.description
        }));
        
        setPaymentTables(formattedTables);
      } catch (error) {
        console.error('Error fetching payment tables from local database:', error);
        // Fallback para tabelas padrão
        setPaymentTables([
          { id: '1', name: 'À Vista', description: 'Pagamento à vista' },
          { id: '2', name: 'Prazo 30', description: 'Pagamento em 30 dias' },
          { id: '3', name: 'Prazo 60', description: 'Pagamento em 60 dias' }
        ]);
      }
    };

    fetchPaymentTables();
  }, []);

  return (
    <div className="space-y-3">
      {/* Product Navigation */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-xl border border-gray-200 shadow-sm">
        <ProductNavigation 
          onProductChange={onProductChange} 
          onProductSearch={onProductSearch} 
        />
      </div>
      
      {/* Product Details Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="block mb-1 text-sm font-semibold text-gray-700">Unidade de Venda:</Label>
          <Input
            value={displayUnit}
            readOnly
            className="h-8 w-full bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 text-sm cursor-not-allowed font-medium"
          />
        </div>
        
        <div>
          <Label className="block mb-1 text-sm font-semibold text-gray-700">Preço {mainUnit}:</Label>
          <Input
            value={`R$ ${pricePerMainUnit.toFixed(2)}`}
            readOnly
            className="h-8 w-full bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 text-sm cursor-not-allowed font-medium"
          />
        </div>
      </div>
      
      {/* Payment Table */}
      <div>
        <Label className="block mb-1 text-sm font-semibold text-gray-700">Tabela de Pagamento:</Label>
        <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
          <SelectTrigger className="h-8 w-full bg-white border-2 border-gray-300 focus:border-app-blue focus:ring-2 focus:ring-app-blue/20 text-sm transition-all duration-200">
            <SelectValue placeholder="Selecione uma tabela" />
          </SelectTrigger>
          <SelectContent className="bg-white border-2 border-gray-300 shadow-xl z-50 rounded-lg">
            {paymentTables.map((table) => (
              <SelectItem 
                key={table.id} 
                value={table.name} 
                className="hover:bg-blue-50 py-2 transition-colors duration-150"
              >
                <div>
                  <div className="font-medium text-sm">{table.name}</div>
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
        product={product}
      />
    </div>
  );
};

export default ProductForm;
