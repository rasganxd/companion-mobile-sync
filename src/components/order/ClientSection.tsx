import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Users, Building2 } from 'lucide-react';

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
    <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300 animate-scale-in">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Label className="text-sm font-semibold text-gray-700 block mb-2 flex items-center gap-2">
              <Users size={16} className="text-blue-600" />
              Cliente:
            </Label>
            {selectedClient ? (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200 transition-all duration-200">
                <p className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  {selectedClient.name}
                </p>
                {selectedClient.company_name && selectedClient.company_name !== selectedClient.name && (
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <Building2 size={14} className="text-gray-400" />
                    {selectedClient.company_name}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-3 rounded-lg border border-gray-200 border-dashed transition-all duration-200">
                <p className="text-gray-500 italic text-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></span>
                  Nenhum cliente selecionado
                </p>
              </div>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onShowClientSelection} 
            className="ml-4 h-10 px-4 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
          >
            <Users size={16} className="mr-2" />
            {selectedClient ? 'Alterar' : 'Selecionar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientSection;
