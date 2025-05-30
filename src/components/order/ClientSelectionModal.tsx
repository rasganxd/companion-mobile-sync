
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Client {
  id: string;
  name: string;
  company_name?: string;
  sales_rep_id?: string;
}

interface ClientSelectionModalProps {
  showClientSelection: boolean;
  clientSearchTerm: string;
  filteredClients: Client[];
  onClose: () => void;
  onSearchChange: (value: string) => void;
  onSelectClient: (client: Client) => void;
}

const ClientSelectionModal: React.FC<ClientSelectionModalProps> = ({
  showClientSelection,
  clientSearchTerm,
  filteredClients,
  onClose,
  onSearchChange,
  onSelectClient
}) => {
  if (!showClientSelection) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Selecionar Cliente</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClose}
            >
              ✕
            </Button>
          </div>
          <Input 
            placeholder="Buscar cliente..." 
            value={clientSearchTerm} 
            onChange={(e) => onSearchChange(e.target.value)} 
          />
        </div>
        <div className="overflow-y-auto max-h-96">
          {filteredClients.map(client => (
            <div 
              key={client.id} 
              className="p-3 border-b hover:bg-gray-50 cursor-pointer" 
              onClick={() => onSelectClient(client)}
            >
              <p className="font-medium">{client.name}</p>
              {client.company_name && client.company_name !== client.name && (
                <p className="text-sm text-gray-600">{client.company_name}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientSelectionModal;
