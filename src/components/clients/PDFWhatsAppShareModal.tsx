
import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import AppButton from '@/components/AppButton';

interface PDFWhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (phoneNumber?: string) => void;
  clientName: string;
  isLoading?: boolean;
}

const PDFWhatsAppShareModal: React.FC<PDFWhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  clientName,
  isLoading = false
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleConfirm = () => {
    onConfirm(phoneNumber.trim() || undefined);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    
    // Formatar como telefone brasileiro
    if (value.length <= 11) {
      if (value.length > 6) {
        value = value.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
      } else if (value.length > 2) {
        value = value.replace(/(\d{2})(\d+)/, '($1) $2');
      }
    }
    
    setPhoneNumber(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-green-600" />
            Enviar PDF via WhatsApp
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Cliente:</p>
            <p className="font-medium">{clientName}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número do WhatsApp (opcional)
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="(11) 99999-9999"
              maxLength={15}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Se não informar, abrirá o WhatsApp Web para escolher o contato
            </p>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              📄 Será gerado um PDF com os dados do pedido e itens para compartilhamento
            </p>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <AppButton
            variant="gray"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancelar
          </AppButton>
          <AppButton
            variant="blue"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Gerando...' : 'Enviar PDF'}
          </AppButton>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFWhatsAppShareModal;
