import React, { useState } from 'react';
import { Database, Clock, CheckCircle, RefreshCw, Wifi, WifiOff, Bug } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useLocalSyncStatus } from '@/hooks/useLocalSyncStatus';
import { useDataSync } from '@/hooks/useDataSync';
import { useAuth } from '@/contexts/AuthContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const SyncSettings = () => {
  const navigate = useNavigate();
  const {
    syncStatus
  } = useLocalSyncStatus();
  const {
    salesRep
  } = useAuth();
  const {
    connected
  } = useNetworkStatus();
  const {
    isSyncing,
    syncProgress,
    lastSyncDate,
    performFullSync,
    forceResync,
    loadLastSyncDate,
    clearLocalData,
    canSync
  } = useDataSync();
  const [isClearingData, setIsClearingData] = useState(false);
  
  React.useEffect(() => {
    loadLastSyncDate();
  }, [loadLastSyncDate]);
  
  const formatLastSync = () => {
    const dateToFormat = lastSyncDate || syncStatus.lastSync;
    if (!dateToFormat) {
      return 'Nunca sincronizado';
    }
    try {
      return format(dateToFormat, "dd/MM/yyyy 'às' HH:mm", {
        locale: ptBR
      });
    } catch (error) {
      return 'Data inválida';
    }
  };
  
  const handleQuickSync = async () => {
    if (!salesRep || !salesRep.sessionToken) {
      toast.error('Vendedor não identificado. Faça login novamente.');
      return;
    }
    if (!canSync) {
      toast.error('Sem conexão com a internet. Conecte-se para sincronizar.');
      return;
    }
    console.log('🔄 Iniciando sincronização rápida...');
    try {
      const result = await performFullSync(salesRep.id, salesRep.sessionToken);
      if (result.success) {
        const {
          clients = 0,
          products = 0,
          paymentTables = 0
        } = result.syncedData || {};
        toast.success(`Sincronização concluída! ${clients} clientes, ${products} produtos, ${paymentTables} tabelas de pagamento`);
        console.log('✅ Sincronização rápida bem-sucedida');
      } else {
        toast.error('Falha na sincronização: ' + (result.error || 'Erro desconhecido'));
        console.error('❌ Falha na sincronização rápida:', result.error);
      }
    } catch (error) {
      console.error('❌ Erro durante sincronização rápida:', error);
      toast.error('Erro durante a sincronização. Tente novamente.');
    }
  };
  
  const handleFullResync = async () => {
    if (!salesRep || !salesRep.sessionToken) {
      toast.error('Vendedor não identificado. Faça login novamente.');
      return;
    }
    if (!canSync) {
      toast.error('Sem conexão com a internet. Conecte-se para sincronizar.');
      return;
    }
    if (!confirm('Isso irá limpar todos os dados locais e recarregar tudo do servidor. Continuar?')) {
      return;
    }
    console.log('🔄 Iniciando ressincronização completa...');
    try {
      const result = await forceResync(salesRep.id, salesRep.sessionToken);
      if (result.success) {
        const {
          clients = 0,
          products = 0,
          paymentTables = 0
        } = result.syncedData || {};
        toast.success(`Ressincronização completa! ${clients} clientes, ${products} produtos, ${paymentTables} tabelas de pagamento`);
        console.log('✅ Ressincronização completa bem-sucedida');
      } else {
        toast.error('Falha na ressincronização: ' + (result.error || 'Erro desconhecido'));
        console.error('❌ Falha na ressincronização completa:', result.error);
      }
    } catch (error) {
      console.error('❌ Erro durante ressincronização completa:', error);
      toast.error('Erro durante a ressincronização. Tente novamente.');
    }
  };
  
  const handleClearLocalData = async () => {
    if (!confirm('Isso irá limpar todos os dados locais. Você precisará fazer login novamente. Continuar?')) {
      return;
    }
    setIsClearingData(true);
    try {
      await clearLocalData();
      toast.success('Dados locais limpos com sucesso');
      console.log('✅ Dados locais limpos');

      // Redirecionar para login após limpar dados
      setTimeout(() => {
        navigate('/login');
      }, 1000);
    } catch (error) {
      console.error('❌ Erro ao limpar dados locais:', error);
      toast.error('Erro ao limpar dados locais');
    } finally {
      setIsClearingData(false);
    }
  };

  const handleOpenMobileDebug = () => {
    console.log('🐛 Navegando para Mobile Debug...');
    navigate('/mobile-debug');
  };
  
  const getProgressPercentage = () => {
    if (!syncProgress) return 0;
    return syncProgress.percentage || 0;
  };
  
  return <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="Configurações de Sync" showBackButton={true} backgroundColor="blue" />
      
      <div className="p-4 flex-1">
        {/* Sync Method Card */}
        <div className="bg-white rounded-lg shadow p-4 mb-4 py-[9px]">
          <h2 className="text-lg font-semibold mb-4">Método de Sincronização</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200">
              <div className="flex-1">
                <div className="font-medium text-green-700">
                  <CheckCircle size={16} className="inline mr-2" />
                  Sistema Local (Offline-First)
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Todos os dados são armazenados localmente
                </div>
              </div>
            </div>
            
            <div className="pl-4 border-l-2 border-green-200">
              
            </div>
          </div>
        </div>

        {/* Sync Actions Card */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Sincronizar Dados</h2>
            <div className="flex items-center">
              {connected ? <Wifi size={20} className="text-green-500 mr-2" /> : <WifiOff size={20} className="text-red-500 mr-2" />}
              <span className={connected ? "text-green-500" : "text-red-500"}>
                {connected ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          {isSyncing && syncProgress && <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{syncProgress.stage}</span>
                <span className="text-sm text-gray-500">
                  {syncProgress.current}/{syncProgress.total}
                </span>
              </div>
              <Progress value={getProgressPercentage()} className="h-2" />
            </div>}

          <div className="space-y-3">
            <Button onClick={handleQuickSync} disabled={isSyncing || !canSync || !salesRep} className="w-full" variant="default">
              {isSyncing ? <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sincronizando...
                </> : <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sincronização Rápida
                </>}
            </Button>

            <Button onClick={handleFullResync} disabled={isSyncing || !canSync || !salesRep} className="w-full" variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Ressincronização Completa
            </Button>

            <Button onClick={handleClearLocalData} disabled={isSyncing || isClearingData} className="w-full" variant="destructive">
              {isClearingData ? <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Limpando...
                </> : 'Limpar Dados Locais'}
            </Button>
          </div>

          <div className="text-sm text-gray-600 mt-3">
            <p><strong>Sincronização Rápida:</strong> Atualiza dados sem limpar cache local</p>
            <p><strong>Ressincronização Completa:</strong> Remove todos os dados e recarrega do servidor</p>
            <p><strong>Limpar Dados:</strong> Remove todos os dados locais (requer novo login)</p>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow p-4 mb-4 py-[12px]">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Status do Sistema</h2>
            <div className="flex items-center">
              <Database size={20} className="text-green-500 mr-2" />
              <span className="text-green-500">Local</span>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Última sincronização:</span>
              <span className="font-medium">{formatLastSync()}</span>
            </div>
            
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Pedidos para transmitir:</span>
              <span className={syncStatus.pendingOrdersCount > 0 ? "font-medium text-amber-600" : "font-medium"}>
                {syncStatus.pendingOrdersCount}
              </span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-gray-600">Vendedor:</span>
              <span className="font-medium">{salesRep?.name || 'Não identificado'}</span>
            </div>
          </div>
        </div>

        {/* Diagnostic Tools Card */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-semibold mb-4">Ferramentas de Diagnóstico</h2>
          
          <div className="space-y-3">
            <Button 
              onClick={handleOpenMobileDebug} 
              className="w-full" 
              variant="outline"
            >
              <Bug className="w-4 h-4 mr-2" />
              Mobile Debug
            </Button>
          </div>

          <div className="text-sm text-gray-600 mt-3">
            <p><strong>Mobile Debug:</strong> Informações detalhadas sobre o ambiente móvel e dados locais</p>
          </div>
        </div>
        
        {/* Info Card */}
        
      </div>
    </div>;
};
export default SyncSettings;
