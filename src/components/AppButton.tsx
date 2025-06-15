
import React from 'react';
import { cn } from '@/lib/utils';

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'gray' | 'purple' | 'blue' | 'orange';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  gradient?: boolean;
}

const AppButton = ({ 
  children, 
  variant = 'gray', 
  fullWidth = false,
  size = 'md',
  gradient = false,
  className,
  ...props 
}: AppButtonProps) => {
  return (
    <button
      className={cn(
        "rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-md",
        size === 'sm' && "py-2 px-3 text-sm",
        size === 'md' && "py-3 px-6",
        size === 'lg' && "py-4 px-8 text-lg",
        variant === 'gray' && !gradient && "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200",
        variant === 'gray' && gradient && "bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 border border-gray-200",
        variant === 'purple' && !gradient && "bg-app-purple text-white hover:bg-purple-700 border border-purple-600",
        variant === 'purple' && gradient && "bg-gradient-to-r from-app-purple to-purple-700 hover:from-purple-700 hover:to-app-purple text-white border border-purple-600",
        variant === 'blue' && !gradient && "bg-app-blue text-white hover:bg-app-blue-dark border border-app-blue-dark",
        variant === 'blue' && gradient && "bg-gradient-to-r from-app-blue to-app-blue-dark hover:from-app-blue-dark hover:to-app-blue text-white border border-app-blue-dark",
        variant === 'orange' && !gradient && "bg-app-orange text-white hover:bg-orange-600 border border-orange-600",
        variant === 'orange' && gradient && "bg-gradient-to-r from-app-orange to-orange-600 hover:from-orange-600 hover:to-app-orange text-white border border-orange-600",
        fullWidth && "w-full",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default AppButton;
