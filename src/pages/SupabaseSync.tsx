
import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, Database, Users, Package, ShoppingCart } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import SupabaseSyncService from '@/services/SupabaseSyncService';
import { ProgressIndicator } from '@/components/SyncComponents';
import { toast } from 'sonner';

const SupabaseSync = () => {
  const { user, salesRep, isAuthenticated } = useSupabaseAuth();
  const [syncService] = useState(() => SupabaseSyncService.getInstance());
  const [syncStatus, setSyncStatus] = useState(syncService.getStatus());
  const [syncProgress, setSyncProgress] = useState(null);
  const [lastSyncText, setLastSyncText] = useState('Nunca');

  useEffect(() => {
    // Setup sync service callbacks
    syncService.onStatusChange(setSyncStatus);
    syncService.onProgress(setSyncProgress);

    return () => {
      syncService.onStatusChange(() => {});
      syncService.onProgress(() => {});
    };
  }, [syncService]);

  useEffect(() => {
    if (syncStatus.lastSync) {
      const date = new Date(syncStatus.lastSync);
      setLastSyncText(
        `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
      );
    }
  }, [syncStatus.lastSync]);

  const handleSyncNow = async () => {
    if (!isAuthenticated()) {
      toast.error("Você precisa estar logado para sincronizar");
      return;
    }

    if (syncStatus.inProgress) {
      toast.info("Sincronização já em andamento");
      return;
    }

    const success = await syncService.sync();
    
    if (success) {
      toast.success("Sincronização concluída com sucesso");
    }
  };

  const handleCheckConnection = async () => {
    const connected = await syncService.refreshConnection();
    if (connected) {
      toast.success("Conexão com Supabase ativa");
    } else {
      toast.error("Não foi possível conectar ao Supabase");
    }
  };

  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header 
          title="Sincronização Supabase" 
          showBackButton={true} 
          backgroundColor="purple" 
        />
        
        <div className="p-4 flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <Database className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-lg font-semibold mb-2">Autenticação Necessária</h3>
              <p className="text-gray-600 mb-4">
                Você precisa estar logado para acessar a sincronização com Supabase.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Sincronização Supabase" 
        showBackButton={true} 
        backgroundColor="purple" 
      />
      
      <div className="p-4 flex-1">
        {/* User Info Card */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2" size={20} />
              Usuário Autenticado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{user?.email}</span>
              </div>
              {salesRep && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vendedor:</span>
                    <span className="font-medium">{salesRep.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Código:</span>
                    <span className="font-medium">{salesRep.code}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Database className="mr-2" size={20} />
                Status da Sincronização
              </span>
              <div className="flex items-center">
                {syncStatus.connected ? (
                  <Cloud size={20} className="text-green-500 mr-2" />
                ) : (
                  <CloudOff size={20} className="text-red-500 mr-2" />
                )}
                <Badge variant={syncStatus.connected ? "default" : "destructive"}>
                  {syncStatus.connected ? "Conectado" : "Desconectado"}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Última sincronização:</span>
                <span className="font-medium">{lastSyncText}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Pendentes para envio:</span>
                <Badge variant={syncStatus.pendingUploads > 0 ? "secondary" : "outline"}>
                  {syncStatus.pendingUploads} pedidos
                </Badge>
              </div>
            </div>
            
            {syncStatus.inProgress && syncProgress && (
              <div className="mt-4">
                <ProgressIndicator 
                  progress={syncProgress} 
                  type={syncProgress.type === 'upload' ? 'Enviando' : 'Baixando'} 
                />
              </div>
            )}
            
            <div className="flex gap-2 mt-4">
              <Button 
                onClick={handleSyncNow}
                disabled={syncStatus.inProgress}
                className="flex-1"
              >
                {syncStatus.inProgress ? (
                  <>
                    <RefreshCw size={16} className="animate-spin mr-2" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <Database size={16} className="mr-2" />
                    Sincronizar Agora
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleCheckConnection}
                variant="outline"
                disabled={syncStatus.inProgress}
              >
                <Cloud size={16} className="mr-2" />
                Testar Conexão
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sync Features Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2" size={20} />
              Recursos de Sincronização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <ShoppingCart className="text-blue-500 mt-1" size={20} />
                <div>
                  <h4 className="font-medium">Pedidos Mobile → Desktop</h4>
                  <p className="text-sm text-gray-600">
                    Pedidos criados no mobile são enviados para o desktop para importação
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Users className="text-green-500 mt-1" size={20} />
                <div>
                  <h4 className="font-medium">Clientes Sincronizados</h4>
                  <p className="text-sm text-gray-600">
                    Receba atualizações dos seus clientes do sistema desktop
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Package className="text-purple-500 mt-1" size={20} />
                <div>
                  <h4 className="font-medium">Produtos Atualizados</h4>
                  <p className="text-sm text-gray-600">
                    Mantenha o catálogo de produtos sempre atualizado
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupabaseSync;
