
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import AppButton from '@/components/AppButton';
import { ArrowLeft, MapPin, Check } from 'lucide-react';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { toast } from '@/components/ui/use-toast';

const CapturePosition = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientId, clientName } = location.state || { clientId: null, clientName: 'Cliente' };
  
  const [position, setPosition] = useState<{latitude: number, longitude: number} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  
  useEffect(() => {
    if (!clientId) {
      toast({
        title: "Aviso",
        description: "Nenhum cliente selecionado",
        variant: "default"
      });
    }
  }, [clientId]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleCapturePosition = async () => {
    setIsCapturing(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "Erro",
        description: "Geolocalização não é suportada pelo navegador",
        variant: "destructive"
      });
      setIsCapturing(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setPosition(coords);
        setIsCapturing(false);
        
        toast({
          title: "Sucesso",
          description: "Posição capturada com sucesso"
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        toast({
          title: "Erro",
          description: "Não foi possível capturar a posição",
          variant: "destructive"
        });
        setIsCapturing(false);
      }
    );
  };

  const handleSavePosition = async () => {
    if (!position) {
      toast({
        title: "Erro",
        description: "Nenhuma posição capturada",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      const db = getDatabaseAdapter();
      await db.logSync(
        'position', 
        'pending', 
        JSON.stringify({
          clientId,
          latitude: position.latitude,
          longitude: position.longitude,
          date: new Date().toISOString()
        })
      );
      
      toast({
        title: "Sucesso",
        description: "Posição salva com sucesso"
      });
      
      navigate(-1);
    } catch (error) {
      console.error("Error saving position:", error);
      toast({
        title: "Erro",
        description: "Falha ao salvar posição",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Capturar Posição" 
        backgroundColor="blue"
        showBackButton
      />
      
      {clientName && (
        <div className="bg-app-blue text-white px-3 py-1 text-xs">
          <span className="font-semibold">{clientId}</span> - {clientName}
        </div>
      )}
      
      <ScrollArea className="flex-1 p-4">
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="text-center space-y-4">
              <MapPin size={48} className="mx-auto text-blue-600" />
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Captura de Posição GPS</h3>
                <p className="text-gray-600 text-sm">
                  Capture sua localização atual para registrar a visita ao cliente.
                </p>
              </div>
              
              {position && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-sm space-y-1">
                    <p><strong>Latitude:</strong> {position.latitude.toFixed(6)}</p>
                    <p><strong>Longitude:</strong> {position.longitude.toFixed(6)}</p>
                  </div>
                </div>
              )}
              
              {!position && (
                <AppButton 
                  variant="blue"
                  onClick={handleCapturePosition}
                  disabled={isCapturing}
                  className="w-full flex items-center justify-center"
                >
                  <MapPin size={16} className="mr-2" />
                  {isCapturing ? 'Capturando...' : 'Capturar Posição'}
                </AppButton>
              )}
            </div>
          </CardContent>
        </Card>
      </ScrollArea>
      
      <div className="p-4 bg-white border-t grid grid-cols-2 gap-4">
        <AppButton 
          variant="gray" 
          onClick={handleGoBack}
          disabled={isLoading}
          className="flex items-center justify-center"
        >
          <ArrowLeft size={16} className="mr-2" />
          Voltar
        </AppButton>
        
        <AppButton 
          variant="blue" 
          onClick={handleSavePosition}
          disabled={isLoading || !position}
          className="flex items-center justify-center"
        >
          <Check size={16} className="mr-2" />
          Salvar
        </AppButton>
      </div>
    </div>
  );
};

export default CapturePosition;
