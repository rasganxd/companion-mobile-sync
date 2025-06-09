
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Package, AlertTriangle, Info } from 'lucide-react';
import { useUnitSelection } from '@/hooks/useUnitSelection';
import { useProductPriceValidation } from '@/hooks/useProductPriceValidation';
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

interface NewOrderProductDetailsProps {
  currentProduct: Product | null;
  quantity: number;
  unitPrice: number;
  selectedUnit?: string;
  onQuantityChange: (quantity: number) => void;
  onUnitPriceChange: (price: number) => void;
  onUnitChange?: (unit: string) => void;
  onAddProduct: () => void;
}

const NewOrderProductDetails: React.FC<NewOrderProductDetailsProps> = ({
  currentProduct,
  quantity,
  unitPrice,
  selectedUnit = 'UN',
  onQuantityChange,
  onUnitPriceChange,
  onUnitChange,
  onAddProduct
}) => {
  const { unitOptions, selectedUnitType, setSelectedUnitType, hasMultipleUnits } = useUnitSelection(currentProduct);
  const { 
    validatePrice, 
    hasMinPriceRestriction, 
    getMinPrice,
    hasDiscountRestriction,
    getMaxDiscountPercent,
    getCurrentDiscountPercent,
    getMinPriceByDiscount
  } = useProductPriceValidation(currentProduct);
  
  const [priceInputValue, setPriceInputValue] = useState('');
  const [priceError, setPriceError] = useState<string | null>(null);
  const isUserTyping = useRef(false);

  // Sincronizar o valor do input apenas quando não estiver digitando
  useEffect(() => {
    if (!isUserTyping.current) {
      setPriceInputValue(unitPrice.toFixed(2));
    }
  }, [unitPrice]);

  // Validar preço sempre que mudar
  useEffect(() => {
    const result = validatePrice(unitPrice);
    setPriceError(result.error);
  }, [unitPrice, validatePrice]);

  if (!currentProduct) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <p className="text-gray-500">Nenhum produto selecionado</p>
      </div>
    );
  }

  const handleUnitTypeChange = (unitType: 'main' | 'sub') => {
    setSelectedUnitType(unitType);
    const unit = unitOptions.find(opt => opt.value === unitType);
    if (unit && onUnitChange) {
      onUnitChange(unit.code);
      onUnitPriceChange(unit.price);
    }
  };

  const handlePriceInputChange = (value: string) => {
    isUserTyping.current = true;
    // Permite edição livre durante a digitação
    setPriceInputValue(value);
    
    // Só aplica formatação se houver conteúdo válido
    if (value && value.trim() !== '') {
      const { numeric } = formatPriceInput(value);
      onUnitPriceChange(numeric);
    } else {
      onUnitPriceChange(0);
    }
  };

  const handlePriceInputBlur = () => {
    isUserTyping.current = false;
    // Formatar para 2 casas decimais ao sair do campo
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

  const currentDiscountPercent = getCurrentDiscountPercent(unitPrice);
  const maxDiscountPercent = getMaxDiscountPercent();
  const salePrice = currentProduct.sale_price || currentProduct.price || 0;

  return (
    <div className="space-y-4">
      {/* Informações do Produto */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-2">
          <Package className="text-blue-600" size={20} />
          <div>
            <h3 className="font-semibold text-blue-900">{currentProduct.name}</h3>
            <p className="text-sm text-blue-700">
              Código: {currentProduct.code} • Estoque: {currentProduct.stock}
            </p>
          </div>
        </div>
        
        {currentProduct.min_price && currentProduct.min_price > 0 && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-700">
              ⚠️ Preço mínimo: {formatPrice(currentProduct.min_price)}
            </p>
          </div>
        )}
      </div>

      {/* Formulário de Entrada */}
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
      </div>

      <div>
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
        {hasMinPriceRestriction() && !priceError && (
          <div className="text-xs text-gray-600 mt-1">
            Mín: {formatPrice(getMinPrice())}
          </div>
        )}
      </div>

      {/* Informações de Desconto */}
      {hasDiscountRestriction() && (
        <div className="bg-white border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Info size={14} className="text-blue-500" />
            <span className="text-sm font-medium text-gray-700">Informações de Desconto</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Preço de venda:</span>
              <span className="font-medium">{formatPrice(salePrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Desconto máximo:</span>
              <span className="font-medium text-orange-600">{maxDiscountPercent.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Desconto atual:</span>
              <span className={`font-medium ${
                currentDiscountPercent > maxDiscountPercent ? 'text-red-600' : 'text-green-600'
              }`}>
                {currentDiscountPercent.toFixed(1)}%
              </span>
            </div>
            {getMinPriceByDiscount() > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Preço mín. por desconto:</span>
                <span className="font-medium">{formatPrice(getMinPriceByDiscount())}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Total do Item */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-green-900">Total do Item:</span>
          <span className={`font-bold ${priceError ? 'text-red-600' : 'text-green-600'}`}>
            R$ {(quantity * unitPrice).toFixed(2).replace('.', ',')}
          </span>
        </div>
        {quantity > 0 && (
          <div className="text-xs text-green-700 mt-1">
            {quantity} {selectedUnit} × {formatPrice(unitPrice)}
          </div>
        )}
      </div>

      <Button 
        onClick={onAddProduct}
        disabled={quantity <= 0 || unitPrice <= 0 || !!priceError}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        <Plus size={16} className="mr-2" />
        {priceError ? 'Preço Inválido' : 'Adicionar ao Pedido'}
      </Button>
    </div>
  );
};

export default NewOrderProductDetails;
