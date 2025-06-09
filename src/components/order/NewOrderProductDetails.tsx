
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Package } from 'lucide-react';

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
  selectedUnit?: string; // ✅ NOVO: Unidade selecionada
  onQuantityChange: (quantity: number) => void;
  onUnitPriceChange: (price: number) => void;
  onUnitChange?: (unit: string) => void; // ✅ NOVO: Callback para mudança de unidade
  onAddProduct: () => void;
}

const NewOrderProductDetails: React.FC<NewOrderProductDetailsProps> = ({
  currentProduct,
  quantity,
  unitPrice,
  selectedUnit = 'UN', // ✅ NOVO: Valor padrão
  onQuantityChange,
  onUnitPriceChange,
  onUnitChange,
  onAddProduct
}) => {
  if (!currentProduct) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <p className="text-gray-500">Nenhum produto selecionado</p>
      </div>
    );
  }

  // ✅ NOVO: Criar opções de unidade baseadas no produto
  const getUnitOptions = () => {
    const options = [];
    
    // Unidade principal
    if (currentProduct.unit) {
      options.push({ value: currentProduct.unit, label: currentProduct.unit });
    }
    
    // Subunidade se disponível
    if (currentProduct.has_subunit && currentProduct.subunit) {
      options.push({ value: currentProduct.subunit, label: currentProduct.subunit });
    }
    
    // Se não há opções específicas, adicionar UN como padrão
    if (options.length === 0) {
      options.push({ value: 'UN', label: 'UN' });
    }
    
    return options;
  };

  const unitOptions = getUnitOptions();

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
              ⚠️ Preço mínimo: R$ {currentProduct.min_price.toFixed(2)}
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
        
        {/* ✅ NOVO: Seletor de unidade */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1 block">Unidade</Label>
          <Select value={selectedUnit} onValueChange={onUnitChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione unidade" />
            </SelectTrigger>
            <SelectContent>
              {unitOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700 mb-1 block">Preço Unitário</Label>
        <Input
          type="number"
          value={unitPrice}
          onChange={(e) => onUnitPriceChange(Number(e.target.value))}
          min="0"
          step="0.01"
          className="text-center"
        />
      </div>

      {/* Total do Item */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-green-900">Total do Item:</span>
          <span className="font-bold text-green-600">
            R$ {(quantity * unitPrice).toFixed(2)}
          </span>
        </div>
        <div className="text-xs text-green-700 mt-1">
          {quantity} {selectedUnit} × R$ {unitPrice.toFixed(2)}
        </div>
      </div>

      {/* Botão Adicionar */}
      <Button 
        onClick={onAddProduct}
        disabled={quantity <= 0 || unitPrice <= 0}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        <Plus size={16} className="mr-2" />
        Adicionar ao Pedido
      </Button>
    </div>
  );
};

export default NewOrderProductDetails;
