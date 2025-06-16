
import React from 'react';
import Header from '@/components/Header';
import MobileDebugPanel from '@/components/MobileDebugPanel';
import { useAppNavigation } from '@/hooks/useAppNavigation';

const MobileDebugPage = () => {
  const { goBack } = useAppNavigation();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Mobile Debug" 
        showBackButton 
        backgroundColor="blue"
      />
      
      <div className="flex-1 p-4 flex items-center justify-center">
        <MobileDebugPanel />
      </div>
    </div>
  );
};

export default MobileDebugPage;
