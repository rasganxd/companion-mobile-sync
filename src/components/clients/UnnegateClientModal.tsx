
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface UnnegateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  clientName: string;
  isLoading?: boolean;
}

const UnnegateClientModal: React.FC<UnnegateClientModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  clientName,
  isLoading = false
}) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Desnegativar Cliente
          </DialogTitle>
          <DialogDescription>
            Você está prestes a reativar o cliente <strong>{clientName}</strong>.
            Esta ação permitirá que novos pedidos sejam criados para este cliente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Esta ação irá alterar o status do cliente de "Negativado" para "Pendente"
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da reativação:</Label>
            <Textarea 
              id="reason"
              placeholder="Ex: Cliente regularizou situação, pagamento efetuado, etc..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isLoading || !reason.trim()}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Processando...' : 'Confirmar Reativação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UnnegateClientModal;
