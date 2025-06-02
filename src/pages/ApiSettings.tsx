
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, CheckCircle, XCircle, User, AlertCircle, Settings, Wifi, AlertTriangle } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useMobileAuth } from '@/hooks/useMobileAuth';

const ApiSettings = () => {
  const navigate = useNavigate();
  const {
    session,
    updateApiConfig,
    hasApiConfig
  } = useMobileAuth();
  const [token, setToken] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [isTestingToken, setIsTestingToken] = useState(false);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<boolean | null>(null);
  const [apiStatus, setApiStatus] = useState<boolean | null>(null);

  useEffect(() => {
    // Load existing config if available
    if (session?.apiConfig) {
      setToken(session.apiConfig.token);
      setApiUrl(session.apiConfig.apiUrl);
      setTokenStatus(true);
      setApiStatus(true);
    }
  }, [session]);

  const testToken = async () => {
    if (!token.trim()) {
      toast.error('Digite o token do vendedor');
      return;
    }
    if (!apiUrl.trim()) {
      toast.error('Digite a URL da API primeiro');
      return;
    }

    setIsTestingToken(true);
    try {
      console.log('🔑 Testing token against Orders API:', apiUrl);

      // Test token with the orders API (GET /)
      const response = await fetch(`${apiUrl}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setTokenStatus(true);
        toast.success('Token validado com sucesso!');
        console.log('✅ Token validation successful');
      } else {
        setTokenStatus(false);
        const errorText = await response.text();
        console.error('❌ Token validation failed:', response.status, errorText);
        toast.error('Token inválido');
      }
    } catch (error) {
      setTokenStatus(false);
      console.error('❌ Token validation error:', error);
      toast.error('Erro ao validar token');
    } finally {
      setIsTestingToken(false);
    }
  };

  const testApiConnection = async () => {
    if (!apiUrl.trim()) {
      toast.error('Digite a URL da API');
      return;
    }

    setIsTestingApi(true);
    try {
      console.log('📡 Testing API connection to:', apiUrl);

      // Test API connection using GET / (list orders)
      const response = await fetch(`${apiUrl}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && {
            'Authorization': `Bearer ${token}`
          })
        }
      });

      if (response.ok) {
        setApiStatus(true);
        toast.success('Conexão com API estabelecida!');
        console.log('✅ API connection successful');
      } else {
        setApiStatus(false);
        const errorText = await response.text();
        console.error('❌ API connection failed:', response.status, errorText);
        toast.error('Falha ao conectar com a API');
      }
    } catch (error) {
      setApiStatus(false);
      console.error('❌ API connection error:', error);
      toast.error('Erro de conexão com a API');
    } finally {
      setIsTestingApi(false);
    }
  };

  const saveConfiguration = () => {
    if (!token.trim() || !apiUrl.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (!tokenStatus || !apiStatus) {
      toast.error('Teste e valide todas as configurações antes de salvar');
      return;
    }

    updateApiConfig({
      token,
      apiUrl
    });

    console.log('💾 API configuration saved:', {
      apiUrl,
      tokenLength: token.length
    });

    toast.success('Configuração salva com sucesso!');
    navigate('/home');
  };

  const handleContinue = () => {
    if (hasApiConfig()) {
      navigate('/home');
    } else {
      saveConfiguration();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Configuração Mobile" 
        showBackButton={false} 
        backgroundColor="blue" 
      />
      
      <div className="p-4 flex-1">
        {/* User Info Card */}
        {session?.salesRep && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2" size={20} />
                Vendedor Logado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Nome:</span>
                <span className="font-medium">{session.salesRep.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Código:</span>
                <span className="font-medium">{session.salesRep.code}</span>
              </div>
              {session.salesRep.email && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-sm">{session.salesRep.email}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* API Configuration Card */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wifi className="mr-2" size={20} />
              API de Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                URL da API <span className="text-red-500">*</span>
              </label>
              <Input 
                type="url" 
                value={apiUrl} 
                onChange={(e) => setApiUrl(e.target.value)} 
                placeholder="https://api.exemplo.com/orders" 
                className="w-full" 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span>Status da Conexão:</span>
              <div className="flex items-center">
                {apiStatus === null ? (
                  <span className="text-gray-500">Não testado</span>
                ) : apiStatus ? (
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
              onClick={testApiConnection} 
              disabled={isTestingApi || !apiUrl.trim()} 
              className="w-full" 
              variant="outline"
            >
              {isTestingApi ? 'Testando...' : 'Testar Conexão'}
            </Button>
          </CardContent>
        </Card>

        {/* Token Configuration Card */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2" size={20} />
              Token de Autenticação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Token da API <span className="text-red-500">*</span>
              </label>
              <Input 
                type="text" 
                value={token} 
                onChange={(e) => setToken(e.target.value)} 
                placeholder="Digite o token de autenticação da API" 
                className="w-full" 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span>Status do Token:</span>
              <div className="flex items-center">
                {tokenStatus === null ? (
                  <span className="text-gray-500">Não testado</span>
                ) : tokenStatus ? (
                  <>
                    <CheckCircle className="text-green-500 mr-1" size={16} />
                    <span className="text-green-500">Válido</span>
                  </>
                ) : (
                  <>
                    <XCircle className="text-red-500 mr-1" size={16} />
                    <span className="text-red-500">Inválido</span>
                  </>
                )}
              </div>
            </div>
            
            <Button 
              onClick={testToken} 
              disabled={isTestingToken || !token.trim() || !apiUrl.trim()} 
              className="w-full" 
              variant="outline"
            >
              {isTestingToken ? 'Testando...' : 'Testar Token'}
            </Button>
          </CardContent>
        </Card>

        {/* Continue Button */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <Button 
              onClick={handleContinue} 
              disabled={!tokenStatus || !apiStatus} 
              className="w-full" 
              size="lg"
            >
              {hasApiConfig() ? 'Continuar para o Sistema' : 'Salvar e Continuar'}
            </Button>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="text-amber-500 mt-0.5" size={16} />
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">Endpoints da API de Pedidos:</p>
                <ul className="space-y-1 text-xs">
                  <li>• GET / - Listar pedidos</li>
                  <li>• POST / - Criar pedido</li>
                  <li>• GET /:id - Buscar pedido</li>
                  <li>• PUT /:id - Atualizar pedido</li>
                  <li>• DELETE /:id - Excluir pedido</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApiSettings;
