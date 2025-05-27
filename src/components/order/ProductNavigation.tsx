
import React from 'react';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface ProductNavigationProps {
  onProductChange: (direction: 'prev' | 'next' | 'first' | 'last') => void;
  onProductSearch: () => void;
}

const ProductNavigation: React.FC<ProductNavigationProps> = ({
  onProductChange,
  onProductSearch
}) => {
  return (
    <div className="space-y-2">
      <Label className="block text-xs font-medium text-gray-700">Navegação de Produtos:</Label>
      
      {/* Search Button */}
      <Button 
        variant="outline" 
        className="w-full h-8 bg-white border border-app-blue text-app-blue hover:bg-app-blue hover:text-white text-xs font-medium" 
        onClick={onProductSearch}
      >
        <Search size={14} className="mr-1" /> 
        Consultar Produtos
      </Button>
      
      {/* Navigation Buttons */}
      <div className="grid grid-cols-4 gap-1">
        <Button 
          variant="outline" 
          className="h-8 bg-gray-50 border border-gray-300 text-xs hover:bg-gray-100" 
          onClick={() => onProductChange('first')}
          title="Primeiro produto"
        >
          <ChevronsLeft size={14} />
        </Button>
        
        <Button 
          variant="outline" 
          className="h-8 bg-gray-50 border border-gray-300 text-xs hover:bg-gray-100" 
          onClick={() => onProductChange('prev')}
          title="Produto anterior"
        >
          <ChevronLeft size={14} />
        </Button>
        
        <Button 
          variant="outline" 
          className="h-8 bg-gray-50 border border-gray-300 text-xs hover:bg-gray-100" 
          onClick={() => onProductChange('next')}
          title="Próximo produto"
        >
          <ChevronRight size={14} />
        </Button>
        
        <Button 
          variant="outline" 
          className="h-8 bg-gray-50 border border-gray-300 text-xs hover:bg-gray-100" 
          onClick={() => onProductChange('last')}
          title="Último produto"
        >
          <ChevronsRight size={14} />
        </Button>
      </div>
    </div>
  );
};

export default ProductNavigation;
