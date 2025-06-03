
import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, Settings, Database, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useSync } from '@/hooks/useSync';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const SyncSettings = () => {
  const navigate = useNavigate();
  const { 
    syncStatus, 
    syncSettings, 
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Sincronização" 
        showBackButton={true} 
        backgroundColor="blue" 
      />
      
      <div className="p-4 flex-1">
        {/* Sync Method Card */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-semibold mb-4">Método de Sincronização</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200">
              <div className="flex-1">
                <div className="font-medium text-green-700">
                  <CheckCircle size={16} className="inline mr-2" />
                  Supabase Integrado
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Sincronização direta via Supabase - sempre ativo
                </div>
              </div>
            </div>
            
            <div className="pl-4 border-l-2 border-green-200">
              <div className="text-sm text-gray-600 mb-2">
                ✅ Mobile envia pedidos para o banco compartilhado<br/>
                ✅ Desktop importa pedidos do banco compartilhado<br/>
                ✅ Atualizações de produtos e clientes sincronizadas automaticamente
              </div>
              <Button 
                onClick={() => navigate('/supabase-sync')}
                className="w-full bg-green-600 hover:bg-green-700 mt-2"
              >
                <Database size={16} className="mr-2" />
                Abrir Sincronização Supabase
              </Button>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Status da Sincronização</h2>
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
              <span className="text-gray-600">Pedidos para enviar:</span>
              <span className={syncStatus.pendingUploads > 0 ? "font-medium text-amber-600" : "font-medium"}>{syncStatus.pendingUploads}</span>
            </div>
            
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Atualizações disponíveis:</span>
              <span className={syncStatus.pendingDownloads > 0 ? "font-medium text-amber-600" : "font-medium"}>{syncStatus.pendingDownloads}</span>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <div className="flex items-center">
              <Clock size={20} className="text-blue-500 mr-2" />
              <span className="text-blue-700 text-sm">
                Sincronização automática via Supabase - sem necessidade de configuração manual
              </span>
            </div>
          </div>
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
