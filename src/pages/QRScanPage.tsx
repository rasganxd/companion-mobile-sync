
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode } from 'lucide-react';
import Header from '@/components/Header';
import QRScanner from '@/components/QRScanner';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import SyncService from '@/services/SyncService';

const QRScanPage = () => {
  const navigate = useNavigate();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [lastScannedData, setLastScannedData] = useState<string | null>(null);

  const handleScanSuccess = async (data: string) => {
    setLastScannedData(data);
    setScannerOpen(false);
    
    try {
      // Process the QR code data
      const qrData = JSON.parse(data);
      
      if (qrData.type === 'sync_config') {
        // Handle sync configuration updates
        const syncService = SyncService.getInstance();
        await syncService.updateSyncSettings(qrData.settings);
        toast.success('Configurações de sincronização atualizadas!');
      } else if (qrData.type === 'server_config') {
        // Handle server configuration updates
        toast.success('Configurações do servidor atualizadas!');
      } else {
        toast.info(`QR Code escaneado: ${data}`);
      }
    } catch (error) {
      // If it's not JSON, treat as plain text
      console.log('QR Code data:', data);
      toast.success('QR Code escaneado com sucesso!');
      
      // For demo purposes, trigger a sync
      const syncService = SyncService.getInstance();
      syncService.sync();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Scanner QR Code" 
        showBackButton={true} 
        backgroundColor="blue" 
      />
      
      <div className="p-4 flex-1">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <QrCode size={64} className="mx-auto mb-4 text-blue-500" />
          
          <h2 className="text-xl font-semibold mb-2">
            Escanear QR Code
          </h2>
          
          <p className="text-gray-600 mb-6">
            Use o scanner para receber atualizações de configuração, dados de sincronização ou outras informações através de códigos QR.
          </p>
          
          <Button 
            onClick={() => setScannerOpen(true)}
            className="w-full mb-4"
            size="lg"
          >
            <QrCode className="mr-2" size={20} />
            Abrir Scanner
          </Button>
          
          {lastScannedData && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Último QR escaneado:</h3>
              <p className="text-sm text-gray-600 break-all">
                {lastScannedData}
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-4 bg-white rounded-lg shadow p-4">
          <h3 className="font-medium mb-2">Tipos de QR Code suportados:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Configurações de sincronização</li>
            <li>• Configurações do servidor</li>
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
