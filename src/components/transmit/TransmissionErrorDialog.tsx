
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface TransmissionErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  error: string;
  onRetry: () => void;
  isRetrying: boolean;
}

const TransmissionErrorDialog: React.FC<TransmissionErrorDialogProps> = ({
  isOpen,
  onClose,
  error,
  onRetry,
  isRetrying
}) => {
  const getErrorMessage = (error: string) => {
    if (error.includes('Sales representative not found')) {
      return {
        title: 'Erro de Autenticação',
        message: 'Sua conta não está vinculada a um vendedor válido. Entre em contato com o administrador do sistema.',
        canRetry: false
      };
    }
    
    if (error.includes('Network Error') || error.includes('Failed to fetch')) {
      return {
        title: 'Erro de Conexão',
        message: 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.',
        canRetry: true
      };
    }
    
    if (error.includes('Invalid authentication')) {
      return {
        title: 'Erro de Autenticação',
        message: 'Sua sessão expirou. Faça login novamente.',
        canRetry: false
      };
    }
    
    return {
      title: 'Erro na Transmissão',
      message: error || 'Ocorreu um erro inesperado durante a transmissão dos pedidos.',
      canRetry: true
    };
  };

  const errorInfo = getErrorMessage(error);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <DialogTitle className="text-red-700">{errorInfo.title}</DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 mt-2">
            {errorInfo.message}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Fechar
          </Button>
          
          {errorInfo.canRetry && (
            <Button 
              onClick={onRetry} 
              disabled={isRetrying}
              className="flex-1"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Tentando...
                </>
              ) : (
                'Tentar Novamente'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransmissionErrorDialog;
