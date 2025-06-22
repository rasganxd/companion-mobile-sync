import React from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAuth } from '@/contexts/AuthContext';
const NetworkStatusIndicator: React.FC = () => {
  const {
    connected
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
    if (!connected) return 'Offline';
    if (isOnline) return 'Online';
    return 'Local';
  };
  const getStatusIcon = () => {
    if (!connected) return <WifiOff size={10} />;
    if (isOnline) return <Cloud size={10} />;
    return <Database size={10} />;
  };
  const formatLastSync = () => {
    if (!lastSyncDate) return 'Nunca';
    const now = new Date();
    const diff = now.getTime() - lastSyncDate.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'Agora';
  };
  return <div className="flex flex-col items-end gap-1 text-xs">
      <Badge variant="secondary" className={`flex items-center gap-1 px-2 py-1 h-6 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-xs font-medium">{getStatusText()}</span>
      </Badge>
      
      {lastSyncDate}
    </div>;
};
export default NetworkStatusIndicator;