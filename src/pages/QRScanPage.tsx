import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Server, Wifi, User, Key } from 'lucide-react';
import Header from '@/components/Header';
import QRScanner from '@/components/QRScanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import SyncService from '@/services/SyncService';

interface ApiConfig {
  type: string;
  servidor: string;
  ip_local: string;
  ip_publico: string;
  token: string;
  vendedor_id: string;
  endpoints: {
    download: string;
    upload: string;
  };
}

const QRScanPage = () => {
  const navigate = useNavigate();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [lastScannedData, setLastScannedData] = useState<string | null>(null);
  const [apiConfig, setApiConfig] = useState<ApiConfig | null>(null);

  const handleScanSuccess = async (data: string) => {
    setLastScannedData(data);
    setScannerOpen(false);
    
    try {
      // Process the QR code data
      const qrData = JSON.parse(data);
      
      if (qrData.type === 'api_mobile_config') {
        // Handle API mobile configuration
        setApiConfig(qrData);
        
        // Update sync service with new configuration
        const syncService = SyncService.getInstance();
        await syncService.updateApiConfig({
          apiUrl: qrData.servidor,
          token: qrData.token
        });
        
        toast.success('Configuração da API móvel atualizada com sucesso!');
        
        // Save configuration to localStorage for persistence
        localStorage.setItem('api_config', JSON.stringify(qrData));
        
      } else if (qrData.type === 'sync_config') {
        // Handle sync configuration updates
        const syncService = SyncService.getInstance();
        await syncService.updateSyncSettings(qrData.settings);
        toast.success('Configurações de sincronização atualizadas!');
      } else {
        toast.info(`QR Code escaneado: ${data}`);
      }
    } catch (error) {
      // If it's not JSON, treat as plain text
      console.log('QR Code data:', data);
      toast.success('QR Code escaneado com sucesso!');
    }
  };

  // Load saved configuration on component mount
  React.useEffect(() => {
    const savedConfig = localStorage.getItem('api_config');
    if (savedConfig) {
      try {
        setApiConfig(JSON.parse(savedConfig));
      } catch (error) {
        console.error('Error loading saved config:', error);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Scanner QR Code" 
        showBackButton={true} 
        backgroundColor="blue" 
      />
      
      <div className="p-4 flex-1">
        <div className="bg-white rounded-lg shadow p-6 text-center mb-4">
          <QrCode size={64} className="mx-auto mb-4 text-blue-500" />
          
          <h2 className="text-xl font-semibold mb-2">
            Escanear QR Code
          </h2>
          
          <p className="text-gray-600 mb-6">
            Use o scanner para configurar a API móvel, receber atualizações de configuração ou dados de sincronização.
          </p>
          
          <Button 
            onClick={() => setScannerOpen(true)}
            className="w-full mb-4"
            size="lg"
          >
            <QrCode className="mr-2" size={20} />
            Abrir Scanner
          </Button>
        </div>

        {apiConfig && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="mr-2" size={20} />
                Configuração da API Móvel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center">
                  <Server className="mr-1" size={16} />
                  Servidor:
                </span>
                <span className="text-sm font-medium break-all">{apiConfig.servidor}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center">
                  <Wifi className="mr-1" size={16} />
                  IP Local:
                </span>
                <span className="text-sm font-medium">{apiConfig.ip_local}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center">
                  <Wifi className="mr-1" size={16} />
                  IP Público:
                </span>
                <span className="text-sm font-medium">{apiConfig.ip_publico}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center">
                  <User className="mr-1" size={16} />
                  ID Vendedor:
                </span>
                <span className="text-sm font-medium">{apiConfig.vendedor_id}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center">
                  <Key className="mr-1" size={16} />
                  Token:
                </span>
                <span className="text-sm font-medium">***...{apiConfig.token.slice(-8)}</span>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium mb-2">Tipos de QR Code suportados:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Configuração da API móvel (servidor, IPs, token, vendedor)</li>
            <li>• Configurações de sincronização</li>
            <li>• Dados de atualizações</li>
            <li>• URLs de configuração</li>
          </ul>
        </div>
      </div>
      
      <QRScanner 
        isOpen={scannerOpen}
        onScanSuccess={handleScanSuccess}
        onClose={() => setScannerOpen(false)}
      />
    </div>
  );
};

export default QRScanPage;
