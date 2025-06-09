
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import ProductNavigation from './ProductNavigation';
import QuantityInput from './QuantityInput';
import { useProductPriceValidation } from '@/hooks/useProductPriceValidation';
import { useUnitSelection } from '@/hooks/useUnitSelection';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';

interface Product {
  id: string;
  name: string;
  price: number;
  code: number;
  stock: number;
  unit?: string;
  cost?: number;
  has_subunit?: boolean;
  subunit?: string;
  subunit_ratio?: number;
  min_price?: number;
  sale_price?: number;
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
  selectedUnit?: string;
  onUnitChange?: (unit: string) => void;
}

const ProductForm: React.FC<ProductFormProps> = ({
  product,
  quantity,
  onQuantityChange,
  paymentMethod,
  onPaymentMethodChange,
  onProductChange,
  onProductSearch,
  onAddItem,
  selectedUnit = 'UN',
  onUnitChange
}) => {
  const [paymentTables, setPaymentTables] = useState<PaymentTable[]>([]);
  const { unitOptions, selectedUnitType, setSelectedUnitType, hasMultipleUnits } = useUnitSelection(product);
  const { hasMinPriceRestriction, getMinPrice } = useProductPriceValidation(product);

  useEffect(() => {
    const fetchPaymentTables = async () => {
      try {
        // Buscar tabelas de pagamento do banco local
        const db = getDatabaseAdapter();
        const tables = await db.getPaymentTables();
        
        const formattedTables = tables.map(table => ({
          id: table.id || table.name,
          name: table.name,
          description: table.description
        }));
        
        setPaymentTables(formattedTables);
      } catch (error) {
        console.error('Error fetching payment tables from local database:', error);
        setPaymentTables([
          { id: '1', name: 'À Vista', description: 'Pagamento à vista' },
          { id: '2', name: 'Prazo 30', description: 'Pagamento em 30 dias' },
          { id: '3', name: 'Prazo 60', description: 'Pagamento em 60 dias' }
        ]);
      }
    };

    fetchPaymentTables();
  }, []);

  const handleUnitTypeChange = (unitType: 'main' | 'sub') => {
    setSelectedUnitType(unitType);
    const unit = unitOptions.find(opt => opt.value === unitType);
    if (unit && onUnitChange) {
      onUnitChange(unit.code);
    }
  };

  const currentUnit = unitOptions.find(opt => opt.value === selectedUnitType);
  const displayPrice = currentUnit?.price || product.sale_price || product.price || 0;

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
        {/* Seletor de unidade melhorado */}
        <div>
          <Label className="block mb-1 text-sm font-semibold text-gray-700">
            {hasMultipleUnits ? 'Tipo de Unidade:' : 'Unidade de Venda:'}
          </Label>
          {hasMultipleUnits ? (
            <Select value={selectedUnitType} onValueChange={handleUnitTypeChange}>
              <SelectTrigger className="h-8 w-full bg-white border-2 border-gray-300 focus:border-app-blue focus:ring-2 focus:ring-app-blue/20 text-sm transition-all duration-200">
                <SelectValue placeholder="Selecione unidade" />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 border-gray-300 shadow-xl z-50 rounded-lg">
                {unitOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="hover:bg-blue-50 py-2 transition-colors duration-150"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-gray-500">{option.displayText}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={product.unit || 'UN'}
              readOnly
              className="h-8 w-full bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 text-sm cursor-not-allowed font-medium"
            />
          )}
        </div>
        
        <div>
          <Label className="block mb-1 text-sm font-semibold text-gray-700">
            Preço {currentUnit?.code || product.unit || 'UN'}:
          </Label>
          <Input
            value={`R$ ${displayPrice.toFixed(2)}`}
            readOnly
            className="h-8 w-full bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 text-sm cursor-not-allowed font-medium"
          />
        </div>
      </div>

      {/* Preço Mínimo - Mostrar se existir */}
      {hasMinPriceRestriction() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600 font-medium text-sm">⚠️ Preço Mínimo:</span>
            <span className="font-bold text-yellow-800">R$ {getMinPrice().toFixed(2)}</span>
          </div>
          <p className="text-xs text-yellow-700 mt-1">
            Não é permitido vender abaixo deste valor
          </p>
        </div>
      )}
      
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
        selectedUnit={selectedUnitType}
        onUnitChange={(unit: 'main' | 'sub') => handleUnitTypeChange(unit)}
      />
    </div>
  );
};

export default ProductForm;
