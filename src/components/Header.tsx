
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';
import NetworkStatusIndicator from './NetworkStatusIndicator';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  backgroundColor?: 'blue' | 'green' | 'red' | 'gray';
  rightComponent?: React.ReactNode;
  showNetworkStatus?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  showBackButton = false, 
  backgroundColor = 'blue',
  rightComponent,
  showNetworkStatus = true
}) => {
  const { goBack, canGoBack } = useNavigation();

  const getBackgroundClasses = () => {
    switch (backgroundColor) {
      case 'green':
        return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'red':
        return 'bg-gradient-to-r from-red-500 to-red-600';
      case 'gray':
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
      default:
        return 'bg-gradient-to-r from-app-blue to-app-blue-dark';
    }
  };

  return (
    <div className={`${getBackgroundClasses()} shadow-md header-safe-top pb-4 px-4`}>
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {showBackButton && canGoBack && (
            <button
              onClick={goBack}
              className="text-white hover:bg-white/10 rounded-lg p-2 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          
          <h1 className="font-bold text-white text-base truncate">
            {title}
          </h1>
        </div>
        
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {rightComponent}
          {showNetworkStatus && <NetworkStatusIndicator />}
        </div>
      </div>
    </div>
  );
};

export default Header;
