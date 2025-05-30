
import React from 'react';
import { Button } from '@/components/ui/button';

interface OrderTabsProps {
  activeTab: 'pending' | 'transmitted' | 'error';
  onTabChange: (tab: 'pending' | 'transmitted' | 'error') => void;
  pendingCount: number;
  transmittedCount: number;
  errorCount: number;
}

const OrderTabs: React.FC<OrderTabsProps> = ({ 
  activeTab, 
  onTabChange, 
  pendingCount, 
  transmittedCount,
  errorCount 
}) => {
  return (
    <div className="flex gap-1 mb-4">
      <Button
        variant={activeTab === 'pending' ? 'default' : 'outline'}
        onClick={() => onTabChange('pending')}
        className="flex-1 text-xs sm:text-sm px-2 py-2 h-9"
      >
        Pendentes ({pendingCount})
      </Button>
      <Button
        variant={activeTab === 'transmitted' ? 'default' : 'outline'}
        onClick={() => onTabChange('transmitted')}
        className="flex-1 text-xs sm:text-sm px-2 py-2 h-9"
      >
        Enviados ({transmittedCount})
      </Button>
      <Button
        variant={activeTab === 'error' ? 'default' : 'outline'}
        onClick={() => onTabChange('error')}
        className="flex-1 text-xs sm:text-sm px-2 py-2 h-9"
      >
        Erro ({errorCount})
      </Button>
    </div>
  );
};

export default OrderTabs;
