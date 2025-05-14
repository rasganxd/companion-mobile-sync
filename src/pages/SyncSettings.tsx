
import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useSync } from '@/hooks/useSync';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ProgressIndicator } from '@/components/SyncComponents';
import { toast } from 'sonner';

const SyncSettings = () => {
  const navigate = useNavigate();
  const { 
    syncStatus, 
    syncSettings, 
    syncProgress,
    startSync,
    checkConnection, 
    updateSettings 
  } = useSync();
  
  const [lastSyncText, setLastSyncText] = useState<string>('Nunca');
  
  useEffect(() => {
    if (syncStatus.lastSync) {
      const date = new Date(syncStatus.lastSync);
      setLastSyncText(
        `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
      );
    }
  }, [syncStatus.lastSync]);

  const handleToggleAutoSync = async () => {
    await updateSettings({ autoSync: !syncSettings.autoSync });
  };

  const handleToggleWifiOnly = async () => {
    await updateSettings({ syncOnWifiOnly: !syncSettings.syncOnWifiOnly });
  };

  const handleToggleSyncEnabled = async () => {
    await updateSettings({ syncEnabled: !syncSettings.syncEnabled });
  };

  const handleSyncNow = async () => {
    if (syncStatus.inProgress) {
      toast.info("Sincronização já em andamento");
      return;
    }
    
    if (!syncStatus.connected) {
      const connected = await checkConnection();
      if (!connected) {
        toast.error("Sem conexão com o servidor");
        return;
      }
    }
    
    toast.info("Iniciando sincronização...");
    await startSync();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Sincronização" 
        showBackButton={true} 
        backgroundColor="blue" 
      />
      
      <div className="p-4 flex-1">
        {/* Status Card */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Status</h2>
            <div className="flex items-center">
              {syncStatus.connected ? (
                <Cloud size={20} className="text-green-500 mr-2" />
              ) : (
                <CloudOff size={20} className="text-red-500 mr-2" />
              )}
              <span className={syncStatus.connected ? "text-green-500" : "text-red-500"}>
                {syncStatus.connected ? "Conectado" : "Desconectado"}
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Última sincronização:</span>
              <span className="font-medium">{lastSyncText}</span>
            </div>
            
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Pendentes para envio:</span>
              <span className={syncStatus.pendingUploads > 0 ? "font-medium text-amber-600" : "font-medium"}>{syncStatus.pendingUploads}</span>
            </div>
            
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Pendentes para baixar:</span>
              <span className={syncStatus.pendingDownloads > 0 ? "font-medium text-amber-600" : "font-medium"}>{syncStatus.pendingDownloads}</span>
            </div>
          </div>
          
          {syncStatus.inProgress && syncProgress && (
            <div className="mt-2">
              <ProgressIndicator 
                progress={syncProgress} 
                type={syncProgress.type === 'upload' ? 'Enviando' : 'Baixando'} 
              />
            </div>
          )}
          
          <Button 
            onClick={handleSyncNow}
            disabled={syncStatus.inProgress}
            className="w-full mt-4"
            variant="default"
          >
            {syncStatus.inProgress ? (
              <>
                <RefreshCw size={16} className="animate-spin mr-2" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw size={16} className="mr-2" />
                Sincronizar Agora
              </>
            )}
          </Button>
        </div>
        
        {/* Settings Card */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Configurações</h2>
            <Settings size={20} className="text-gray-600" />
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium">Sincronização automática</div>
                <div className="text-sm text-gray-500">Sincronizar automaticamente em intervalos</div>
              </div>
              <Switch checked={syncSettings.autoSync} onCheckedChange={handleToggleAutoSync} />
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium">Apenas em Wi-Fi</div>
                <div className="text-sm text-gray-500">Sincronizar somente quando conectado em Wi-Fi</div>
              </div>
              <Switch checked={syncSettings.syncOnWifiOnly} onCheckedChange={handleToggleWifiOnly} />
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium">Sincronização ativa</div>
                <div className="text-sm text-gray-500">Ativar/desativar sincronização</div>
              </div>
              <Switch checked={syncSettings.syncEnabled} onCheckedChange={handleToggleSyncEnabled} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncSettings;
