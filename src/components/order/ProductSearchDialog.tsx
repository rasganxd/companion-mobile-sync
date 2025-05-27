
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Search, Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  code?: number;
  stock: number;
  unit?: string;
  cost?: number;
}

interface ProductSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filteredProducts: Product[];
  onSelectProduct: (product: Product) => void;
}

const ProductSearchDialog: React.FC<ProductSearchDialogProps> = ({
  open,
  onOpenChange,
  searchQuery,
  onSearchChange,
  filteredProducts,
  onSelectProduct
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-app-blue text-lg font-semibold flex items-center gap-2">
            <Package size={20} />
            Consultar Produtos
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Digite o nome do produto..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-10"
              autoFocus
            />
          </div>
          
          <ScrollArea className="h-64 border rounded-md">
            <div className="p-2">
              {filteredProducts.length > 0 ? (
                <div className="space-y-1">
                  {filteredProducts.map((product) => (
                    <Button
                      key={product.id}
                      variant="ghost"
                      className="w-full justify-start p-3 h-auto text-left hover:bg-blue-50"
                      onClick={() => onSelectProduct(product)}
                    >
                      <div className="flex flex-col items-start w-full">
                        <div className="flex justify-between items-start w-full">
                          <span className="font-medium text-sm text-gray-900">
                            {product.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {product.code || 'S/C'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center w-full mt-1">
                          <span className="text-xs text-gray-600">
                            Estoque: {product.stock || 0} {product.unit || 'UN'}
                          </span>
                          <span className="text-sm font-semibold text-app-blue">
                            R$ {product.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">
                    {searchQuery ? 'Nenhum produto encontrado' : 'Digite para buscar produtos'}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductSearchDialog;
