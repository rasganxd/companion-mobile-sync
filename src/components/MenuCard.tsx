
import React from 'react';
import { useAppNavigation } from '@/hooks/useAppNavigation';

interface MenuCardProps {
  icon: React.ReactNode;
  title: string;
  to: string;
  state?: any;
}

const MenuCard = ({ icon, title, to, state }: MenuCardProps) => {
  const { navigateTo } = useAppNavigation();

  const handleClick = () => {
    if (state) {
      // Se há estado, usar navigate do React Router diretamente para passar o state
      navigateTo(to, state);
    } else {
      navigateTo(to);
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-shadow duration-200 aspect-square min-h-[120px]"
      onClick={handleClick}
    >
      <div className="text-blue-600 mb-3">
        {icon}
      </div>
      <span className="text-sm font-medium text-gray-800 text-center leading-tight">
        {title}
      </span>
    </div>
  );
};

export default MenuCard;
