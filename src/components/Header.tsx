
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  backgroundColor?: 'orange' | 'gray';
}

const Header = ({ title, showBackButton = false, backgroundColor = 'orange' }: HeaderProps) => {
  const navigate = useNavigate();
  
  const bgColor = backgroundColor === 'orange' ? 'bg-app-orange' : 'bg-app-gray-header';
  
  return (
    <div className={`w-full ${bgColor} py-4 px-4 flex items-center`}>
      {showBackButton && (
        <button 
          className="mr-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={24} color="black" />
        </button>
      )}
      <h1 className="text-black text-xl font-semibold flex-1 text-center">
        {title}
      </h1>
    </div>
  );
};

export default Header;
