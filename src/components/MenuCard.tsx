
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MenuCardProps {
  icon: React.ReactNode;
  title: string;
  to: string;
  variant?: 'primary' | 'secondary';
  state?: any; // Adding the state prop to the interface
}

const MenuCard = ({ icon, title, to, variant = 'primary', state }: MenuCardProps) => {
  return (
    <Link
      to={to}
      state={state} // Pass the state to the Link component
      className={cn(
        "rounded-lg shadow p-4 flex flex-col items-center justify-center gap-2 min-h-[120px] transition-all",
        variant === 'primary' 
          ? "bg-white hover:bg-gray-100 border border-gray-200" 
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
    </Link>
  );
};

export default MenuCard;
