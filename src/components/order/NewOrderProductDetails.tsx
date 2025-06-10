
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Package, AlertTriangle, Info } from 'lucide-react';
import { useProductPriceValidation } from '@/hooks/useProductPriceValidation';

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
  onAddProduct
}) => {
  const { 
    hasDiscountRestriction, 
    getMaxDiscountPercent,
    getCurrentDiscountPercent,
    getMinPriceForCurrentUnit,
    validationResult
  } = useProductPriceValidation(currentProduct);

  if (!currentProduct) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <Package size={48} className="mx-auto mb-3 text-gray-400" />
        <p className="text-gray-500 text-base">Nenhum produto selecionado</p>
      </div>
    );
  }

  const salePrice = currentProduct.sale_price || currentProduct.price || 0;
  const currentDiscountPercent = getCurrentDiscountPercent(unitPrice);
  const isDiscountExceeded = hasDiscountRestriction() && currentDiscountPercent > getMaxDiscountPercent();
  const minPriceForCurrentUnit = getMinPriceForCurrentUnit(unitPrice);

  const formatPrice = (value: number): string => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
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
    <div className="space-y-5">
      {/* Informações do Produto - Layout melhorado */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <Package className="text-blue-600" size={24} />
          <div className="flex-1">
            <h3 className="font-bold text-blue-900 text-base">{currentProduct.name}</h3>
            <p className="text-sm text-blue-700 mt-1">
              Código: {currentProduct.code} • Estoque: {currentProduct.stock} • Preço: {formatPrice(salePrice)}
            </p>
          </div>
        </div>
      </div>

      {/* Alerta de Desconto Máximo - Layout aprimorado */}
      {hasDiscountRestriction() && (
        <div className={`border-2 rounded-lg p-4 ${
          isDiscountExceeded 
            ? 'bg-red-50 border-red-300' 
            : 'bg-yellow-50 border-yellow-300'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle size={20} className={isDiscountExceeded ? 'text-red-600' : 'text-yellow-600'} />
            <span className="text-base font-bold">
              {isDiscountExceeded ? 'DESCONTO EXCEDIDO!' : 'Controle de Desconto'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-white rounded border">
                <span className="font-medium">Desconto máximo:</span>
                <span className="font-bold text-orange-600">{getMaxDiscountPercent().toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded border">
                <span className="font-medium">Desconto atual:</span>
                <span className={`font-bold ${
                  isDiscountExceeded ? 'text-red-600' : 'text-green-600'
                }`}>
                  {currentDiscountPercent.toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-white rounded border">
                <span className="font-medium">Preço de venda:</span>
                <span className="font-bold">{formatPrice(salePrice)}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-red-100 rounded border border-red-200">
                <span className="font-medium">Preço mínimo:</span>
                <span className="font-bold text-red-700">{formatPrice(minPriceForCurrentUnit)}</span>
              </div>
            </div>
          </div>
          
          {isDiscountExceeded && (
            <div className="mt-3 p-3 bg-red-100 border-2 border-red-300 rounded text-red-800">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} />
                <span className="font-bold">Não é possível vender abaixo do preço mínimo!</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Formulário de Quantidade e Preço - Grid melhorado */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-bold text-gray-800">Quantidade</Label>
          <Input
            type="number"
            value={quantity || ''}
            onChange={(e) => onQuantityChange(Number(e.target.value))}
            min="1"
            step="1"
            className="text-center h-12 text-base font-semibold border-2 border-gray-300 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-bold text-gray-800">Unidade</Label>
          <Select 
            value={selectedUnitType} 
            onValueChange={(value: 'main' | 'sub') => onUnitTypeChange(value)}
            disabled={!hasMultipleUnits}
          >
            <SelectTrigger className="h-12 border-2 border-gray-300 focus:border-blue-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {unitOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="py-3">
                  <span className="font-semibold">{option.displayText}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-bold text-gray-800">
            Preço Unit.
          </Label>
          {/* Preço Mínimo destacado */}
          {hasDiscountRestriction() && minPriceForCurrentUnit > 0 && (
            <div className="bg-red-100 border border-red-300 rounded p-1 mb-1">
              <div className="text-center text-xs font-medium text-red-700">
                Mín: {formatPrice(minPriceForCurrentUnit)}
              </div>
            </div>
          )}
          <Input
            type="number"
            value={unitPrice || ''}
            onChange={(e) => onUnitPriceChange(Number(e.target.value))}
            min="0"
            step="0.01"
            className={`text-center h-12 text-base font-semibold border-2 ${
              isDiscountExceeded ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
            }`}
          />
        </div>
      </div>

      {/* Total do Item - Layout melhorado */}
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-base font-bold text-green-900">Total do Item:</span>
          <span className="font-bold text-green-700 text-xl">
            {formatPrice(quantity * unitPrice)}
          </span>
        </div>
      </div>

      {/* Botão Adicionar - Layout melhorado */}
      <Button 
        onClick={onAddProduct}
        disabled={!currentProduct || quantity <= 0 || unitPrice <= 0 || isDiscountExceeded}
        className={`w-full h-14 text-base font-bold ${
          isDiscountExceeded 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-700'
        } text-white transition-all duration-200 hover:scale-[1.02] shadow-lg`}
      >
        <Plus size={20} className="mr-3" />
        {isDiscountExceeded ? 'Preço Abaixo do Mínimo' : 'Adicionar ao Pedido'}
      </Button>
    </div>
  );
};

export default NewOrderProductDetails;
