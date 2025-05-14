
// Re-export everything from the database
export * from './database';

// Re-export the connection status
export * from './connectionStatus';

// Re-export the sync service
export * from './syncService';

// Re-export repositories
export * as ClientRepository from './repositories/clientRepository';
export * as ProductRepository from './repositories/productRepository';
export * as OrderRepository from './repositories/orderRepository';

// Export the SyncStatus component directly
export { default as SyncStatus } from '@/components/SyncStatus';

// Initialize function to set up everything
import { initDatabase } from './database';
import { startConnectionMonitoring } from './connectionStatus';
import { initDeviceId } from './syncService';

export interface SyncConfig {
  deviceId: string;
}

export async function initializeSync(config: SyncConfig): Promise<void> {
  try {
    // Initialize the device ID for sync service
    initDeviceId(config.deviceId);
    
    // Set up database
    await initDatabase();
    
    // Start connection monitoring
    startConnectionMonitoring();
    
    console.log('Mobile sync initialized successfully');
  } catch (error) {
    console.error('Failed to initialize mobile sync:', error);
    throw error;
  }
}
