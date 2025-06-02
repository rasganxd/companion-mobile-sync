
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
  
  const [apiUrl, setApiUrl] = useState('');
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiStatus, setApiStatus] = useState<boolean | null>(null);

  useEffect(() => {
    // Load existing config if available
    if (session?.apiConfig) {
      setApiUrl(session.apiConfig.apiUrl);
      setApiStatus(true);
    }
  }, [session]);

  const testApiConnection = async () => {
    if (!apiUrl.trim()) {
      toast.error('Digite a URL da API');
      return;
    }

    if (!session?.sessionToken) {
      toast.error('Usuário não autenticado');
      return;
    }

    setIsTestingApi(true);
    try {
      console.log('📡 Testing API connection to mobile orders import:', apiUrl);

      // Test API connection using the correct mobile-orders-import endpoint
      const testEndpoint = `${apiUrl}/mobile-orders-import`;
      const response = await fetch(testEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.sessionToken}`
        },
        body: JSON.stringify({
          test: true,
          customer_id: 'test',
          date: new Date().toISOString(),
          status: 'pending',
          total: 0
        })
      });

      if (response.ok || response.status === 400) {
        // 400 is expected for test data, but it means the endpoint is reachable
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
    if (!apiUrl.trim()) {
      toast.error('Digite a URL da API');
      return;
    }

    if (!apiStatus) {
      toast.error('Teste e valide a conexão com a API antes de salvar');
      return;
    }

    if (!session?.sessionToken) {
      toast.error('Usuário não autenticado');
      return;
    }

    updateApiConfig({
      token: session.sessionToken, // Use the session token
      apiUrl
    });

    console.log('💾 API configuration saved:', {
      apiUrl,
      hasAuth: !!session.sessionToken
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
      <Header title="Configuração Mobile" showBackButton={false} backgroundColor="blue" />
      
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
              API de Importação de Pedidos
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
                onChange={e => setApiUrl(e.target.value)} 
                placeholder="https://api.exemplo.com/functions/v1" 
                className="w-full" 
              />
              <p className="text-xs text-gray-500">
                URL base da API (ex: https://projeto.supabase.co/functions/v1)
              </p>
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
              disabled={isTestingApi || !apiUrl.trim() || !session?.sessionToken} 
              className="w-full" 
              variant="outline"
            >
              {isTestingApi ? 'Testando...' : 'Testar Conexão'}
            </Button>
          </CardContent>
        </Card>

        {/* Authentication Info Card */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2" size={20} />
              Autenticação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Status da Autenticação:</span>
              <div className="flex items-center">
                {session?.sessionToken ? (
                  <>
                    <CheckCircle className="text-green-500 mr-1" size={16} />
                    <span className="text-green-500">Autenticado</span>
                  </>
                ) : (
                  <>
                    <XCircle className="text-red-500 mr-1" size={16} />
                    <span className="text-red-500">Não autenticado</span>
                  </>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-600">
              A autenticação é feita automaticamente com o login do vendedor.
            </p>
          </CardContent>
        </Card>

        {/* Continue Button */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <Button 
              onClick={handleContinue} 
              disabled={!apiStatus || !session?.sessionToken} 
              className="w-full" 
              size="lg"
            >
              {hasApiConfig() ? 'Continuar para o Sistema' : 'Salvar e Continuar'}
            </Button>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2" size={20} />
              Informações Importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600">
              • A API deve ter o endpoint <code>/mobile-orders-import</code> disponível
            </p>
            <p className="text-sm text-gray-600">
              • A autenticação é feita com o token da sessão do vendedor
            </p>
            <p className="text-sm text-gray-600">
              • Os pedidos enviados ficam pendentes de importação manual
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApiSettings;
