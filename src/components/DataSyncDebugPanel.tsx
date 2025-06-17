
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database, Trash2, Download } from 'lucide-react';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { useDataSync } from '@/hooks/useDataSync';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface StorageStats {
  clients: number;
  products: number;
  orders: number;
  paymentTables: number;
}

const DataSyncDebugPanel: React.FC = () => {
  const [stats, setStats] = useState<StorageStats>({ clients: 0, products: 0, orders: 0, paymentTables: 0 });
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { getStorageStats, forceResync, isSyncing } = useDataSync();
  const { salesRep, sessionToken } = useAuth();

  const loadStats = async () => {
    try {
      setLoading(true);
      const currentStats = await getStorageStats();
      setStats(currentStats);
      console.log('📊 Stats atualizadas:', currentStats);
    } catch (error) {
      console.error('❌ Erro ao carregar stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleClearAndResync = async () => {
    if (!salesRep?.id || !sessionToken) {
      toast.error('Vendedor não autenticado');
      return;
    }

    try {
      console.log('🔄 Iniciando limpeza e ressincronização...');
      toast.info('Limpando cache e ressincronizando...');
      
      const result = await forceResync(salesRep.id, sessionToken);
      
      if (result.success) {
        toast.success(`Ressincronização concluída! ${result.syncedData?.clients || 0} clientes carregados`);
        await loadStats();
      } else {
        toast.error(result.error || 'Erro na ressincronização');
      }
    } catch (error) {
      console.error('❌ Erro na ressincronização:', error);
      toast.error('Erro ao ressincronizar dados');
    }
  };

  const handleClearCache = async () => {
    try {
      const db = getDatabaseAdapter();
      await db.forceClearCache();
      toast.success('Cache limpo com sucesso');
      await loadStats();
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
      toast.error('Erro ao limpar cache');
    }
  };

  const handleTestClientData = async () => {
    try {
      const db = getDatabaseAdapter();
      const clients = await db.getCustomers();
      
      console.log('🔍 Teste de dados dos clientes:', {
        total: clients.length,
        sample: clients.slice(0, 3).map(c => ({
          id: c.id,
          name: c.name,
          visit_days: c.visit_days,
          visit_days_type: typeof c.visit_days
        }))
      });
      
      toast.info(`${clients.length} clientes encontrados no banco local`);
    } catch (error) {
      console.error('❌ Erro ao testar dados:', error);
      toast.error('Erro ao acessar dados dos clientes');
    }
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          variant="outline"
          size="sm"
          className="bg-white shadow-lg"
        >
          <Database size={16} className="mr-1" />
          Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Dados Locais</CardTitle>
            <Button
              onClick={() => setIsExpanded(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-blue-50 p-2 rounded">
              <div className="font-semibold text-blue-700">Clientes</div>
              <div className="text-lg font-bold text-blue-900">{stats.clients}</div>
            </div>
            <div className="bg-green-50 p-2 rounded">
              <div className="font-semibold text-green-700">Produtos</div>
              <div className="text-lg font-bold text-green-900">{stats.products}</div>
            </div>
            <div className="bg-yellow-50 p-2 rounded">
              <div className="font-semibold text-yellow-700">Pedidos</div>
              <div className="text-lg font-bold text-yellow-900">{stats.orders}</div>
            </div>
            <div className="bg-purple-50 p-2 rounded">
              <div className="font-semibold text-purple-700">Pagamentos</div>
              <div className="text-lg font-bold text-purple-900">{stats.paymentTables}</div>
            </div>
          </div>
          
          <div className="flex gap-1">
            <Button
              onClick={loadStats}
              disabled={loading}
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
            >
              <RefreshCw size={12} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              onClick={handleTestClientData}
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
            >
              <Database size={12} className="mr-1" />
              Testar
            </Button>
          </div>
          
          <div className="flex gap-1">
            <Button
              onClick={handleClearAndResync}
              disabled={isSyncing}
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
            >
              <Download size={12} className="mr-1" />
              Ressincronizar
            </Button>
            <Button
              onClick={handleClearCache}
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
            >
              <Trash2 size={12} className="mr-1" />
              Limpar
            </Button>
          </div>
          
          {isSyncing && (
            <div className="text-xs text-center text-blue-600 font-medium">
              Sincronizando...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataSyncDebugPanel;
