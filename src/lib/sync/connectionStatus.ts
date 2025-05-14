
import NetInfo from '@react-native-community/netinfo';
import { create } from 'zustand';

export enum ConnectionStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  UNKNOWN = 'unknown',
}

interface ConnectionState {
  status: ConnectionStatus;
  setStatus: (status: ConnectionStatus) => void;
  lastChecked: Date | null;
}

// Create a store for connection state
export const useConnectionStore = create<ConnectionState>((set) => ({
  status: ConnectionStatus.UNKNOWN,
  lastChecked: null,
  setStatus: (status: ConnectionStatus) => set({ 
    status, 
    lastChecked: new Date() 
  }),
}));

/**
 * Check if the device is connected to the internet
 */
export async function checkConnection(): Promise<boolean> {
  const { setStatus } = useConnectionStore.getState();
  try {
    const state = await NetInfo.fetch();
    const isConnected = state.isConnected && state.isInternetReachable;
    
    // Update connection status
    setStatus(isConnected ? ConnectionStatus.ONLINE : ConnectionStatus.OFFLINE);
    
    return !!isConnected;
  } catch (error) {
    console.error('Error checking connection:', error);
    setStatus(ConnectionStatus.UNKNOWN);
    return false;
  }
}

/**
 * Start monitoring connection status
 */
export function startConnectionMonitoring(): () => void {
  const { setStatus } = useConnectionStore.getState();
  
  // Subscribe to network status changes
  const unsubscribe = NetInfo.addEventListener((state) => {
    const isConnected = state.isConnected && state.isInternetReachable;
    setStatus(isConnected ? ConnectionStatus.ONLINE : ConnectionStatus.OFFLINE);
  });
  
  // Initial check
  checkConnection();
  
  return unsubscribe;
}
