
import { useState, useEffect } from 'react';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { Capacitor } from '@capacitor/core';

interface MobileDebugInfo {
  platform: string;
  isNative: boolean;
  databaseType: 'SQLite' | 'Unknown';
  clientsCount: number;
  productsCount: number;
  ordersCount: number;
  lastSyncDate: string | null;
  lastError: string | null;
  appVersion: string;
  timestamp: string;
}

export const useMobileDebug = () => {
  const [debugInfo, setDebugInfo] = useState<MobileDebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const collectDebugInfo = async (): Promise<MobileDebugInfo> => {
    setIsLoading(true);
    
    try {
      console.log('🔍 Collecting mobile debug information...');
      
      const db = getDatabaseAdapter();
      
      // Platform info
      const platform = Capacitor.getPlatform();
      const isNative = Capacitor.isNativePlatform();
      
      // Database info
      let clientsCount = 0;
      let productsCount = 0;
      let ordersCount = 0;
      let lastError = null;
      
      try {
        const clients = await db.getClients();
        clientsCount = clients.length;
        console.log(`📊 Found ${clientsCount} clients in database`);
      } catch (error) {
        console.error('❌ Error getting clients count:', error);
        lastError = `Error getting clients: ${error}`;
      }
      
      try {
        const products = await db.getProducts();
        productsCount = products.length;
        console.log(`📊 Found ${productsCount} products in database`);
      } catch (error) {
        console.error('❌ Error getting products count:', error);
        lastError = `Error getting products: ${error}`;
      }
      
      try {
        const orders = await db.getAllOrders();
        ordersCount = orders.length;
        console.log(`📊 Found ${ordersCount} orders in database`);
      } catch (error) {
        console.error('❌ Error getting orders count:', error);
        lastError = lastError || `Error getting orders: ${error}`;
      }
      
      // Sync info
      const lastSyncDate = localStorage.getItem('last_sync_date');
      
      const debugInfo: MobileDebugInfo = {
        platform,
        isNative,
        databaseType: 'SQLite',
        clientsCount,
        productsCount,
        ordersCount,
        lastSyncDate,
        lastError,
        appVersion: '1.0.0',
        timestamp: new Date().toISOString()
      };
      
      console.log('📊 Mobile debug info collected:', debugInfo);
      return debugInfo;
      
    } catch (error) {
      console.error('❌ Error collecting debug info:', error);
      
      return {
        platform: Capacitor.getPlatform(),
        isNative: Capacitor.isNativePlatform(),
        databaseType: 'Unknown',
        clientsCount: 0,
        productsCount: 0,
        ordersCount: 0,
        lastSyncDate: null,
        lastError: error instanceof Error ? error.message : 'Unknown error',
        appVersion: '1.0.0',
        timestamp: new Date().toISOString()
      };
    } finally {
      setIsLoading(false);
    }
  };

  const refreshDebugInfo = async () => {
    const info = await collectDebugInfo();
    setDebugInfo(info);
  };

  const logDebugInfo = () => {
    if (debugInfo) {
      console.log('📱 === MOBILE DEBUG INFO ===');
      console.log('🔧 Platform:', debugInfo.platform);
      console.log('📱 Is Native:', debugInfo.isNative);
      console.log('🗄️ Database Type:', debugInfo.databaseType);
      console.log('👥 Clients Count:', debugInfo.clientsCount);
      console.log('📦 Products Count:', debugInfo.productsCount);
      console.log('📋 Orders Count:', debugInfo.ordersCount);
      console.log('🔄 Last Sync:', debugInfo.lastSyncDate);
      console.log('❌ Last Error:', debugInfo.lastError);
      console.log('📱 App Version:', debugInfo.appVersion);
      console.log('⏰ Timestamp:', debugInfo.timestamp);
      console.log('📱 === END DEBUG INFO ===');
    }
  };

  const validateMobileEnvironment = async (): Promise<boolean> => {
    try {
      console.log('🔍 Validating mobile environment...');
      
      if (!Capacitor.isNativePlatform()) {
        console.error('❌ Not running on native platform');
        return false;
      }
      
      const db = getDatabaseAdapter();
      if (typeof db.getDatabaseDiagnostics === 'function') {
        const diagnostics = await db.getDatabaseDiagnostics();
        console.log('📊 Database diagnostics:', diagnostics);
        
        if (!diagnostics.isInitialized) {
          console.error('❌ Database not properly initialized');
          return false;
        }
      }
      
      console.log('✅ Mobile environment validation passed');
      return true;
    } catch (error) {
      console.error('❌ Mobile environment validation failed:', error);
      return false;
    }
  };

  useEffect(() => {
    refreshDebugInfo();
  }, []);

  return {
    debugInfo,
    isLoading,
    refreshDebugInfo,
    logDebugInfo,
    validateMobileEnvironment,
    collectDebugInfo
  };
};
