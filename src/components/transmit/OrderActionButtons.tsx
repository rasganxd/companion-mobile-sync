
import React from 'react';
import { Send, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrderActionButtonsProps {
  activeTab: 'pending' | 'transmitted';
  isTransmitting: boolean;
  isLoading: boolean;
  pendingCount: number;
  onTransmitAll: () => void;
  onRefresh: () => void;
}

const OrderActionButtons: React.FC<OrderActionButtonsProps> = ({
  activeTab,
  isTransmitting,
  isLoading,
  pendingCount,
  onTransmitAll,
  onRefresh
}) => {
  if (activeTab === 'pending') {
    return (
      <div className="flex gap-2 mb-4">
        <Button 
          onClick={onTransmitAll}
          disabled={isTransmitting || pendingCount === 0}
          className="flex-1"
        >
          {isTransmitting ? (
            <RefreshCw className="animate-spin mr-2" size={16} />
          ) : (
            <Send className="mr-2" size={16} />
          )}
          {isTransmitting ? 'Transmitindo...' : `Transmitir Todos (${pendingCount})`}
        </Button>
        
        <Button 
          onClick={onRefresh} 
          variant="outline"
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex justify-end mb-4">
      <Button 
        onClick={onRefresh} 
        variant="outline"
        disabled={isLoading}
      >
        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
      </Button>
    </div>
  );
};

export default OrderActionButtons;
