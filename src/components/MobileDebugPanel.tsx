
import React, { useState } from 'react';
import { useMobileDebug } from '@/hooks/useMobileDebug';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Bug, Database, Smartphone } from 'lucide-react';

const MobileDebugPanel = () => {
  const { debugInfo, isLoading, refreshDebugInfo, logDebugInfo, validateMobileEnvironment } = useMobileDebug();
  const [isValidating, setIsValidating] = useState(false);

  const handleValidateEnvironment = async () => {
    setIsValidating(true);
    const isValid = await validateMobileEnvironment();
    console.log(`Environment validation result: ${isValid ? 'PASSED' : 'FAILED'}`);
    setIsValidating(false);
  };

  if (!debugInfo) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Loading debug info...
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (count: number) => {
    if (count === 0) return 'destructive';
    if (count < 10) return 'secondary';
    return 'default';
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug size={20} />
          Mobile Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Platform Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Platform:</span>
            <Badge variant={debugInfo.isNative ? 'default' : 'destructive'}>
              <Smartphone size={12} className="mr-1" />
              {debugInfo.platform}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Database:</span>
            <Badge variant="outline">
              <Database size={12} className="mr-1" />
              {debugInfo.databaseType}
            </Badge>
          </div>
        </div>

        {/* Data Counts */}
        <div className="space-y-2 border-t pt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Clients:</span>
            <Badge variant={getStatusColor(debugInfo.clientsCount)}>
              {debugInfo.clientsCount}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Products:</span>
            <Badge variant={getStatusColor(debugInfo.productsCount)}>
              {debugInfo.productsCount}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Orders:</span>
            <Badge variant={getStatusColor(debugInfo.ordersCount)}>
              {debugInfo.ordersCount}
            </Badge>
          </div>
        </div>

        {/* Sync Info */}
        <div className="space-y-2 border-t pt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Last Sync:</span>
            <span className="text-xs text-gray-500">
              {debugInfo.lastSyncDate ? 
                new Date(debugInfo.lastSyncDate).toLocaleString() : 
                'Never'
              }
            </span>
          </div>
        </div>

        {/* Error Info */}
        {debugInfo.lastError && (
          <div className="space-y-2 border-t pt-2">
            <div className="text-sm font-medium text-red-600">Last Error:</div>
            <div className="text-xs text-red-500 bg-red-50 p-2 rounded">
              {debugInfo.lastError}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 border-t pt-2">
          <Button 
            onClick={refreshDebugInfo} 
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <RefreshCw size={14} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Debug Info
          </Button>
          
          <Button 
            onClick={logDebugInfo} 
            variant="outline"
            size="sm"
            className="w-full"
          >
            Log to Console
          </Button>
          
          <Button 
            onClick={handleValidateEnvironment} 
            disabled={isValidating}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {isValidating ? 'Validating...' : 'Validate Environment'}
          </Button>
        </div>

        {/* Timestamp */}
        <div className="text-xs text-gray-400 text-center border-t pt-2">
          Updated: {new Date(debugInfo.timestamp).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileDebugPanel;
