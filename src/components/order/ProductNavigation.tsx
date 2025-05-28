
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
      <Label className="block text-sm font-semibold text-gray-700">Navegação de Produtos:</Label>
      
      {/* Search Button */}
      <Button 
        variant="outline" 
        className="w-full h-9 bg-gradient-to-r from-white to-blue-50 border-2 border-app-blue text-app-blue hover:bg-gradient-to-r hover:from-app-blue hover:to-blue-600 hover:text-white text-sm font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-sm hover:shadow-md" 
        onClick={onProductSearch}
      >
        <Search size={16} className="mr-2" /> 
        Consultar Produtos
      </Button>
      
      {/* Navigation Buttons */}
      <div className="grid grid-cols-4 gap-2">
        <Button 
          variant="outline" 
          className="h-9 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 text-sm hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 transition-all duration-200 transform hover:scale-105 shadow-sm" 
          onClick={() => onProductChange('first')}
          title="Primeiro produto"
        >
          <ChevronsLeft size={16} />
        </Button>
        
        <Button 
          variant="outline" 
          className="h-9 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 text-sm hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 transition-all duration-200 transform hover:scale-105 shadow-sm" 
          onClick={() => onProductChange('prev')}
          title="Produto anterior"
        >
          <ChevronLeft size={16} />
        </Button>
        
        <Button 
          variant="outline" 
          className="h-9 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 text-sm hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 transition-all duration-200 transform hover:scale-105 shadow-sm" 
          onClick={() => onProductChange('next')}
          title="Próximo produto"
        >
          <ChevronRight size={16} />
        </Button>
        
        <Button 
          variant="outline" 
          className="h-9 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 text-sm hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 transition-all duration-200 transform hover:scale-105 shadow-sm" 
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
