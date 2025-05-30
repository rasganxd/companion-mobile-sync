
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { User, Building } from 'lucide-react';

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
        <Label className="text-sm font-medium text-gray-600 block mb-2">Cliente:</Label>
        {selectedClient ? (
          <div 
            className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3 cursor-pointer hover:bg-blue-100 transition-colors"
            onClick={onShowClientSelection}
          >
            <div className="flex items-center gap-3">
              {selectedClient.company_name ? (
                <Building size={20} className="text-blue-600" />
              ) : (
                <User size={20} className="text-blue-600" />
              )}
              <div>
                <p className="font-medium text-blue-900">
                  {selectedClient.company_name || selectedClient.name}
                </p>
                {selectedClient.company_name && (
                  <p className="text-sm text-blue-700">{selectedClient.name}</p>
                )}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-blue-600 hover:bg-blue-200"
            >
              Alterar
            </Button>
          </div>
        ) : (
          <Button 
            onClick={onShowClientSelection}
            variant="outline"
            className="w-full h-12 border-dashed border-2 border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600"
          >
            <User size={20} className="mr-2" />
            Selecionar Cliente
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientSection;
