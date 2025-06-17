
import React from 'react';
import { cn } from '@/lib/utils';

interface SafeAreaContainerProps {
  children: React.ReactNode;
  className?: string;
  applyTop?: boolean;
  applyBottom?: boolean;
  applySides?: boolean;
  asHeader?: boolean;
}

const SafeAreaContainer: React.FC<SafeAreaContainerProps> = ({
  children,
  className,
  applyTop = false,
  applyBottom = false,
  applySides = false,
  asHeader = false
}) => {
  const getSafeAreaClasses = () => {
    const classes = [];
    
    if (asHeader) {
      classes.push('header-safe-top');
    } else if (applyTop) {
      classes.push('safe-area-top');
    }
    
    if (applyBottom) {
      classes.push('safe-area-bottom');
    }
    
    if (applySides) {
      classes.push('safe-area-x');
    }
    
    return classes.join(' ');
  };

  return (
    <div className={cn(getSafeAreaClasses(), className)}>
      {children}
    </div>
  );
};

export default SafeAreaContainer;
