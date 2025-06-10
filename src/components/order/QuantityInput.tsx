
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, AlertTriangle, Info } from 'lucide-react';
import { useProductPricing } from '@/hooks/useProductPricing';
import { useProductPriceValidation } from '@/hooks/useProductPriceValidation';
import { formatPriceInput } from '@/lib/utils';

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
  max_discount_percent?: number;
}

interface QuantityInputProps {
  quantity: string;
  onQuantityChange: (value: string) => void;
  onAddItem: () => void;
  product: Product;
  selectedUnit?: 'main' | 'sub';
  onUnitChange?: (unit: 'main' | 'sub') => void;
}

const QuantityInput: React.FC<QuantityInputProps> = ({
  quantity,
  onQuantityChange,
  onAddItem,
  product,
  selectedUnit = 'sub',
  onUnitChange
}) => {
  const {
    unitPrice,
    displayUnit,
    mainUnit,
    subUnit,
    ratio
  } = useProductPricing(product, selectedUnit);

  const { 
    validatePrice, 
    validationResult, 
    hasDiscountRestriction,
    getMaxDiscountPercent,
    getCurrentDiscountPercent,
    getMinPriceForCurrentUnit
  } = useProductPriceValidation(product);
  
  const [currentPrice, setCurrentPrice] = useState(unitPrice);
  const [priceInputValue, setPriceInputValue] = useState('');
  const [priceError, setPriceError] = useState<string | null>(null);
  const isUserTyping = useRef(false);

  useEffect(() => {
    if (!isUserTyping.current) {
      setCurrentPrice(unitPrice);
      setPriceInputValue(unitPrice.toFixed(2));
    }
  }, [unitPrice]);

  useEffect(() => {
    const result = validatePrice(currentPrice);
    setPriceError(result.error);
  }, [currentPrice, validatePrice]);

  const formatPrice = (value: number): string => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const handlePriceInputChange = (value: string) => {
    isUserTyping.current = true;
    setPriceInputValue(value);
    
    if (value && value.trim() !== '') {
      const { numeric } = formatPriceInput(value);
      setCurrentPrice(numeric);
      const result = validatePrice(numeric);
      setPriceError(result.error);
    } else {
      setCurrentPrice(0);
      setPriceError(null);
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
      setCurrentPrice(0);
    }
  };

  const handlePriceInputFocus = () => {
    isUserTyping.current = true;
  };

  const calculateTotal = () => {
    const qty = parseFloat(quantity) || 0;
    return (qty * currentPrice).toFixed(2);
  };

  const canAddItem = () => {
    const qty = parseFloat(quantity) || 0;
    const isPriceValid = !priceError && currentPrice > 0;
    return qty > 0 && isPriceValid;
  };

  const handleAddItem = () => {
    if (canAddItem()) {
      onAddItem();
    }
  };

  const hasSubunit = product.has_subunit && product.subunit_ratio && product.subunit_ratio > 1 && subUnit;
  const currentDiscountPercent = getCurrentDiscountPercent(currentPrice);
  const maxDiscountPercent = getMaxDiscountPercent();
  const salePrice = product.sale_price || product.price || 0;
  const minPriceForCurrentUnit = getMinPriceForCurrentUnit(currentPrice);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 border border-blue-200 shadow-sm rounded-lg">
      <div className="space-y-5">
        {/* Seletor de Unidade - Melhor visibilidade */}
        {hasSubunit && onUnitChange && (
          <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
            <Label className="block mb-3 text-sm font-bold text-gray-800">Tipo de Unidade:</Label>
            <Select value={selectedUnit} onValueChange={(value: 'main' | 'sub') => onUnitChange(value)}>
              <SelectTrigger className="w-full h-12 bg-white border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-300 shadow-lg rounded-lg">
                <SelectItem value="sub" className="hover:bg-blue-50 py-3">
                  <div className="flex flex-col">
                    <span className="font-semibold text-base">{subUnit}</span>
                    <span className="text-sm text-gray-500">Unidade menor</span>
                  </div>
                </SelectItem>
                <SelectItem value="main" className="hover:bg-blue-50 py-3">
                  <div className="flex flex-col">
                    <span className="font-semibold text-base">{mainUnit}</span>
                    <span className="text-sm text-gray-500">Unidade principal</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* Informação de conversão destacada */}
            <div className="mt-3 text-base text-gray-800 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="font-bold text-center text-lg">
                1 {mainUnit} = {ratio} {subUnit}
              </div>
              <div className="text-center text-sm text-gray-600 mt-2">
                Preço por {mainUnit}: {formatPrice(currentPrice * ratio)}
              </div>
            </div>
          </div>
        )}

        {/* Grid de Quantidade e Preço - Layout melhorado */}
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="block text-sm font-bold text-gray-800">
              Quantidade ({displayUnit}):
            </Label>
            <Input
              type="number"
              className="h-12 text-center text-base font-semibold border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              value={quantity || ''}
              onChange={e => onQuantityChange(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="block text-sm font-bold text-gray-800">
              Preço ({displayUnit}):
            </Label>
            {/* Preço Mínimo - Destaque melhorado */}
            {hasDiscountRestriction() && minPriceForCurrentUnit > 0 && (
              <div className="bg-red-100 border border-red-300 rounded-md p-2 mb-2">
                <div className="text-center">
                  <span className="text-xs font-medium text-red-700">PREÇO MÍNIMO:</span>
                  <div className="text-base font-bold text-red-800">
                    {formatPrice(minPriceForCurrentUnit)}
                  </div>
                </div>
              </div>
            )}
            <Input
              type="text"
              className={`h-12 text-center text-base font-semibold border-2 transition-all duration-200 ${
                priceError 
                  ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
              }`}
              value={priceInputValue}
              onChange={e => handlePriceInputChange(e.target.value)}
              onBlur={handlePriceInputBlur}
              onFocus={handlePriceInputFocus}
              placeholder="0.00"
            />
            {priceError && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-red-100 border border-red-300 rounded-md">
                <AlertTriangle size={16} className="text-red-600" />
                <span className="text-sm font-medium text-red-700">{priceError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Informações de Desconto - Layout aprimorado */}
        {hasDiscountRestriction() && (
          <div className="bg-white p-4 rounded-lg border-2 border-orange-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Info size={18} className="text-orange-600" />
              <span className="text-base font-bold text-gray-800">Controle de Desconto</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium text-gray-700">Preço de venda:</span>
                  <span className="font-bold text-gray-900">{formatPrice(salePrice)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                  <span className="font-medium text-gray-700">Desconto máximo:</span>
                  <span className="font-bold text-orange-700">{maxDiscountPercent.toFixed(1)}%</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium text-gray-700">Desconto atual:</span>
                  <span className={`font-bold ${
                    currentDiscountPercent > maxDiscountPercent ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {currentDiscountPercent.toFixed(1)}%
                  </span>
                </div>
                {minPriceForCurrentUnit > 0 && (
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded border border-red-200">
                    <span className="font-medium text-gray-700">Preço mínimo:</span>
                    <span className="font-bold text-red-700">{formatPrice(minPriceForCurrentUnit)}</span>
                  </div>
                )}
              </div>
            </div>
            {currentDiscountPercent > maxDiscountPercent && (
              <div className="mt-3 p-3 bg-red-100 border-2 border-red-300 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-600" />
                  <span className="text-sm font-bold text-red-700">
                    Desconto excede o limite máximo permitido!
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Total do item - Melhor destaque */}
        {quantity && parseFloat(quantity) > 0 && (
          <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-800 text-base">Total do Item:</span>
              <span className={`font-bold text-xl ${priceError ? 'text-red-600' : 'text-green-700'}`}>
                R$ {calculateTotal().replace('.', ',')}
              </span>
            </div>
          </div>
        )}
        
        {/* Botão Adicionar - Melhor visibilidade */}
        <Button
          variant="default"
          className={`w-full h-12 text-base font-bold transition-all duration-200 transform hover:scale-[1.02] active:scale-98 shadow-lg hover:shadow-xl ${
            canAddItem()
              ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
              : 'bg-gray-400 text-gray-600 cursor-not-allowed'
          }`}
          onClick={handleAddItem}
          disabled={!canAddItem()}
        >
          <Plus size={20} className="mr-3" />
          {priceError ? 'Desconto Excedido' : 'Adicionar ao Pedido'}
        </Button>
      </div>
    </div>
  );
};

export default QuantityInput;
