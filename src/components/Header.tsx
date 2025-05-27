
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  backgroundColor?: 'orange' | 'gray' | 'blue' | 'green';
}

const Header = ({ title, showBackButton = false, backgroundColor = 'blue' }: HeaderProps) => {
  const navigate = useNavigate();
  
  const getBgColor = () => {
    switch (backgroundColor) {
      case 'orange': 
        return 'bg-app-orange';
      case 'gray': 
        return 'bg-slate-200';
      case 'green':
        return 'bg-green-600';
      case 'blue':
      default:
        return 'bg-gradient-to-r from-app-blue to-app-blue-dark';
    }
  };
  
  return (
    <div className={`w-full ${getBgColor()} py-4 px-4 flex items-center shadow-md`}>
      {showBackButton && (
        <button 
          className="mr-2 bg-white bg-opacity-20 rounded-full p-1"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={24} color="white" />
        </button>
      )}
      <h1 className="text-white text-xl font-semibold flex-1 text-center">
        {title}
      </h1>
    </div>
  );
};

export default Header;
