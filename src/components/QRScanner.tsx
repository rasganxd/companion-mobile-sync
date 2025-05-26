
import React, { useState, useRef, useEffect } from 'react';
import { Camera } from '@capacitor/camera';
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
          resultType: 'dataUrl',
          source: 'camera',
          // Note: QR scanning would need additional plugin like @capacitor-community/barcode-scanner
        });
        
        // For now, we'll simulate QR code detection
        // In a real implementation, you'd use a barcode scanner plugin
        toast.info("Scanner de QR implementado - funcionalidade simulada");
        onScanSuccess("sample-qr-data-from-camera");
      } else {
        // Web implementation - would need a web QR scanner library
        toast.info("Scanner de QR web - funcionalidade simulada");
        // Simulate successful scan for demo
        setTimeout(() => {
          onScanSuccess("sample-qr-data-web");
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
              Posicione o QR code na frente da câmera para escanear atualizações
            </div>
          )}

          {isScanning ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Escaneando...</p>
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
