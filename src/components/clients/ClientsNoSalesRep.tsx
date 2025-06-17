
import React from 'react';
import Header from '@/components/Header';

interface ClientsNoSalesRepProps {
  day: string;
}

const ClientsNoSalesRep: React.FC<ClientsNoSalesRepProps> = ({ day }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col">
    <Header title={`Clientes de ${day}`} showBackButton backgroundColor="blue" />
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <div className="text-lg">Vendedor não autenticado</div>
        <div className="text-sm mt-2">Faça a primeira sincronização para continuar</div>
      </div>
    </div>
  </div>
);

export default ClientsNoSalesRep;
