import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useLocalSync } from '@/hooks/useLocalSync';
const InitialSync = () => {
  const [salesRepCode, setSalesRepCode] = useState('');
  const [desktopIP, setDesktopIP] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const {
    performInitialSync,
    discoverDesktop
  } = useLocalSync();
  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesRepCode.trim()) {
      toast.error('Código do vendedor é obrigatório');
      return;
    }
    if (!desktopIP.trim()) {
      toast.error('IP do desktop é obrigatório');
      return;
    }
    setIsLoading(true);
    try {
      const result = await performInitialSync(salesRepCode, desktopIP);
      if (result.success) {
        toast.success('Sincronização concluída com sucesso!');
        navigate('/login');
      } else {
        toast.error(result.error || 'Erro durante a sincronização');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Erro inesperado durante a sincronização');
    } finally {
      setIsLoading(false);
    }
  };
  const handleDiscoverDesktop = async () => {
    setIsLoading(true);
    try {
      const ip = await discoverDesktop();
      if (ip) {
        setDesktopIP(ip);
        toast.success(`Desktop encontrado em ${ip}`);
      } else {
        toast.error('Desktop não encontrado na rede local');
      }
    } catch (error) {
      toast.error('Erro ao procurar desktop na rede');
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
      <div className="bg-gradient-to-r from-app-blue to-app-blue-dark shadow-md py-[26px]">
        <h1 className="font-bold text-center text-white text-xl">
          Primeira Sincronização
        </h1>
      </div>
      
      <div className="flex-1 flex flex-col justify-center items-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download size={24} className="text-app-blue" />
              Configurar Sistema
            </CardTitle>
            <p className="text-gray-600 text-sm">
              Configure sua conexão com o sistema desktop para baixar os dados necessários
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSync} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Código do Vendedor <span className="text-red-500">*</span>
                </label>
                <Input type="number" value={salesRepCode} onChange={e => setSalesRepCode(e.target.value)} placeholder="Digite seu código" disabled={isLoading} className="text-center text-lg font-medium" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  IP do Sistema Desktop <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Input type="text" value={desktopIP} onChange={e => setDesktopIP(e.target.value)} placeholder="192.168.0.100" disabled={isLoading} className="flex-1" />
                  <Button type="button" variant="outline" onClick={handleDiscoverDesktop} disabled={isLoading} className="px-3">
                    <Wifi size={16} />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Exemplo: 192.168.0.100 ou use o botão para buscar automaticamente
                </p>
              </div>

              <Button type="submit" className="w-full bg-app-blue hover:bg-app-blue-dark" disabled={isLoading || !salesRepCode.trim() || !desktopIP.trim()}>
                {isLoading ? <>
                    <Download size={16} className="animate-bounce mr-2" />
                    Baixando dados...
                  </> : <>
                    <Download size={16} className="mr-2" />
                    Baixar Dados
                  </>}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">Primeira sincronização</p>
                  <p className="text-blue-600 mt-1">
                    Esta operação baixará todos os dados necessários para funcionamento offline: 
                    produtos, clientes, rotas e informações do vendedor.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="py-4 text-center text-gray-600 text-sm bg-white border-t">
        © 2025 Companion Mobile Sync - Modo Offline
      </div>
    </div>;
};
export default InitialSync;