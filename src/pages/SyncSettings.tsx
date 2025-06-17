import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Trash2, Download, Upload, Database, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDataSync } from '@/hooks/useDataSync';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { toast } from 'sonner';

const SyncSettings: React.FC = () => {
  const { salesRep, sessionToken, isOnline, lastSyncDate } = useAuth();
  const { isSyncing, syncProgress, performFullSync, forceResync } = useDataSync();
  const { connected } = useNetworkStatus();
  const [syncStats, setSyncStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const loadSyncStats = async () => {
    setIsLoadingStats(true);
    try {
      // Implementar lógica para carregar estatísticas de sincronização
      setSyncStats({
        lastSyncDate: lastSyncDate ? lastSyncDate.toLocaleDateString() : 'Nunca',
        isOnline: isOnline,
        pendingItems: 0, // Substituir por lógica real
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas de sincronização:', error);
      toast.error('Erro ao carregar estatísticas de sincronização');
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    loadSyncStats();
  }, [isOnline, lastSyncDate]);

  const handleFullSync = async () => {
    if (!salesRep || !sessionToken) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    if (!connected) {
      toast.error('Sem conexão com a internet');
      return;
    }

    try {
      const result = await performFullSync(salesRep.id, sessionToken);
      
      if (result.success) {
        const { syncedData } = result;
        toast.success(`Sincronização concluída! ${syncedData?.clients || 0} clientes, ${syncedData?.products || 0} produtos`);
        await loadSyncStats();
      } else {
        toast.error('Falha na sincronização: ' + result.error);
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Erro durante a sincronização');
    }
  };

  const handleForceResync = async () => {
    if (!salesRep || !sessionToken) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    if (!connected) {
      toast.error('Sem conexão com a internet');
      return;
    }

    if (!confirm('Isso irá apagar todos os dados locais e recarregar do servidor. Continuar?')) {
      return;
    }

    try {
      const result = await forceResync(salesRep.id, sessionToken);
      
      if (result.success) {
        const { syncedData } = result;
        toast.success(`Ressincronização concluída! ${syncedData?.clients || 0} clientes, ${syncedData?.products || 0} produtos`);
        await loadSyncStats();
      } else {
        toast.error('Falha na ressincronização: ' + result.error);
      }
    } catch (error) {
      console.error('Force resync error:', error);
      toast.error('Erro durante a ressincronização');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="text-gray-500" size={24} />
            Configurações de Sincronização
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-gray-600 text-sm">
              Gerencie a sincronização de dados do aplicativo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardHeader className="space-y-1">
                <CardTitle className="text-sm font-medium">
                  Status da Conexão
                </CardTitle>
              </CardHeader>
              <CardContent>
                {connected ? (
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    <Wifi className="mr-2 h-4 w-4" />
                    Online
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-100 text-red-800">
                    <WifiOff className="mr-2 h-4 w-4" />
                    Offline
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="space-y-1">
                <CardTitle className="text-sm font-medium">
                  Última Sincronização
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <p className="text-sm text-gray-500">Carregando...</p>
                ) : (
                  <p className="text-sm text-gray-500">
                    {syncStats?.lastSyncDate || 'Nunca sincronizado'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleFullSync}
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
                  Sincronizar Dados
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
              Forçar Ressincronização
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SyncSettings;
