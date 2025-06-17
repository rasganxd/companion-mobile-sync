
import React from 'react';
import Header from '@/components/Header';

interface ClientsAuthLoadingProps {
  day: string;
}

const ClientsAuthLoading: React.FC<ClientsAuthLoadingProps> = ({ day }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col">
    <Header title={`Clientes de ${day}`} showBackButton backgroundColor="blue" />
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <div className="text-lg">Verificando autenticação...</div>
      </div>
    </div>
  </div>
);

export default ClientsAuthLoading;
