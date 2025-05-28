
import React from 'react';
import { Send, RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrderActionButtonsProps {
  activeTab: 'pending' | 'transmitted' | 'error';
  isTransmitting: boolean;
  isLoading: boolean;
  pendingCount: number;
  errorCount: number;
  onTransmitAll: () => void;
  onRetryAllErrors?: () => void;
  onRefresh: () => void;
}

const OrderActionButtons: React.FC<OrderActionButtonsProps> = ({
  activeTab,
  isTransmitting,
  isLoading,
  pendingCount,
  errorCount,
  onTransmitAll,
  onRetryAllErrors,
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

  if (activeTab === 'error') {
    return (
      <div className="flex gap-2 mb-4">
        <Button 
          onClick={onRetryAllErrors}
          disabled={isLoading || errorCount === 0}
          className="flex-1"
          variant="destructive"
        >
          <RotateCcw className="mr-2" size={16} />
          Tentar Todos Novamente ({errorCount})
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
