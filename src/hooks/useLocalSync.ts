
import { useState } from 'react';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';

interface SyncResult {
  success: boolean;
  error?: string;
}

interface InitialSyncData {
  salesRep: {
    id: string;
    code: number;
    name: string;
    email?: string;
    phone?: string;
    password?: string;
  };
  products: any[];
  clients: any[];
  visitRoutes: any[];
  priceTables: any[];
  version: string;
}

export const useLocalSync = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
  const [desktopIP, setDesktopIP] = useState<string | null>(null);

  const performInitialSync = async (salesRepCode: string, ip: string): Promise<SyncResult> => {
    try {
      console.log(`🔄 Starting initial sync for sales rep ${salesRepCode} from ${ip}`);
      
      // Validate IP format
      if (!isValidIP(ip)) {
        return { success: false, error: 'IP inválido' };
      }

      // Test connection first
      const isReachable = await testConnection(ip);
      if (!isReachable) {
        return { success: false, error: 'Não foi possível conectar ao desktop' };
      }

      // Make request to desktop
      const url = `http://${ip}:8080/primeira-atualizacao/${salesRepCode}`;
      console.log(`📡 Requesting: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: 'Vendedor não encontrado' };
        }
        if (response.status === 401) {
          return { success: false, error: 'Código do vendedor inválido' };
        }
        return { success: false, error: `Erro do servidor: ${response.status}` };
      }

      const data: InitialSyncData = await response.json();
      
      // Validate received data
      if (!data.salesRep || !data.products || !data.clients) {
        return { success: false, error: 'Dados incompletos recebidos do desktop' };
      }

      // Save data to local database
      await saveInitialData(data);
      
      // Save sync configuration
      setDesktopIP(ip);
      setLastSyncDate(new Date());
      setIsConnected(true);
      
      // Save to localStorage for persistence
      localStorage.setItem('desktop_ip', ip);
      localStorage.setItem('last_sync', new Date().toISOString());
      localStorage.setItem('sales_rep_code', salesRepCode);
      localStorage.setItem('sync_version', data.version);

      console.log('✅ Initial sync completed successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Initial sync failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro de conexão' 
      };
    }
  };

  const discoverDesktop = async (): Promise<string | null> => {
    try {
      console.log('🔍 Discovering desktop on local network...');
      
      // Get current device IP to determine network range
      const networkBase = await getNetworkBase();
      if (!networkBase) {
        console.log('❌ Could not determine network range');
        return null;
      }

      // Try common IP addresses in the network range
      const commonIPs = generateCommonIPs(networkBase);
      
      for (const ip of commonIPs) {
        console.log(`🔍 Trying ${ip}...`);
        
        const isReachable = await testConnection(ip, 2000); // 2 second timeout for discovery
        if (isReachable) {
          console.log(`✅ Desktop found at ${ip}`);
          return ip;
        }
      }

      console.log('❌ Desktop not found in network scan');
      return null;
    } catch (error) {
      console.error('❌ Error during desktop discovery:', error);
      return null;
    }
  };

  const saveInitialData = async (data: InitialSyncData) => {
    const db = getDatabaseAdapter();
    await db.initDatabase();

    try {
      console.log('💾 Saving initial sync data...');
      
      // Save sales rep data
      await db.saveClient(data.salesRep);
      
      // Save products in batch
      if (data.products.length > 0) {
        await db.saveProducts(data.products);
      }
      
      // Save clients in batch
      if (data.clients.length > 0) {
        await db.saveClients(data.clients);
      }
      
      // Save visit routes
      for (const route of data.visitRoutes) {
        await db.saveClient(route); // Reusing saveClient for routes
      }

      console.log(`✅ Saved ${data.products.length} products, ${data.clients.length} clients, ${data.visitRoutes.length} routes`);
    } catch (error) {
      console.error('❌ Error saving initial data:', error);
      throw error;
    }
  };

  const isValidIP = (ip: string): boolean => {
    const regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!regex.test(ip)) return false;
    
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  };

  const testConnection = async (ip: string, timeout = 5000): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(`http://${ip}:8080/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const getNetworkBase = async (): Promise<string | null> => {
    // For web environment, we can't reliably get the actual IP
    // So we'll provide common network ranges to try
    return '192.168.1'; // Most common home network
  };

  const generateCommonIPs = (networkBase: string): string[] => {
    const ips: string[] = [];
    
    // Try common router/server IPs first
    const commonLastOctets = [1, 100, 101, 102, 103, 104, 105, 10, 11, 12, 50, 51, 52];
    
    for (const octet of commonLastOctets) {
      ips.push(`${networkBase}.${octet}`);
    }
    
    return ips;
  };

  // Load saved configuration on hook initialization
  const loadSavedConfig = () => {
    const savedIP = localStorage.getItem('desktop_ip');
    const savedSync = localStorage.getItem('last_sync');
    
    if (savedIP) {
      setDesktopIP(savedIP);
      setIsConnected(true);
    }
    
    if (savedSync) {
      setLastSyncDate(new Date(savedSync));
    }
  };

  // Call loadSavedConfig when hook is first used
  React.useEffect(() => {
    loadSavedConfig();
  }, []);

  return {
    performInitialSync,
    discoverDesktop,
    isConnected,
    lastSyncDate,
    desktopIP
  };
};
