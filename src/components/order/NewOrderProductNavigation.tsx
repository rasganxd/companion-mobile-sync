
import React from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NewOrderProductNavigationProps {
  currentProductIndex: number;
  totalProducts: number;
  onNavigate: (direction: 'prev' | 'next' | 'first' | 'last') => void;
  onShowProductSearch: () => void;
}

const NewOrderProductNavigation: React.FC<NewOrderProductNavigationProps> = ({
  currentProductIndex,
  totalProducts,
  onNavigate,
  onShowProductSearch
}) => {
  return (
    <div className="grid grid-cols-5 gap-2 mb-4">
      <Button 
        variant="outline" 
        onClick={() => onNavigate('first')} 
        disabled={totalProducts === 0}
      >
        <ChevronsLeft size={16} />
      </Button>
      <Button 
        variant="outline" 
        onClick={() => onNavigate('prev')} 
        disabled={totalProducts === 0}
      >
        <ChevronLeft size={16} />
      </Button>
      <Button 
        onClick={onShowProductSearch} 
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        <Search size={20} />
      </Button>
      <Button 
        variant="outline" 
        onClick={() => onNavigate('next')} 
        disabled={totalProducts === 0}
      >
        <ChevronRight size={16} />
      </Button>
      <Button 
        variant="outline" 
        onClick={() => onNavigate('last')} 
        disabled={totalProducts === 0}
      >
        <ChevronsRight size={16} />
      </Button>
    </div>
  );
};

export default NewOrderProductNavigation;
