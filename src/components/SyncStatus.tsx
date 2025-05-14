
import React, { useEffect, useState } from 'react';
import { RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useConnectionStore, ConnectionStatus } from '@/lib/sync/connectionStatus';
import { getLocalSyncLogs, fullSync } from '@/lib/sync/syncService';
import { toast } from 'sonner';

interface SyncStatusProps {
  token: string;
  salesRepId: string;
  onSync?: () => void;
  showFullStatus?: boolean;
}

export default function SyncStatus({ 
  token, 
  salesRepId, 
  onSync, 
  showFullStatus = false 
}: SyncStatusProps) {
  const { status } = useConnectionStore();
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  
  // Load last sync date from logs
  useEffect(() => {
    loadSyncLogs();
  }, []);
  
  const loadSyncLogs = async () => {
    try {
      const logs = await getLocalSyncLogs();
      setSyncLogs(logs);
      
      if (logs.length > 0) {
        setLastSyncDate(new Date(logs[0].created_at));
      }
    } catch (error) {
      console.error('Error loading sync logs:', error);
    }
  };
  
  const handleSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      const result = await fullSync(token, salesRepId);
      if (result.success) {
        toast.success('Sincronização concluída com sucesso');
        if (result.uploaded > 0) {
          toast.info(`${result.uploaded} pedidos enviados`);
        }
        if (onSync) onSync();
      } else {
        toast.error('Falha na sincronização');
      }
      
      // Refresh sync logs
      await loadSyncLogs();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Erro na sincronização: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Format time since last sync
  const getLastSyncText = () => {
    if (!lastSyncDate) return 'Nunca sincronizado';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSyncDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Há menos de um minuto';
    if (diffMins < 60) return `Há ${diffMins} minutos`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Há ${diffHours} horas`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Há ${diffDays} dias`;
  };
  
  // Render connection status indicator
  const renderStatusIndicator = () => {
    switch (status) {
      case ConnectionStatus.ONLINE:
        return (
          <Badge className="bg-green-500">
            <Wifi size={12} className="mr-1" />
            Online
          </Badge>
        );
      case ConnectionStatus.OFFLINE:
        return (
          <Badge variant="destructive">
            <WifiOff size={12} className="mr-1" />
            Offline
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <WifiOff size={12} className="mr-1" />
            Desconhecido
          </Badge>
        );
    }
  };
  
  // Render basic status pill for headers
  if (!showFullStatus) {
    return (
      <div className="flex items-center gap-2">
        {renderStatusIndicator()}
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 w-7 p-0"
          onClick={handleSync}
          disabled={isSyncing || status === ConnectionStatus.OFFLINE}
        >
          <RefreshCw 
            size={16} 
            className={`${isSyncing ? 'animate-spin' : ''}`}
          />
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="font-medium">Status da Sincronização</h3>
          <div className="flex items-center gap-2 text-sm">
            <Clock size={14} />
            <span>{getLastSyncText()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {renderStatusIndicator()}
          <Button
            size="sm"
            variant="outline"
            disabled={isSyncing || status === ConnectionStatus.OFFLINE}
            onClick={handleSync}
            className="flex items-center gap-1"
          >
            <RefreshCw size={14} className={`${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
          </Button>
        </div>
      </div>
      
      {syncLogs.length > 0 && (
        <div className="border rounded-md p-3">
          <h4 className="text-sm font-medium mb-2">Histórico de Sincronizações</h4>
          <div className="max-h-32 overflow-y-auto">
            {syncLogs.map((log, index) => (
              <div key={index} className="text-xs border-b py-1 last:border-b-0">
                <div className="flex justify-between">
                  <div>
                    {log.event_type === 'upload' ? '⬆️ Upload' : 
                     log.event_type === 'download' ? '⬇️ Download' : '❌ Erro'}
                  </div>
                  <div className="text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
                {log.details && (
                  <div className="text-gray-600">
                    {typeof log.details === 'string' 
                      ? JSON.stringify(JSON.parse(log.details), null, 2)
                      : JSON.stringify(log.details, null, 2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
