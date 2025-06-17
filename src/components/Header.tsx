
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  backgroundColor?: 'blue' | 'green' | 'red' | 'gray';
  rightComponent?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  showBackButton = false, 
  backgroundColor = 'blue',
  rightComponent 
}) => {
  const { goBack } = useNavigation();

  const handleBackClick = () => {
    console.log('🔙 Header - Back button clicked from:', title);
    goBack();
  };

  const bgColorClass = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    gray: 'bg-gray-600'
  }[backgroundColor];

  return (
    <header className={`${bgColorClass} text-white px-4 py-3 flex items-center justify-between`}>
      <div className="flex items-center">
        {showBackButton && (
          <button 
            onClick={handleBackClick}
            className="mr-3 p-1 hover:bg-white/20 rounded"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      {rightComponent && (
        <div className="flex items-center">
          {rightComponent}
        </div>
      )}
    </header>
  );
};

export default Header;
