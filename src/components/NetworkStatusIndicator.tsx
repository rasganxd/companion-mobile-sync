
import React from 'react';
import { Wifi, WifiOff, Cloud, CloudOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAuth } from '@/hooks/useAuth';

const NetworkStatusIndicator: React.FC = () => {
  const { connected, connectionType } = useNetworkStatus();
  const { isOnline, lastSyncDate } = useAuth();

  const getStatusColor = () => {
    if (!connected) return 'bg-red-100 text-red-800';
    if (isOnline) return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = () => {
    if (!connected) return 'Offline';
    if (isOnline) return 'Online';
    return 'Modo Offline';
  };

  const getStatusIcon = () => {
    if (!connected) return <WifiOff size={12} />;
    if (isOnline) return <Cloud size={12} />;
    return <CloudOff size={12} />;
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
      <Badge className={`text-xs ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="ml-1">{getStatusText()}</span>
      </Badge>
      
      {connectionType !== 'unknown' && (
        <span className="text-gray-500 text-xs">
          {connectionType.toUpperCase()}
        </span>
      )}
      
      <span className="text-gray-500 text-xs">
        Sync: {formatLastSync()}
      </span>
    </div>
  );
};

export default NetworkStatusIndicator;
