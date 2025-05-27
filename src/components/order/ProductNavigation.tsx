
import React from 'react';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
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
    <div>
      <Label className="block mb-1 text-sm font-medium text-gray-700">Navegação:</Label>
      <div className="flex gap-1">
        <Button 
          variant="outline" 
          className="flex-1 bg-gray-50 h-9 border border-gray-300 text-sm" 
          onClick={() => onProductChange('prev')}
        >
          &lt;
        </Button>
        <Button 
          variant="outline" 
          className="flex-1 bg-gray-50 h-9 border border-gray-300 text-sm" 
          onClick={onProductSearch}
        >
          <Search size={14} className="mr-1" /> Con
        </Button>
        <Button 
          variant="outline" 
          className="flex-1 bg-gray-50 h-9 border border-gray-300 text-sm" 
          onClick={() => onProductChange('next')}
        >
          &gt;
        </Button>
      </div>
    </div>
  );
};

export default ProductNavigation;
