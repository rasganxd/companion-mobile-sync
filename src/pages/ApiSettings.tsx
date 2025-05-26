
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, Key, User, CheckCircle, XCircle } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import ApiService, { ApiConfig } from '@/services/ApiService';

const ApiSettings = () => {
  const navigate = useNavigate();
  const apiService = ApiService.getInstance();
  
  const [config, setConfig] = useState<ApiConfig>({
    baseUrl: '',
    apiKey: '',
    salesRepId: ''
  });
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedConfig = apiService.getConfig();
    if (savedConfig) {
      setConfig(savedConfig);
      testConnection();
    }
  }, []);

  const handleInputChange = (field: keyof ApiConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const testConnection = async () => {
    if (!config.baseUrl || !config.apiKey) {
      toast.error('Preencha URL base e API Key primeiro');
      return;
    }

    setIsLoading(true);
    try {
      apiService.setConfig(config);
      const connected = await apiService.testConnection();
      setIsConnected(connected);
      
      if (connected) {
        toast.success('Conexão com API estabelecida com sucesso!');
      } else {
        toast.error('Falha ao conectar com a API');
      }
    } catch (error) {
      setIsConnected(false);
      toast.error(`Erro de conexão: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = () => {
    if (!config.baseUrl || !config.apiKey || !config.salesRepId) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }

    apiService.setConfig(config);
    toast.success('Configurações salvas com sucesso!');
    navigate('/sync-settings');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Configuração da API" 
        showBackButton={true} 
        backgroundColor="blue" 
      />
      
      <div className="p-4 flex-1">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="mr-2" size={20} />
              Configuração da API REST
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="baseUrl">URL Base da API</Label>
              <Input
                id="baseUrl"
                placeholder="https://seu-projeto.lovableproject.com"
                value={config.baseUrl}
                onChange={(e) => handleInputChange('baseUrl', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sua-api-key-aqui"
                value={config.apiKey}
                onChange={(e) => handleInputChange('apiKey', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="salesRepId">ID do Vendedor</Label>
              <Input
                id="salesRepId"
                placeholder="seu-id-de-vendedor"
                value={config.salesRepId}
                onChange={(e) => handleInputChange('salesRepId', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Status da Conexão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span>Status:</span>
              <div className="flex items-center">
                {isConnected === null ? (
                  <span className="text-gray-500">Não testado</span>
                ) : isConnected ? (
                  <>
                    <CheckCircle className="text-green-500 mr-1" size={16} />
                    <span className="text-green-500">Conectado</span>
                  </>
                ) : (
                  <>
                    <XCircle className="text-red-500 mr-1" size={16} />
                    <span className="text-red-500">Desconectado</span>
                  </>
                )}
              </div>
            </div>
            
            <Button 
              onClick={testConnection}
              disabled={isLoading || !config.baseUrl || !config.apiKey}
              className="w-full mb-2"
              variant="outline"
            >
              {isLoading ? 'Testando...' : 'Testar Conexão'}
            </Button>
            
            <Button 
              onClick={saveConfig}
              disabled={!isConnected}
              className="w-full"
            >
              Salvar Configurações
            </Button>
          </CardContent>
        </Card>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium mb-2">Como obter suas credenciais:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• A URL base é o endereço do seu projeto Desktop no Lovable</li>
            <li>• A API Key deve ser gerada nas configurações do projeto Desktop</li>
            <li>• O ID do vendedor deve corresponder ao seu ID no sistema Desktop</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ApiSettings;
