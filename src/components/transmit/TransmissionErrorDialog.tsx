
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, LogIn } from 'lucide-react';
import { translateError } from '@/utils/errorTranslator';

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
    // Primeiro, traduz o erro para português
    const translatedError = translateError(error);
    
    // Depois categoriza baseado no erro traduzido
    if (translatedError.includes('Sessão expirada') || translatedError.includes('Token de sessão expirado')) {
      return {
        title: 'Sessão Expirada',
        message: 'Sua sessão expirou. Faça login novamente para continuar.',
        canRetry: false,
        needsLogin: true
      };
    }
    
    if (translatedError.includes('Erro de autenticação') || translatedError.includes('Não autorizado')) {
      return {
        title: 'Erro de Autenticação',
        message: 'Sua autenticação não é válida. Faça login novamente.',
        canRetry: false,
        needsLogin: true
      };
    }
    
    if (translatedError.includes('Vendedor não encontrado') || translatedError.includes('Vendedor não identificado')) {
      return {
        title: 'Erro de Conta',
        message: 'Sua conta não está vinculada a um vendedor válido. Entre em contato com o administrador do sistema.',
        canRetry: false,
        needsLogin: false
      };
    }
    
    if (translatedError.includes('Erro de conexão') || translatedError.includes('Falha na conexão')) {
      return {
        title: 'Erro de Conexão',
        message: 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.',
        canRetry: true,
        needsLogin: false
      };
    }
    
    return {
      title: 'Erro na Transmissão',
      message: translatedError || 'Ocorreu um erro inesperado durante a transmissão dos pedidos.',
      canRetry: true,
      needsLogin: false
    };
  };

  const errorInfo = getErrorMessage(error);

  const handleLoginRedirect = () => {
    window.location.href = '/login';
  };

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
          
          {errorInfo.needsLogin ? (
            <Button 
              onClick={handleLoginRedirect} 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Fazer Login
            </Button>
          ) : errorInfo.canRetry ? (
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
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransmissionErrorDialog;
