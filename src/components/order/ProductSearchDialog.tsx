
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, Search } from 'lucide-react';

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Selecionar Produto</DialogTitle>
          <DialogDescription>
            Busque e selecione o produto desejado
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input 
              placeholder="Buscar por nome ou código..." 
              value={searchTerm} 
              onChange={(e) => onSearchChange(e.target.value)} 
              className="pl-10"
            />
          </div>
          
          <ScrollArea className="h-96">
            {products.length > 0 ? (
              <div className="space-y-2">
                {products.map(product => (
                  <div 
                    key={product.id} 
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" 
                    onClick={() => onSelectProduct(product)}
                  >
                    <div className="flex items-start gap-3">
                      <Package size={20} className="text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{product.name}</div>
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
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package size={32} className="mx-auto mb-2 text-gray-300" />
                <p>Nenhum produto encontrado</p>
                {searchTerm && (
                  <p className="text-sm">Tente buscar por outro termo</p>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductSearchDialog;
