
import React from 'react';
import { Button } from '@/components/ui/button';

interface OrderTabsProps {
  activeTab: 'pending' | 'transmitted';
  onTabChange: (tab: 'pending' | 'transmitted') => void;
  pendingCount: number;
  transmittedCount: number;
}

const OrderTabs: React.FC<OrderTabsProps> = ({ 
  activeTab, 
  onTabChange, 
  pendingCount, 
  transmittedCount 
}) => {
  return (
    <div className="flex gap-2 mb-4">
      <Button
        variant={activeTab === 'pending' ? 'default' : 'outline'}
        onClick={() => onTabChange('pending')}
      >
        Pendentes ({pendingCount})
      </Button>
      <Button
        variant={activeTab === 'transmitted' ? 'default' : 'outline'}
        onClick={() => onTabChange('transmitted')}
      >
        Transmitidos ({transmittedCount})
      </Button>
    </div>
  );
};

export default OrderTabs;
