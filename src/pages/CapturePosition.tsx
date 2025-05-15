
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { MapPin, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';

interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  timestamp: number;
}

const CapturePosition = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientId, clientName } = location.state || {};
  
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetPosition = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!navigator.geolocation) {
        setError('Geolocalização não é suportada neste dispositivo');
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPosition(position);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error getting position:', error);
          setError('Não foi possível obter sua localização. Verifique as permissões.');
          setIsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Ocorreu um erro inesperado');
      setIsLoading(false);
    }
  };

  const savePosition = async () => {
    if (!position || !clientId) {
      toast.error('Dados de posição ou cliente inválidos');
      return;
    }
    
    setIsSaving(true);
    try {
      const dbService = getDatabaseAdapter();
      const client = await dbService.getClientById(clientId);
      
      if (!client) {
        toast.error('Cliente não encontrado');
        setIsSaving(false);
        return;
      }
      
      // In a real app, you would update the client with the position
      // For now, we'll just show a success message
      toast.success('Posição do cliente capturada com sucesso');
      
      // Wait a moment before navigating back
      setTimeout(() => {
        navigate('/cliente-detalhes', { state: { clientId } });
      }, 1500);
      
    } catch (error) {
      console.error('Error saving position:', error);
      toast.error('Erro ao salvar a posição');
    } finally {
      setIsSaving(false);
    }
  };
  
  useEffect(() => {
    if (!clientId || !clientName) {
      navigate('/');
    }
  }, [clientId, clientName, navigate]);
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Capturar Posição" 
        showBackButton={true}
        backgroundColor="blue"
      />
      
      <div className="p-4 flex-1 flex flex-col">
        <div className="bg-white rounded-md shadow p-4 mb-4">
          <h2 className="font-bold text-lg">{clientName}</h2>
          <p className="text-sm text-gray-600">ID: {clientId}</p>
        </div>
        
        <div className="bg-white rounded-md shadow p-4 mb-4 flex-1">
          <div className="flex items-center justify-center h-full flex-col">
            {!position ? (
              <div className="text-center">
                <MapPin size={64} className="mx-auto mb-4 text-blue-500" />
                <p className="mb-4">Capture a localização atual deste cliente</p>
                
                <Button 
                  onClick={handleGetPosition}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Obtendo localização...
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 h-4 w-4" />
                      Capturar Posição
                    </>
                  )}
                </Button>
                
                {error && (
                  <p className="mt-4 text-red-500 text-sm">{error}</p>
                )}
              </div>
            ) : (
              <div className="text-center w-full">
                <MapPin size={64} className="mx-auto mb-4 text-green-500" />
                <p className="font-bold text-green-600 mb-2">Posição Capturada!</p>
                
                <div className="bg-gray-100 p-3 rounded-md mb-4">
                  <p className="mb-1"><span className="font-medium">Latitude:</span> {position.coords.latitude.toFixed(6)}</p>
                  <p className="mb-1"><span className="font-medium">Longitude:</span> {position.coords.longitude.toFixed(6)}</p>
                  <p><span className="font-medium">Precisão:</span> {position.coords.accuracy.toFixed(2)}m</p>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline"
                    onClick={handleGetPosition}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Recapturar
                  </Button>
                  
                  <Button 
                    onClick={savePosition}
                    className="flex-1"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Posição'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapturePosition;
