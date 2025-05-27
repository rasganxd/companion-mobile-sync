
import React from 'react';
import { cn } from '@/lib/utils';
import { useNavigation } from '@/contexts/NavigationContext';

interface MenuCardProps {
  icon: React.ReactNode;
  title: string;
  to: string;
  variant?: 'primary' | 'secondary';
  state?: any;
}

const MenuCard = ({ icon, title, to, variant = 'primary', state }: MenuCardProps) => {
  const { navigateTo } = useNavigation();
  
  const handleClick = () => {
    console.log(`🎯 MenuCard clicked: ${title} -> ${to}`);
    navigateTo(to);
  };
  
  return (
    <div
      onClick={handleClick}
      className={cn(
        "rounded-lg shadow p-4 flex flex-col items-center justify-center gap-2 min-h-[120px] transition-all cursor-pointer",
        variant === 'primary' 
          ? "bg-white hover:bg-gray-100 border border-gray-200 hover:shadow-md" 
          : "bg-app-blue text-white hover:bg-app-blue-dark border border-app-blue-dark"
      )}
    >
      <div className="w-12 h-12 flex items-center justify-center">
        {icon}
      </div>
      <span className={cn(
        "text-center font-medium",
        variant === 'secondary' && "text-white"
      )}>
        {title}
      </span>
    </div>
  );
};

export default MenuCard;
