
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDataCleanup } from '@/hooks/useDataCleanup';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

interface DataCleanupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCleanupComplete?: () => void;
}

export const DataCleanupDialog: React.FC<DataCleanupDialogProps> = ({
  isOpen,
  onClose,
  onCleanupComplete
}) => {
  const { isCleaningData, performDataCleanup } = useDataCleanup();
  const { salesRep } = useAuth();
  const [cleanupResult, setCleanupResult] = useState<any>(null);

  const handleCleanup = async () => {
    if (!salesRep?.id || !salesRep?.sessionToken) {
      return;
    }

    const result = await performDataCleanup(salesRep.id, salesRep.sessionToken);
    setCleanupResult(result);
    
    if (result.success && onCleanupComplete) {
      setTimeout(() => {
        onCleanupComplete();
        onClose();
      }, 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 size={20} className="text-orange-500" />
            Limpeza de Dados
          </DialogTitle>
          <DialogDescription>
            Esta operação irá limpar todos os dados locais e buscar dados atualizados do servidor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> Esta operação irá:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Remover todos os dados locais</li>
                <li>Buscar dados atualizados do Supabase</li>
                <li>Corrigir inconsistências de sincronização</li>
                <li>Remover dados duplicados ou inválidos</li>
              </ul>
            </AlertDescription>
          </Alert>

          {cleanupResult && (
            <Alert className={cleanupResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <CheckCircle className={`h-4 w-4 ${cleanupResult.success ? "text-green-600" : "text-red-600"}`} />
              <AlertDescription>
                {cleanupResult.success ? (
                  <div>
                    <strong>Limpeza concluída com sucesso!</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Dados removidos: {cleanupResult.clientsRemoved} clientes, {cleanupResult.productsRemoved} produtos</li>
                      <li>Dados do Supabase: {cleanupResult.clientsFromSupabase} clientes</li>
                      <li>Salvos localmente: {cleanupResult.clientsSavedLocally} clientes</li>
                      {cleanupResult.duplicatesFound > 0 && (
                        <li>Duplicatas removidas: {cleanupResult.duplicatesFound}</li>
                      )}
                    </ul>
                  </div>
                ) : (
                  <div>
                    <strong>Erro durante a limpeza:</strong>
                    <p className="mt-1">{cleanupResult.error}</p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleCleanup}
              disabled={isCleaningData || !salesRep?.sessionToken}
              className="flex-1"
              variant="destructive"
            >
              {isCleaningData ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Limpando dados...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Iniciar Limpeza
                </>
              )}
            </Button>
            
            <Button 
              onClick={onClose} 
              variant="outline"
              disabled={isCleaningData}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
