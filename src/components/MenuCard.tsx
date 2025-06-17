
import React from 'react';
import { useNavigation } from '@/contexts/NavigationContext';
import { useNavigate } from 'react-router-dom';

interface MenuCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  to?: string;
  route?: string;
  state?: any;
  onClick?: () => void;
}

const MenuCard = ({ icon, title, description, color, to, route, state, onClick }: MenuCardProps) => {
  const { navigateTo: contextNavigateTo } = useNavigation();
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (state) {
      // Se há estado, usar navigate do React Router para passar o state
      navigate(to || route || '#', { state });
    } else {
      // Caso contrário, usar nosso contexto de navegação
      contextNavigateTo(to || route || '#');
    }
  };

  // Color classes mapping
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
    red: 'text-red-600',
    gray: 'text-gray-600',
    indigo: 'text-indigo-600'
  };

  const iconColorClass = colorClasses[color as keyof typeof colorClasses] || 'text-blue-600';

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-shadow duration-200 aspect-square min-h-[120px]"
      onClick={handleClick}
    >
      <div className={`mb-3 ${iconColorClass}`}>
        {icon}
      </div>
      <span className="text-sm font-medium text-gray-800 text-center leading-tight mb-1">
        {title}
      </span>
      <span className="text-xs text-gray-500 text-center leading-tight">
        {description}
      </span>
    </div>
  );
};

export default MenuCard;
