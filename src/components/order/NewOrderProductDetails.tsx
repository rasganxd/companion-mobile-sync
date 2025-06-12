
import React from 'react';
import { Package, Tag, Box, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  category_name?: string;
  group_name?: string;
  brand_name?: string;
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
  onProductCodeSearch: (code: string) => void;
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
  const [codeInput, setCodeInput] = React.useState('');

  const handleCodeSearch = () => {
    if (codeInput.trim()) {
      onProductCodeSearch(codeInput.trim());
      setCodeInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCodeSearch();
    }
  };

  if (!currentProduct) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Package size={32} className="mx-auto mb-2 text-gray-300" />
        <p>Nenhum produto selecionado</p>
      </div>
    );
  }

  const currentUnit = unitOptions.find(opt => opt.value === selectedUnitType);
  const displayPrice = currentUnit?.price || currentProduct.sale_price || currentProduct.price || 0;

  return (
    <div className="space-y-4">
      {/* Informações do Produto */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3 mb-3">
          <Package size={24} className="text-blue-600 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{currentProduct.name}</h3>
            <p className="text-sm text-gray-600">
              Código: {currentProduct.code} • Estoque: {currentProduct.stock}
            </p>
            
            {/* Badges para Grupo, Categoria e Marca */}
            <div className="flex flex-wrap gap-2 mt-2">
              {currentProduct.group_name && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Box size={12} className="mr-1" />
                  {currentProduct.group_name}
                </Badge>
              )}
              {currentProduct.category_name && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Tag size={12} className="mr-1" />
                  {currentProduct.category_name}
                </Badge>
              )}
              {currentProduct.brand_name && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <Award size={12} className="mr-1" />
                  {currentProduct.brand_name}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Desconto Máximo - Mostrar se existir */}
        {currentProduct.max_discount_percent && currentProduct.max_discount_percent > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-yellow-600 font-medium text-sm">⚠️ Desconto Máximo:</span>
              <span className="font-bold text-yellow-800">{currentProduct.max_discount_percent.toFixed(1)}%</span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              Não é permitido desconto acima deste valor
            </p>
          </div>
        )}

        {/* Busca por Código */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="col-span-3">
            <Label className="text-xs text-gray-600 mb-1 block">Buscar por Código</Label>
            <Input
              type="number"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite o código"
              className="text-sm"
            />
          </div>
          <div className="flex items-end">
            <Button 
              onClick={handleCodeSearch}
              variant="outline"
              className="w-full h-9 text-sm"
              disabled={!codeInput.trim()}
            >
              Buscar
            </Button>
          </div>
        </div>

        {/* Campos de Unidade e Preço */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <Label className="text-xs text-gray-600 mb-1 block">
              {hasMultipleUnits ? 'Tipo de Unidade:' : 'Unidade de Venda:'}
            </Label>
            {hasMultipleUnits ? (
              <Select value={selectedUnitType} onValueChange={onUnitTypeChange}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Selecione unidade" />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="font-medium">{option.displayText}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={currentProduct.unit || 'UN'}
                readOnly
                className="h-9 text-sm bg-gray-50 cursor-not-allowed"
              />
            )}
          </div>
          
          <div>
            <Label className="text-xs text-gray-600 mb-1 block">
              Preço {currentUnit?.code || currentProduct.unit || 'UN'}:
            </Label>
            <Input
              type="number"
              value={unitPrice}
              onChange={(e) => onUnitPriceChange(Number(e.target.value))}
              min="0"
              step="0.01"
              className="text-sm text-center"
            />
          </div>
        </div>

        {/* Quantidade e Total */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <Label className="text-xs text-gray-600 mb-1 block">Quantidade</Label>
            <Input
              type="number"
              value={quantity || ''}
              onChange={(e) => onQuantityChange(Number(e.target.value))}
              min="1"
              step="1"
              className="text-sm text-center"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-600 mb-1 block">Total do Item</Label>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-center">
              <span className="font-bold text-blue-600">
                R$ {(quantity * unitPrice).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Botão Adicionar */}
        <Button 
          onClick={onAddProduct}
          disabled={!currentProduct || quantity <= 0}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          Adicionar ao Pedido
        </Button>
      </div>
    </div>
  );
};

export default NewOrderProductDetails;
