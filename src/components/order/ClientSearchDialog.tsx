
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface Client {
  id: string;
  name: string;
  company_name?: string;
  code?: number;
}

interface ClientSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filteredClients: Client[];
  onSelectClient: (client: Client) => void;
}

const ClientSearchDialog: React.FC<ClientSearchDialogProps> = ({
  open,
  onOpenChange,
  searchQuery,
  onSearchChange,
  filteredClients,
  onSelectClient
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Consultar Clientes</DialogTitle>
        </DialogHeader>
        <Command className="rounded-lg border shadow-md">
          <CommandInput 
            placeholder="Digite o nome do cliente..." 
            value={searchQuery}
            onValueChange={onSearchChange}
          />
          <CommandList>
            <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
            <CommandGroup heading="Clientes">
              {filteredClients.map((client) => (
                <CommandItem
                  key={client.id}
                  onSelect={() => onSelectClient(client)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{client.name}</span>
                    <span className="text-sm text-gray-500">{client.company_name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default ClientSearchDialog;
