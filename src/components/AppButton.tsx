
import React from 'react';
import { cn } from '@/lib/utils';

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'gray' | 'purple';
  fullWidth?: boolean;
}

const AppButton = ({ 
  children, 
  variant = 'gray', 
  fullWidth = false,
  className,
  ...props 
}: AppButtonProps) => {
  return (
    <button
      className={cn(
        "py-3 px-6 rounded border border-gray-300 font-medium transition-colors",
        variant === 'gray' && "bg-app-gray-button text-black hover:bg-gray-300",
        variant === 'purple' && "bg-app-purple text-white hover:bg-purple-700",
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
