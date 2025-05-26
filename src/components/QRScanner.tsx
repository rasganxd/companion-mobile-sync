
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
        
        // TODO: Implement actual QR code reading from image
        // For now, we'll show an error since we need a QR code reader library
        toast.error("Leitura de QR Code ainda não implementada para dispositivos móveis");
        setError("Funcionalidade em desenvolvimento");
      } else {
        // Web implementation - would need a QR code scanning library
        toast.error("Scanner de QR Code precisa ser implementado com uma biblioteca específica");
        setError("Scanner não disponível no navegador");
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
