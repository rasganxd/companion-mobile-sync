
import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

interface NetworkStatus {
  connected: boolean;
  connectionType: string;
  isWifi: boolean;
}

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    connected: true,
    connectionType: 'unknown',
    isWifi: false
  });

  useEffect(() => {
    const initializeNetworkStatus = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // Obter status inicial
          const status = await Network.getStatus();
          setNetworkStatus({
            connected: status.connected,
            connectionType: status.connectionType,
            isWifi: status.connectionType === 'wifi'
          });

          // Escutar mudanças de status
          const listener = Network.addListener('networkStatusChange', (status) => {
            console.log('📶 Network status changed:', status);
            setNetworkStatus({
              connected: status.connected,
              connectionType: status.connectionType,
              isWifi: status.connectionType === 'wifi'
            });
          });

          return () => {
            listener.remove();
          };
        } catch (error) {
          console.error('❌ Error setting up network monitoring:', error);
        }
      } else {
        // Fallback para web usando navigator.onLine
        const updateOnlineStatus = () => {
          setNetworkStatus({
            connected: navigator.onLine,
            connectionType: navigator.onLine ? 'wifi' : 'none',
            isWifi: navigator.onLine
          });
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        updateOnlineStatus();

        return () => {
          window.removeEventListener('online', updateOnlineStatus);
          window.removeEventListener('offline', updateOnlineStatus);
        };
      }
    };

    const cleanup = initializeNetworkStatus();
    
    return () => {
      if (cleanup instanceof Promise) {
        cleanup.then(cleanupFn => cleanupFn && cleanupFn());
      }
    };
  }, []);

  return networkStatus;
};
