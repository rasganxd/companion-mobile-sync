
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ClientNegationConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  clientName: string;
  isLoading?: boolean;
}

const ClientNegationConfirmModal: React.FC<ClientNegationConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  clientName,
  isLoading = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Cliente Negativado
          </DialogTitle>
          <DialogDescription>
            ⚠️ O cliente <strong>{clientName}</strong> está negativado. 
            Deseja remover o status NEGATIVADO para criar um novo pedido?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <p className="text-sm text-orange-800">
                Esta ação irá alterar o status do cliente de "Negativado" para "Pendente" 
                e permitirá a criação de novos pedidos.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            NÃO
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? 'Processando...' : 'SIM'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClientNegationConfirmModal;
