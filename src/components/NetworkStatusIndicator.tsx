
import React from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAuth } from '@/contexts/AuthContext';

const NetworkStatusIndicator: React.FC = () => {
  const { connected } = useNetworkStatus();
  const { isOnline } = useAuth();

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

  return (
    <div className="flex flex-col items-end gap-1 text-xs">
      <Badge variant="secondary" className={`flex items-center gap-1 px-2 py-1 h-6 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-xs font-medium">{getStatusText()}</span>
      </Badge>
    </div>
  );
};

export default NetworkStatusIndicator;
