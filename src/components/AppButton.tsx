
import React from 'react';
import { cn } from '@/lib/utils';

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'gray' | 'purple' | 'blue' | 'orange';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const AppButton = ({ 
  children, 
  variant = 'gray', 
  fullWidth = false,
  size = 'md',
  className,
  ...props 
}: AppButtonProps) => {
  return (
    <button
      className={cn(
        "rounded-lg font-medium transition-colors shadow-sm",
        size === 'sm' && "py-2 px-3 text-sm",
        size === 'md' && "py-3 px-6",
        size === 'lg' && "py-4 px-8 text-lg",
        variant === 'gray' && "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200",
        variant === 'purple' && "bg-app-purple text-white hover:bg-purple-700 border border-purple-600",
        variant === 'blue' && "bg-app-blue text-white hover:bg-app-blue-dark border border-app-blue-dark",
        variant === 'orange' && "bg-app-orange text-white hover:bg-orange-600 border border-orange-600",
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default AppButton;
