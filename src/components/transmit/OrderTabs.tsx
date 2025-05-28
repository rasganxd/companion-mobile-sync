
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
    <div className="flex gap-2 mb-4 overflow-x-auto">
      <Button
        variant={activeTab === 'pending' ? 'default' : 'outline'}
        onClick={() => onTabChange('pending')}
        className="whitespace-nowrap"
      >
        Pendentes ({pendingCount})
      </Button>
      <Button
        variant={activeTab === 'transmitted' ? 'default' : 'outline'}
        onClick={() => onTabChange('transmitted')}
        className="whitespace-nowrap"
      >
        Transmitidos ({transmittedCount})
      </Button>
      <Button
        variant={activeTab === 'error' ? 'default' : 'outline'}
        onClick={() => onTabChange('error')}
        className="whitespace-nowrap"
      >
        Com Erro ({errorCount})
      </Button>
    </div>
  );
};

export default OrderTabs;
