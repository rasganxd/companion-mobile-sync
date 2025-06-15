import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, CheckCircle, AlertCircle, Wifi, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDataSync } from '@/hooks/useDataSync';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { toast } from 'sonner';

const InitialSyncScreen: React.FC = () => {
  const { salesRep, needsInitialSync } = useAuth();
  const { isSyncing, syncProgress, performFullSync, forceResync } = useDataSync();
  const { connected } = useNetworkStatus();
  const [syncCompleted, setSyncCompleted] = useState(false);

  const handleSync = async () => {
    if (!salesRep || !salesRep.sessionToken) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    if (!connected) {
      toast.error('Sem conexão com a internet');
      return;
    }

    try {
      const result = await performFullSync(salesRep.id, salesRep.sessionToken);
      
      if (result.success) {
        setSyncCompleted(true);
        const { syncedData } = result;
        toast.success(`Sincronização concluída! ${syncedData?.clients || 0} clientes, ${syncedData?.products || 0} produtos`);
      } else {
        toast.error('Falha na sincronização: ' + result.error);
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Erro durante a sincronização');
    }
  };

  const handleForceResync = async () => {
    if (!salesRep || !salesRep.sessionToken) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    if (!connected) {
      toast.error('Sem conexão com a internet');
      return;
    }

    try {
      const result = await forceResync(salesRep.id, salesRep.sessionToken);
      
      if (result.success) {
        setSyncCompleted(true);
        const { syncedData } = result;
        toast.success(`Ressincronização concluída! ${syncedData?.clients || 0} clientes, ${syncedData?.products || 0} produtos`);
      } else {
        toast.error('Falha na ressincronização: ' + result.error);
      }
    } catch (error) {
      console.error('Force resync error:', error);
      toast.error('Erro durante a ressincronização');
    }
  };

  const handleContinue = () => {
    window.location.href = '/home';
  };

  if (!needsInitialSync && !syncCompleted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {syncCompleted ? (
              <CheckCircle className="text-green-500" size={24} />
            ) : (
              <RefreshCw className={isSyncing ? 'animate-spin' : ''} size={24} />
            )}
            {syncCompleted ? 'Sincronização Concluída' : 'Sincronização Inicial'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!syncCompleted && (
            <>
              <p className="text-gray-600 text-sm">
                Para usar o aplicativo offline, é necessário sincronizar os dados iniciais.
              </p>

              {!connected && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertCircle className="text-red-500" size={16} />
                  <span className="text-red-700 text-sm">
                    Sem conexão com a internet
                  </span>
                </div>
              )}

              {connected && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <Wifi className="text-green-500" size={16} />
                  <span className="text-green-700 text-sm">
                    Conectado à internet
                  </span>
                </div>
              )}
            </>
          )}

          {isSyncing && syncProgress && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">{syncProgress.stage}</p>
              <Progress value={syncProgress.percentage} />
              <p className="text-xs text-gray-500 text-center">
                {syncProgress.percentage}% concluído
              </p>
            </div>
          )}

          {syncCompleted && (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-700 text-sm font-medium">
                  ✅ Dados sincronizados com sucesso!
                </p>
                <p className="text-green-600 text-xs mt-1">
                  O aplicativo agora pode funcionar offline.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {!syncCompleted && (
              <>
                <Button
                  onClick={handleSync}
                  disabled={isSyncing || !connected}
                  className="w-full"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw size={16} className="animate-spin mr-2" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} className="mr-2" />
                      Iniciar Sincronização
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleForceResync}
                  disabled={isSyncing || !connected}
                  variant="outline"
                  className="w-full"
                >
                  <Trash2 size={16} className="mr-2" />
                  Forçar Nova Sincronização
                </Button>
              </>
            )}

            {syncCompleted && (
              <Button onClick={handleContinue} className="w-full">
                Continuar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InitialSyncScreen;
