
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Package } from 'lucide-react';
import { useUnitSelection } from '@/hooks/useUnitSelection';
import { usePriceMask } from '@/hooks/usePriceMask';

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
    maskedValue: maskedUnitPrice,
    handleChange: handlePriceChange,
    handleBlur: handlePriceBlur,
    setValue: setPriceValue,
    getValue: getPriceValue,
    formatPrice
  } = usePriceMask(unitPrice);

  React.useEffect(() => {
    setPriceValue(unitPrice);
  }, [unitPrice, setPriceValue]);

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
    const newPrice = handlePriceChange(value);
    onUnitPriceChange(newPrice);
  };

  const handlePriceInputBlur = () => {
    handlePriceBlur();
    const currentPrice = getPriceValue();
    onUnitPriceChange(currentPrice);
  };

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
            value={quantity}
            onChange={(e) => onQuantityChange(Number(e.target.value))}
            min="1"
            step="1"
            className="text-center"
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
          value={maskedUnitPrice}
          onChange={(e) => handlePriceInputChange(e.target.value)}
          onBlur={handlePriceInputBlur}
          className="text-center"
          placeholder="R$ 0,00"
        />
      </div>

      {/* Total do Item */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-green-900">Total do Item:</span>
          <span className="font-bold text-green-600">
            R$ {(quantity * getPriceValue()).toFixed(2).replace('.', ',')}
          </span>
        </div>
        {quantity > 0 && (
          <div className="text-xs text-green-700 mt-1">
            {quantity} {selectedUnit} × {maskedUnitPrice}
          </div>
        )}
      </div>

      <Button 
        onClick={onAddProduct}
        disabled={quantity <= 0 || getPriceValue() <= 0}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        <Plus size={16} className="mr-2" />
        Adicionar ao Pedido
      </Button>
    </div>
  );
};

export default NewOrderProductDetails;
