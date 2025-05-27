
import React from 'react';
import AppButton from '@/components/AppButton';

interface Client {
  id: string;
  name: string;
  company_name?: string;
  code?: number;
}

interface ClientInfoBarProps {
  selectedClient: Client;
  onClientSearch: () => void;
}

const ClientInfoBar: React.FC<ClientInfoBarProps> = ({
  selectedClient,
  onClientSearch
}) => {
  return (
    <div className="bg-app-blue text-white px-3 py-1 text-sm">
      {selectedClient.id ? (
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <span className="font-semibold">{selectedClient.code || 'S/N'}</span> - {selectedClient.company_name || selectedClient.name}
          </div>
          <AppButton 
            variant="gray" 
            className="text-xs px-2 py-0.5 h-5 border-white text-app-blue bg-white hover:bg-gray-100"
            onClick={onClientSearch}
          >
            Alterar
          </AppButton>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className="text-yellow-200">Nenhum cliente selecionado</span>
          <AppButton 
            variant="gray" 
            className="text-xs px-2 py-0.5 h-5 border-yellow-200 text-app-blue bg-yellow-200 hover:bg-yellow-100"
            onClick={onClientSearch}
          >
            Selecionar Cliente
          </AppButton>
        </div>
      )}
    </div>
  );
};

export default ClientInfoBar;
