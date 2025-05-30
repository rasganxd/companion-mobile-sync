
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  company_name?: string;
  sales_rep_id?: string;
}

interface ClientSectionProps {
  selectedClient: Client | null;
  onShowClientSelection: () => void;
}

const ClientSection: React.FC<ClientSectionProps> = ({
  selectedClient,
  onShowClientSelection
}) => {
  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Label className="text-sm font-medium text-gray-600 block">Cliente:</Label>
            {selectedClient ? (
              <div>
                <p className="font-semibold text-base text-gray-900">{selectedClient.name}</p>
                {selectedClient.company_name && selectedClient.company_name !== selectedClient.name && (
                  <p className="text-sm text-gray-600">{selectedClient.company_name}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic text-sm">Nenhum cliente selecionado</p>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onShowClientSelection} 
            className="ml-4 h-8 px-3"
          >
            <Users size={14} className="mr-1" />
            {selectedClient ? 'Alterar' : 'Selecionar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientSection;
