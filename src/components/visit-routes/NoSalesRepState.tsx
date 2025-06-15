
import React from 'react';
import Header from '@/components/Header';

const NoSalesRepState = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col">
    <Header title="Rotas de Visita" showBackButton backgroundColor="blue" />
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <div className="text-lg">Vendedor não autenticado</div>
        <div className="text-sm mt-2">Faça a primeira sincronização para continuar</div>
      </div>
    </div>
  </div>
);

export default NoSalesRepState;
