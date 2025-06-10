
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';
import { formatPriceInput } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  price: number;
  code: number;
  stock: number;
  unit?: string;
  has_subunit?: boolean;
  subunit?: string;
  subunit_ratio?: number;
  min_price?: number;
  sale_price?: number;
  max_discount_percent?: number;
}

interface UnitOption {
  value: 'main' | 'sub';
  label: string;
  code: string;
  price: number;
  displayText: string;
}

interface QuantityPriceFormProps {
  currentProduct: Product;
  quantity: number;
  unitPrice: number;
  selectedUnit: string;
  unitOptions: UnitOption[];
  selectedUnitType: 'main' | 'sub';
  hasMultipleUnits: boolean;
  priceError: string | null;
  hasMinPriceRestriction: boolean;
  getMinPrice: () => number;
  onQuantityChange: (quantity: number) => void;
  onUnitPriceChange: (price: number) => void;
  onUnitChange?: (unit: string) => void;
  onUnitTypeChange: (unitType: 'main' | 'sub') => void;
}

const QuantityPriceForm: React.FC<QuantityPriceFormProps> = ({
  currentProduct,
  quantity,
  unitPrice,
  selectedUnit,
  unitOptions,
  selectedUnitType,
  hasMultipleUnits,
  priceError,
  hasMinPriceRestriction,
  getMinPrice,
  onQuantityChange,
  onUnitPriceChange,
  onUnitChange,
  onUnitTypeChange
}) => {
  const [priceInputValue, setPriceInputValue] = useState('');
  const isUserTyping = useRef(false);

  useEffect(() => {
    if (!isUserTyping.current) {
      setPriceInputValue(unitPrice.toFixed(2));
    }
  }, [unitPrice]);

  const handlePriceInputChange = (value: string) => {
    isUserTyping.current = true;
    setPriceInputValue(value);
    
    if (value && value.trim() !== '') {
      const { numeric } = formatPriceInput(value);
      onUnitPriceChange(numeric);
    } else {
      onUnitPriceChange(0);
    }
  };

  const handlePriceInputBlur = () => {
    isUserTyping.current = false;
    if (priceInputValue && priceInputValue.trim() !== '' && !isNaN(parseFloat(priceInputValue))) {
      const { formatted } = formatPriceInput(priceInputValue);
      const finalFormatted = parseFloat(formatted || '0').toFixed(2);
      setPriceInputValue(finalFormatted);
    } else if (!priceInputValue || priceInputValue.trim() === '') {
      setPriceInputValue('0.00');
      onUnitPriceChange(0);
    }
  };

  const handlePriceInputFocus = () => {
    isUserTyping.current = true;
  };

  const formatPrice = (value: number): string => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const handleUnitTypeChange = (unitType: 'main' | 'sub') => {
    onUnitTypeChange(unitType);
    const unit = unitOptions.find(opt => opt.value === unitType);
    if (unit && onUnitChange) {
      onUnitChange(unit.code);
      onUnitPriceChange(unit.price);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-1 block">Quantidade</Label>
        <Input
          type="number"
          value={quantity || ''}
          onChange={(e) => onQuantityChange(Number(e.target.value))}
          min="1"
          step="1"
          className="text-center"
          placeholder=""
        />
      </div>
      
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-1 block">
          {hasMultipleUnits ? 'Tipo de Unidade' : 'Unidade'}
        </Label>
        {hasMultipleUnits ? (
          <Select value={selectedUnitType} onValueChange={handleUnitTypeChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione unidade" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-300 shadow-lg z-50">
              {unitOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
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
            value={currentProduct.unit || 'UN'}
            readOnly
            className="text-center bg-gray-50"
          />
        )}
      </div>

      <div className="col-span-2">
        <Label className="text-sm font-medium text-gray-700 mb-1 block">Preço Unitário</Label>
        <Input
          type="text"
          value={priceInputValue}
          onChange={(e) => handlePriceInputChange(e.target.value)}
          onBlur={handlePriceInputBlur}
          onFocus={handlePriceInputFocus}
          className={`text-center ${
            priceError ? 'border-red-500 bg-red-50' : ''
          }`}
          placeholder="0.00"
        />
        {priceError && (
          <div className="flex items-center gap-1 mt-1">
            <AlertTriangle size={12} className="text-red-500" />
            <span className="text-xs text-red-600">{priceError}</span>
          </div>
        )}
        {hasMinPriceRestriction === true && !priceError && (
          <div className="text-xs text-gray-600 mt-1">
            Mín: {formatPrice(getMinPrice())}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuantityPriceForm;
