import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, AlertTriangle, Check } from 'lucide-react';
import { useProductPriceValidation } from '@/hooks/useProductPriceValidation';
import { usePriceMask } from '@/hooks/usePriceMask';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  sale_price?: number;
  code: number;
  stock: number;
  unit?: string;
  has_subunit?: boolean;
  subunit?: string;
  subunit_ratio?: number;
  max_discount_percent?: number;
}

interface UnitOption {
  value: 'main' | 'sub';
  label: string;
  code: string;
  price: number;
  displayText: string;
}

interface NewOrderProductDetailsProps {
  currentProduct: Product | null;
  quantity: number;
  unitPrice: number;
  unitOptions: UnitOption[];
  selectedUnitType: 'main' | 'sub';
  hasMultipleUnits: boolean;
  onQuantityChange: (quantity: number) => void;
  onUnitPriceChange: (price: number) => void;
  onUnitTypeChange: (unitType: 'main' | 'sub') => void;
  onAddProduct: () => void;
  onProductCodeSearch?: (code: string) => void;
}

const NewOrderProductDetails: React.FC<NewOrderProductDetailsProps> = ({
  currentProduct,
  quantity,
  unitPrice,
  unitOptions,
  selectedUnitType,
  hasMultipleUnits,
  onQuantityChange,
  onUnitPriceChange,
  onUnitTypeChange,
  onAddProduct,
  onProductCodeSearch
}) => {
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [tempCode, setTempCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // ✅ MODIFICADO: Passa `selectedUnitType` para o hook de validação para garantir que os cálculos de desconto e preço mínimo sejam feitos com base na unidade correta.
  const {
    hasDiscountRestriction,
    getMaxDiscountPercent,
    getCurrentDiscountPercent,
    getMinPriceForCurrentUnit,
    validationResult
  } = useProductPriceValidation(currentProduct, selectedUnitType);

  // Hook para máscara de preço
  const priceMask = usePriceMask(unitPrice);

  // Sincronizar o valor da máscara quando unitPrice mudar externamente
  useEffect(() => {
    priceMask.setValue(unitPrice);
  }, [unitPrice, priceMask]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditingCode && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingCode]);

  if (!currentProduct) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <div className="text-gray-400 mb-2 text-2xl">📦</div>
        <p className="text-gray-500">Nenhum produto selecionado</p>
      </div>
    );
  }

  const salePrice = currentProduct.sale_price || currentProduct.price || 0;
  const currentDiscountPercent = getCurrentDiscountPercent(unitPrice);
  const isDiscountExceeded = hasDiscountRestriction() && currentDiscountPercent > getMaxDiscountPercent();

  // ✅ MODIFICADO: A função `getMinPriceForCurrentUnit` não precisa mais do preço como argumento, pois já sabe a unidade através do `selectedUnitType`.
  const minPriceForCurrentUnit = getMinPriceForCurrentUnit();

  const formatPrice = (value: number): string => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = priceMask.handleChange(e.target.value);
    onUnitPriceChange(newValue);
  };

  const handleCodeClick = () => {
    setTempCode(currentProduct.code.toString());
    setIsEditingCode(true);
  };

  const handleCodeSubmit = () => {
    const newCode = tempCode.trim();
    if (newCode && newCode !== currentProduct.code.toString()) {
      if (onProductCodeSearch) {
        onProductCodeSearch(newCode);
      } else {
        toast.info(`Busca por código ${newCode} - funcionalidade será implementada`);
      }
    }
    setIsEditingCode(false);
    setTempCode('');
  };

  const handleCodeCancel = () => {
    setIsEditingCode(false);
    setTempCode('');
  };

  const handleCodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCodeSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCodeCancel();
    }
  };

  // ✅ NOVO: Função para lidar com o mousedown do botão OK
  const handleOkButtonMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Previne que o input perca o foco
    handleCodeSubmit();
  };

  console.log('🔍 NewOrderProductDetails - Renderizando:', {
    productName: currentProduct.name,
    hasDiscountRestriction: hasDiscountRestriction(),
    minPriceForCurrentUnit,
    maxDiscountPercent: getMaxDiscountPercent(),
    currentPrice: unitPrice,
    currentDiscountPercent,
    isDiscountExceeded,
    selectedUnitType,
    unitOptions: unitOptions.length
  });

  return (
    <div className="space-y-4 mt-6">
      {/* Informações do Produto */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 py-[12px]">
        <div className="flex items-center gap-2 mb-2">
          {isEditingCode ? (
            <div className="flex items-center gap-1">
              <Input
                ref={inputRef}
                type="text"
                value={tempCode}
                onChange={(e) => setTempCode(e.target.value)}
                onKeyDown={handleCodeKeyDown}
                className="w-20 h-7 text-xs font-bold bg-white border-blue-300"
                placeholder="Código"
              />
              <Button
                variant="outline"
                size="sm"
                onMouseDown={handleOkButtonMouseDown}
                className="h-7 px-2 bg-green-100 border-green-300 hover:bg-green-200 text-green-900"
              >
                <Check size={12} />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCodeClick}
              className="h-7 px-2 text-xs font-bold bg-blue-100 border-blue-300 hover:bg-blue-200 text-blue-900"
            >
              {currentProduct.code}
            </Button>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 text-sm">{currentProduct.name}</h3>
            <p className="text-xs text-blue-700">
              Estoque: {currentProduct.stock} • Preço: {formatPrice(salePrice)}
            </p>
          </div>
        </div>
      </div>

      {/* Alerta de Desconto Máximo - SEMPRE VISÍVEL quando há restrição */}
      {hasDiscountRestriction() && (
        <div className={`border rounded-lg p-3 ${isDiscountExceeded ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className={isDiscountExceeded ? 'text-red-600' : 'text-yellow-600'} />
            <span className="text-sm font-medium">
              {isDiscountExceeded ? 'DESCONTO EXCEDIDO!' : 'Controle de Desconto'}
            </span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Desconto máximo permitido:</span>
              <span className="font-medium text-orange-600">{getMaxDiscountPercent().toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Desconto atual:</span>
              <span className={`font-medium ${isDiscountExceeded ? 'text-red-600' : 'text-green-600'}`}>
                {currentDiscountPercent.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Preço mínimo para esta unidade:</span>
              <span className="font-bold text-red-600">{formatPrice(minPriceForCurrentUnit)}</span>
            </div>
            {isDiscountExceeded && (
              <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-center">
                <strong>Preço abaixo do permitido!</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Formulário de Quantidade e Preço */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs font-medium text-gray-700 mb-1 block">Quantidade</Label>
          <Input
            type="number"
            value={quantity || ''}
            onChange={(e) => onQuantityChange(Number(e.target.value))}
            min="1"
            step="1"
            className="text-center h-10"
          />
        </div>

        <div>
          <Label className="text-xs font-medium text-gray-700 mb-1 block">Unidade</Label>
          <Select
            value={selectedUnitType}
            onValueChange={(value: 'main' | 'sub') => onUnitTypeChange(value)}
            disabled={!hasMultipleUnits}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {unitOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.displayText}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs font-medium text-gray-700 mb-1 block">
            Preço
          </Label>
          <Input 
            type="text" 
            value={priceMask.maskedValue}
            onChange={handlePriceChange}
            onFocus={priceMask.handleFocus}
            onBlur={priceMask.handleBlur}
            className={`text-center h-10 ${isDiscountExceeded ? 'border-red-500 bg-red-50' : ''}`}
            placeholder="R$ 0,00"
          />
        </div>
      </div>

      {/* Total do Item */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-green-700">Total do Item:</span>
          <span className="text-green-600 text-sm font-medium">
            {formatPrice(quantity * unitPrice)}
          </span>
        </div>
      </div>

      {/* Botão Adicionar */}
      <Button
        onClick={onAddProduct}
        disabled={!currentProduct || quantity <= 0 || unitPrice <= 0 || isDiscountExceeded}
        className={`w-full h-12 ${isDiscountExceeded ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white font-medium`}
      >
        <Plus size={18} className="mr-2" />
        {isDiscountExceeded ? 'Preço Abaixo do Mínimo' : 'Adicionar ao Pedido'}
      </Button>
    </div>
  );
};

export default NewOrderProductDetails;
