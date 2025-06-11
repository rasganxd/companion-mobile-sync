
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
  const getTabClasses = (tabType: 'pending' | 'transmitted' | 'error', isActive: boolean) => {
    const baseClasses = "flex-1 text-xs sm:text-sm px-2 py-2 h-9 border transition-all duration-200";
    
    switch (tabType) {
      case 'pending':
        return isActive 
          ? `${baseClasses} tab-pending-active`
          : `${baseClasses} tab-pending-inactive bg-white`;
      case 'transmitted':
        return isActive 
          ? `${baseClasses} tab-success-active`
          : `${baseClasses} tab-success-inactive bg-white`;
      case 'error':
        return isActive 
          ? `${baseClasses} tab-error-active`
          : `${baseClasses} tab-error-inactive bg-white`;
      default:
        return baseClasses;
    }
  };

  return (
    <div className="flex gap-1 mb-4">
      <button
        onClick={() => onTabChange('pending')}
        className={getTabClasses('pending', activeTab === 'pending')}
      >
        Pendentes ({pendingCount})
      </button>
      <button
        onClick={() => onTabChange('transmitted')}
        className={getTabClasses('transmitted', activeTab === 'transmitted')}
      >
        Enviados ({transmittedCount})
      </button>
      <button
        onClick={() => onTabChange('error')}
        className={getTabClasses('error', activeTab === 'error')}
      >
        Erro ({errorCount})
      </button>
    </div>
  );
};

export default OrderTabs;
