
import React from 'react';
import { Link } from 'react-router-dom';

interface MenuCardProps {
  icon: React.ReactNode;
  title: string;
  to: string;
}

const MenuCard = ({ icon, title, to }: MenuCardProps) => {
  return (
    <Link
      to={to}
      className="bg-app-gray-button border border-gray-300 rounded p-4 flex flex-col items-center justify-center gap-2 min-h-[120px] hover:bg-gray-300 transition-colors"
    >
      <div className="w-12 h-12 flex items-center justify-center">
        {icon}
      </div>
      <span className="text-center font-medium">{title}</span>
    </Link>
  );
};

export default MenuCard;
