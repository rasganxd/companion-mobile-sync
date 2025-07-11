import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, Search, Tag } from 'lucide-react';
interface Product {
  id: string;
  name: string;
  price: number;
  sale_price?: number;
  cost_price?: number;
  code: number;
  stock: number;
  unit?: string;
  cost?: number;
  has_subunit?: boolean;
  subunit?: string;
  subunit_ratio?: number;
  category_name?: string;
}
interface ProductSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
}
const ProductSearchDialog: React.FC<ProductSearchDialogProps> = ({
  isOpen,
  onClose,
  searchTerm,
  onSearchChange,
  products,
  onSelectProduct
}) => {
  // Estado local para evitar conflitos com o estado controlado
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // Sincronizar com o prop searchTerm quando o diálogo abrir
  useEffect(() => {
    if (isOpen) {
      setLocalSearchTerm(searchTerm);
    }
  }, [isOpen, searchTerm]);

  // Atualizar o estado pai quando o estado local mudar
  const handleSearchChange = (value: string) => {
    setLocalSearchTerm(value);
    onSearchChange(value);
  };

  // Limpar o estado local quando fechar
  const handleClose = () => {
    setLocalSearchTerm('');
    onClose();
  };
  const getDisplayPrice = (product: Product) => {
    // Use sale_price if available, otherwise use price
    const basePrice = product.sale_price || product.price || 0;
    return basePrice;
  };
  const getUnitInfo = (product: Product) => {
    if (product.has_subunit && product.subunit && product.subunit_ratio && product.subunit_ratio > 1) {
      const subunitPrice = getDisplayPrice(product) / product.subunit_ratio;
      return `${product.unit || 'UN'} (R$ ${getDisplayPrice(product).toFixed(2)}) • ${product.subunit} (R$ ${subunitPrice.toFixed(2)})`;
    }
    return product.unit || 'UN';
  };

  // Agrupar produtos por categoria para exibição
  const productsByCategory = products.reduce((acc, product) => {
    const categoryName = product.category_name || 'Sem Categoria';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(product);
    return acc;
  }, {} as Record<string, Product[]>);
  const categoryEntries = Object.entries(productsByCategory).sort(([a], [b]) => a.localeCompare(b));
  return <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Selecionar Produto</DialogTitle>
          
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input placeholder="Buscar por nome, código ou categoria..." value={localSearchTerm} onChange={e => handleSearchChange(e.target.value)} className="pl-10" />
          </div>
          
          <ScrollArea className="h-96">
            {products.length > 0 ? <div className="space-y-3">
                {categoryEntries.map(([categoryName, categoryProducts]) => <div key={categoryName} className="space-y-2">
                    {/* Cabeçalho da Categoria */}
                    <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-md">
                      <Tag size={14} className="text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">{categoryName}</span>
                      <span className="text-xs text-gray-500">({categoryProducts.length})</span>
                    </div>
                    
                    {/* Produtos da Categoria */}
                    {categoryProducts.map(product => <div key={product.id} onClick={() => onSelectProduct(product)} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ml-4 py-[6px] px-[6px]">
                        <div className="flex items-start gap-3">
                          <Package size={20} className="text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-sm text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-600">
                              Código: {product.code} • Estoque: {product.stock}
                            </div>
                            <div className="text-xs text-gray-500">
                              Unidade: {getUnitInfo(product)}
                            </div>
                            <div className="text-sm font-semibold text-green-600">
                              Preço: R$ {getDisplayPrice(product).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>)}
                  </div>)}
              </div> : <div className="text-center py-8 text-gray-500">
                <Package size={32} className="mx-auto mb-2 text-gray-300" />
                <p>Nenhum produto encontrado</p>
                {localSearchTerm && <p className="text-sm">Tente buscar por outro termo</p>}
              </div>}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>;
};
export default ProductSearchDialog;