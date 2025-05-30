import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

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
  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'pending':
        return <Clock size={16} />;
      case 'transmitted':
        return <CheckCircle size={16} />;
      case 'error':
        return <AlertCircle size={16} />;
      default:
        return null;
    }
  };

  const getTabStyle = (tab: string, isActive: boolean) => {
    const baseStyle = "flex-1 text-xs sm:text-sm px-2 py-3 h-12 flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 active:scale-95";
    
    if (isActive) {
      switch (tab) {
        case 'pending':
          return `${baseStyle} bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg`;
        case 'transmitted':
          return `${baseStyle} bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg`;
        case 'error':
          return `${baseStyle} bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg`;
        default:
          return `${baseStyle} bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg`;
      }
    } else {
      return `${baseStyle} bg-white border border-gray-200 text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 hover:border-gray-300 shadow-sm hover:shadow-md`;
    }
  };

  return (
    <div className="flex gap-2 mb-4 animate-fade-in">
      <Button
        variant="ghost"
        onClick={() => onTabChange('pending')}
        className={getTabStyle('pending', activeTab === 'pending')}
      >
        {getTabIcon('pending')}
        <span className="font-medium">
          Pendentes
          <span className="ml-1 bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
            {pendingCount}
          </span>
        </span>
      </Button>
      
      <Button
        variant="ghost"
        onClick={() => onTabChange('transmitted')}
        className={getTabStyle('transmitted', activeTab === 'transmitted')}
      >
        {getTabIcon('transmitted')}
        <span className="font-medium">
          Enviados
          <span className="ml-1 bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
            {transmittedCount}
          </span>
        </span>
      </Button>
      
      <Button
        variant="ghost"
        onClick={() => onTabChange('error')}
        className={getTabStyle('error', activeTab === 'error')}
      >
        {getTabIcon('error')}
        <span className="font-medium">
          Erro
          <span className="ml-1 bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
            {errorCount}
          </span>
        </span>
      </Button>
    </div>
  );
};

export default OrderTabs;
