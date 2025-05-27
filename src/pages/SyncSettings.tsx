
import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, Settings, QrCode, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
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
    initError,
    activeUpdate,
    checkingUpdates,
    startSync,
    checkConnection, 
    updateSettings,
    checkForUpdates
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

  // Check for updates on component mount
  useEffect(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  const handleToggleAutoSync = async () => {
    await updateSettings({ autoSync: !syncSettings.autoSync });
  };

  const handleToggleWifiOnly = async () => {
    await updateSettings({ syncOnWifiOnly: !syncSettings.syncOnWifiOnly });
  };

  const handleToggleSyncEnabled = async () => {
    await updateSettings({ syncEnabled: !syncSettings.syncEnabled });
  };

  const handleCheckUpdates = async () => {
    const update = await checkForUpdates();
    if (update) {
      toast.success("Atualização disponível!");
    } else {
      toast.info("Nenhuma atualização disponível");
    }
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
    
    if (!activeUpdate) {
      toast.info("Nenhuma atualização disponível para sincronizar");
      return;
    }
    
    toast.info("Iniciando sincronização...");
    const success = await startSync();
    
    if (success) {
      toast.success("Sincronização concluída com sucesso");
    } else {
      toast.error("Erro na sincronização");
    }
  };

  const formatUpdateDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Sincronização" 
        showBackButton={true} 
        backgroundColor="blue" 
      />
      
      <div className="p-4 flex-1">
        {/* Error Card */}
        {initError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <AlertTriangle size={20} className="text-red-500 mr-2" />
              <h3 className="text-red-800 font-medium">Erro de Inicialização</h3>
            </div>
            <p className="text-red-700 text-sm mt-1">{initError}</p>
            <p className="text-red-600 text-xs mt-2">
              O app está usando armazenamento web como fallback. 
              Para dispositivos móveis, certifique-se de que o Capacitor SQLite esteja configurado corretamente.
            </p>
          </div>
        )}

        {/* Update Status Card */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Atualizações</h2>
            <Button 
              onClick={handleCheckUpdates}
              disabled={checkingUpdates}
              variant="outline"
              size="sm"
            >
              {checkingUpdates ? (
                <>
                  <RefreshCw size={16} className="animate-spin mr-2" />
                  Verificando...
                </>
              ) : (
                <>
                  <RefreshCw size={16} className="mr-2" />
                  Verificar
                </>
              )}
            </Button>
          </div>
          
          {activeUpdate ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <CheckCircle size={20} className="text-green-500 mr-2" />
                <span className="font-medium text-green-800">Atualização Disponível</span>
              </div>
              <div className="text-sm text-green-700">
                <p><strong>Descrição:</strong> {activeUpdate.description || 'Atualização de dados'}</p>
                <p><strong>Tipos:</strong> {activeUpdate.data_types.join(', ')}</p>
                <p><strong>Criada em:</strong> {formatUpdateDate(activeUpdate.created_at)}</p>
                {activeUpdate.created_by_user && (
                  <p><strong>Criada por:</strong> {activeUpdate.created_by_user}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center">
                <Clock size={20} className="text-gray-500 mr-2" />
                <span className="text-gray-700">Nenhuma atualização disponível</span>
              </div>
            </div>
          )}
        </div>

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
            disabled={syncStatus.inProgress || !activeUpdate}
            className="w-full mt-4"
            variant="default"
          >
            {syncStatus.inProgress ? (
              <>
                <RefreshCw size={16} className="animate-spin mr-2" />
                Sincronizando...
              </>
            ) : !activeUpdate ? (
              <>
                <RefreshCw size={16} className="mr-2" />
                Nenhuma Atualização Disponível
              </>
            ) : (
              <>
                <RefreshCw size={16} className="mr-2" />
                Sincronizar Agora
              </>
            )}
          </Button>
          
          <Button 
            onClick={() => navigate('/qr-scanner')}
            className="w-full mt-2"
            variant="outline"
          >
            <QrCode size={16} className="mr-2" />
            Escanear QR para Atualizar
          </Button>
          
          <Button 
            onClick={() => navigate('/api-settings')}
            className="w-full mt-2"
            variant="outline"
          >
            <Settings size={16} className="mr-2" />
            Configurar API REST
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
