
import React from 'react';
import Header from '@/components/Header';

const LoadingState = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col">
    <Header title="Rotas de Visita" showBackButton backgroundColor="blue" />
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <div className="text-lg">Carregando rotas...</div>
      </div>
    </div>
  </div>
);

export default LoadingState;
