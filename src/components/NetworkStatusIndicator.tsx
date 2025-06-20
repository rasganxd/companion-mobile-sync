
import React from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAuth } from '@/contexts/AuthContext';

const NetworkStatusIndicator: React.FC = () => {
  const {
    connected,
    connectionType
  } = useNetworkStatus();
  const {
    isOnline,
    lastSyncDate
  } = useAuth();
  
  const getStatusColor = () => {
    if (!connected) return 'bg-red-100 text-red-800';
    if (isOnline) return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  };
  
  const getStatusText = () => {
    if (!connected) return 'Sem Rede';
    if (isOnline) return 'Online';
    return 'Offline';
  };
  
  const getStatusIcon = () => {
    if (!connected) return <WifiOff size={12} />;
    if (isOnline) return <Cloud size={12} />;
    return <Database size={12} />; // Ícone de banco local para modo offline
  };
  
  const formatLastSync = () => {
    if (!lastSyncDate) return 'Nunca sincronizado';
    const now = new Date();
    const diff = now.getTime() - lastSyncDate.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d atrás`;
    if (hours > 0) return `${hours}h atrás`;
    if (minutes > 0) return `${minutes}m atrás`;
    return 'Agora mesmo';
  };
  
  return (
    <div className="flex items-center gap-2 text-xs">
      <Badge 
        variant="secondary" 
        className={`flex items-center gap-1 px-2 py-1 ${getStatusColor()}`}
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </Badge>
      
      {lastSyncDate && (
        <Badge variant="outline" className="px-2 py-1">
          <span>Sync: {formatLastSync()}</span>
        </Badge>
      )}
      
      {!connected && (
        <Badge variant="outline" className="px-2 py-1 bg-blue-50 text-blue-700">
          <Database size={12} className="mr-1" />
          <span>Dados Locais</span>
        </Badge>
      )}
    </div>
  );
};

export default NetworkStatusIndicator;
