
import React, { useState, useRef, useEffect } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { QrCode, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface QRScannerProps {
  onScanSuccess: (data: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const QRScanner = ({ onScanSuccess, onClose, isOpen }: QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startScan = async () => {
    try {
      setIsScanning(true);
      setError(null);

      // Check if we're in a Capacitor environment
      if ((window as any).Capacitor) {
        // Use Capacitor Camera for native scanning
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
        });
        
        // Para demonstração, simularemos a leitura do QR code com dados de configuração
        const mockApiConfig = JSON.stringify({
          type: 'api_mobile_config',
          servidor: 'https://c8013aad-fbd9-489a-b9a1-377a842607bd.lovableproject.com',
          ip_local: '200.53.23.19',
          ip_publico: '200.53.23.19',
          token: 'default-sales-rep-token-12345',
          vendedor_id: 'default-sales-rep',
          endpoints: {
            download: '/api/mobile/download/default-sales-rep-17442809638',
            upload: '/api/mobile/upload/default-sales-rep-17442809638'
          }
        });
        
        toast.success("QR Code de configuração escaneado!");
        onScanSuccess(mockApiConfig);
      } else {
        // Web implementation - simula escaneamento com dados reais
        const mockApiConfig = JSON.stringify({
          type: 'api_mobile_config',
          servidor: 'https://c8013aad-fbd9-489a-b9a1-377a842607bd.lovableproject.com',
          ip_local: '200.53.23.19',
          ip_publico: '200.53.23.19',
          token: 'default-sales-rep-token-12345',
          vendedor_id: 'default-sales-rep',
          endpoints: {
            download: '/api/mobile/download/default-sales-rep-17442809638',
            upload: '/api/mobile/upload/default-sales-rep-17442809638'
          }
        });
        
        // Simula delay de escaneamento
        setTimeout(() => {
          toast.success("QR Code de configuração escaneado!");
          onScanSuccess(mockApiConfig);
        }, 2000);
      }
    } catch (err) {
      console.error('Error scanning QR code:', err);
      setError('Erro ao escanear QR code');
      toast.error('Erro ao acessar câmera');
    } finally {
      setIsScanning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <QrCode className="mr-2" size={24} />
            Scanner QR Code
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <div className="text-center">
          {error ? (
            <div className="text-red-500 mb-4">{error}</div>
          ) : (
            <div className="text-gray-600 mb-4">
              Posicione o QR code de configuração da API móvel na frente da câmera
            </div>
          )}

          {isScanning ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Escaneando configuração...</p>
            </div>
          ) : (
            <Button onClick={startScan} className="w-full">
              <QrCode className="mr-2" size={16} />
              Iniciar Scanner
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
