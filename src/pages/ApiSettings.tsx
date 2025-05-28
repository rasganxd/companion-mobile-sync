
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, CheckCircle, XCircle, User, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import ApiService from '@/services/ApiService';
import { supabase } from '@/integrations/supabase/client';

const ApiSettings = () => {
  const navigate = useNavigate();
  const apiService = ApiService.getInstance();
  
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    checkUserSession();
    testConnection();
  }, []);

  const checkUserSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
        return;
      }
      
      if (session?.user) {
        setUserInfo({
          email: session.user.email,
          name: session.user.user_metadata?.name || 'Usuário',
          sales_rep_id: session.user.user_metadata?.sales_rep_id || 'N/A'
        });
      }
    } catch (error) {
      console.error('Error checking user session:', error);
    }
  };

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const connected = await apiService.testConnection();
      setIsConnected(connected);
      
      if (connected) {
        toast.success('Conexão com Supabase estabelecida com sucesso!');
      } else {
        toast.error('Falha ao conectar com Supabase');
      }
    } catch (error) {
      setIsConnected(false);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro de conexão: ${errorMessage}`);
      console.error('Connection test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (isConnected) {
      toast.success('Sistema configurado e pronto para uso!');
      navigate('/sync-settings');
    } else {
      toast.error('Resolva os problemas de conexão antes de continuar');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Status da Conexão" 
        showBackButton={true} 
        backgroundColor="blue" 
      />
      
      <div className="p-4 flex-1">
        {/* User Info Card */}
        {userInfo && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2" size={20} />
                Informações do Usuário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{userInfo.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nome:</span>
                <span className="font-medium">{userInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ID Vendedor:</span>
                <span className="font-medium font-mono text-sm">{userInfo.sales_rep_id}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Connection Status Card */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2" size={20} />
              Status da Conexão Supabase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span>Status da Conexão:</span>
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

            <div className="flex items-center justify-between mb-4">
              <span>Autenticação:</span>
              <div className="flex items-center">
                {userInfo ? (
                  <>
                    <CheckCircle className="text-green-500 mr-1" size={16} />
                    <span className="text-green-500">Logado</span>
                  </>
                ) : (
                  <>
                    <XCircle className="text-red-500 mr-1" size={16} />
                    <span className="text-red-500">Não logado</span>
                  </>
                )}
              </div>
            </div>
            
            <Button 
              onClick={testConnection}
              disabled={isLoading}
              className="w-full mb-2"
              variant="outline"
            >
              {isLoading ? 'Testando...' : 'Testar Conexão'}
            </Button>
            
            <Button 
              onClick={handleContinue}
              disabled={!isConnected}
              className="w-full"
            >
              Continuar para Sincronização
            </Button>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2" size={20} />
              Informações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>✅ Autenticação Automática:</strong> O sistema usa automaticamente 
                  sua autenticação Supabase para filtrar os dados. Não é necessário configurar 
                  credenciais adicionais.
                </p>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>📱 Modo Mobile:</strong> Os pedidos criados no mobile aguardam 
                  importação manual no sistema desktop para maior controle.
                </p>
              </div>
              
              {!isConnected && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>❌ Problemas de Conexão:</strong> Verifique se você está logado 
                    e se sua conexão com internet está funcionando. Tente fazer logout e login novamente.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApiSettings;
