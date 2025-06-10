import React from 'react';
import { Button } from '@/components/ui/button';
interface Client {
  id: string;
  name: string;
  company_name?: string;
}
interface NewOrderClientInfoProps {
  selectedClient: Client | null;
  onShowClientSelection: () => void;
}
const NewOrderClientInfo: React.FC<NewOrderClientInfoProps> = ({
  selectedClient,
  onShowClientSelection
}) => {
  if (selectedClient) {
    return <div className="bg-blue-600 text-white px-4 py-2 text-sm">
        <div className="flex items-center justify-between">
          <div>
             - {selectedClient.company_name || selectedClient.name}
          </div>
          <Button variant="ghost" onClick={onShowClientSelection} className="text-white hover:bg-blue-700 text-xs px-2 py-1 h-6">
            Alterar
          </Button>
        </div>
      </div>;
  }
  return <div className="border-l-4 border-yellow-500 p-4 py-0 bg-sky-500">
      <div className="flex items-center justify-between bg-sky-500 py-[3px]">
        <span className="text-zinc-950 text-sm">Nenhum cliente selecionado</span>
        <Button onClick={onShowClientSelection} className="text-white text-xs bg-sky-800 hover:bg-sky-700 py-px font-normal">
          Selecionar Cliente
        </Button>
      </div>
    </div>;
};
export default NewOrderClientInfo;