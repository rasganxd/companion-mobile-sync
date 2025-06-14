import React from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
interface CategoryInfo {
  categoryName: string;
  categoryIndex: number;
  totalCategories: number;
  productIndexInCategory: number;
  totalProductsInCategory: number;
}
interface NewOrderProductNavigationProps {
  currentProductIndex: number;
  totalProducts: number;
  categoryInfo?: CategoryInfo | null;
  onNavigate: (direction: 'prev' | 'next' | 'first' | 'last') => void;
  onShowProductSearch: () => void;
}
const NewOrderProductNavigation: React.FC<NewOrderProductNavigationProps> = ({
  currentProductIndex,
  totalProducts,
  categoryInfo,
  onNavigate,
  onShowProductSearch
}) => {
  return <div className="space-y-3">
      {/* Indicadores de Posição */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <div>
          {totalProducts > 0 && `Produto ${currentProductIndex + 1} de ${totalProducts}`}
        </div>
        {categoryInfo && <div className="text-right">
            
            
          </div>}
      </div>

      {/* Botões de Navegação */}
      <div className="grid grid-cols-5 gap-2">
        <Button variant="outline" onClick={() => onNavigate('first')} disabled={totalProducts === 0}>
          <ChevronsLeft size={16} />
        </Button>
        <Button variant="outline" onClick={() => onNavigate('prev')} disabled={totalProducts === 0}>
          <ChevronLeft size={16} />
        </Button>
        <Button onClick={onShowProductSearch} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Search size={20} />
        </Button>
        <Button variant="outline" onClick={() => onNavigate('next')} disabled={totalProducts === 0}>
          <ChevronRight size={16} />
        </Button>
        <Button variant="outline" onClick={() => onNavigate('last')} disabled={totalProducts === 0}>
          <ChevronsRight size={16} />
        </Button>
      </div>
    </div>;
};
export default NewOrderProductNavigation;