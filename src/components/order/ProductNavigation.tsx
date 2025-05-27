
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
    <div className="space-y-3">
      <Label className="block text-sm font-medium text-gray-700">Navegação de Produtos:</Label>
      
      {/* Search Button */}
      <Button 
        variant="outline" 
        className="w-full h-12 bg-white border-2 border-app-blue text-app-blue hover:bg-app-blue hover:text-white text-sm font-medium" 
        onClick={onProductSearch}
      >
        <Search size={16} className="mr-2" /> 
        Consultar Produtos
      </Button>
      
      {/* Navigation Buttons */}
      <div className="grid grid-cols-4 gap-2">
        <Button 
          variant="outline" 
          className="h-12 bg-gray-50 border border-gray-300 text-sm hover:bg-gray-100" 
          onClick={() => onProductChange('first')}
          title="Primeiro produto"
        >
          <ChevronsLeft size={16} />
        </Button>
        
        <Button 
          variant="outline" 
          className="h-12 bg-gray-50 border border-gray-300 text-sm hover:bg-gray-100" 
          onClick={() => onProductChange('prev')}
          title="Produto anterior"
        >
          <ChevronLeft size={16} />
        </Button>
        
        <Button 
          variant="outline" 
          className="h-12 bg-gray-50 border border-gray-300 text-sm hover:bg-gray-100" 
          onClick={() => onProductChange('next')}
          title="Próximo produto"
        >
          <ChevronRight size={16} />
        </Button>
        
        <Button 
          variant="outline" 
          className="h-12 bg-gray-50 border border-gray-300 text-sm hover:bg-gray-100" 
          onClick={() => onProductChange('last')}
          title="Último produto"
        >
          <ChevronsRight size={16} />
        </Button>
      </div>
    </div>
  );
};

export default ProductNavigation;
