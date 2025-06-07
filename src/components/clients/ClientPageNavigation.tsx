
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AppButton from '@/components/AppButton';

interface ClientPageNavigationProps {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
  clientName: string;
}

const ClientPageNavigation: React.FC<ClientPageNavigationProps> = ({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  clientName
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <AppButton 
          variant="gray" 
          onClick={onPrevious} 
          disabled={currentPage === 0}
          className="flex items-center gap-2 px-4 py-2"
        >
          <ChevronLeft size={16} />
          <span className="text-sm">Anterior</span>
        </AppButton>
        
        <div className="text-center flex-1 mx-4">
          <p className="text-sm font-medium text-gray-900">
            {currentPage + 1} de {totalPages}
          </p>
          <p className="text-xs text-gray-500 truncate max-w-48">
            {clientName}
          </p>
        </div>
        
        <AppButton 
          variant="gray" 
          onClick={onNext} 
          disabled={currentPage === totalPages - 1}
          className="flex items-center gap-2 px-4 py-2"
        >
          <span className="text-sm">Próximo</span>
          <ChevronRight size={16} />
        </AppButton>
      </div>
    </div>
  );
};

export default ClientPageNavigation;
