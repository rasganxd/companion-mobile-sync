
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Database, Users, Package, CreditCard, FileText, Trash2 } from 'lucide-react';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import MobileDatabaseService from '@/services/MobileDatabaseService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const MobileDebugPanel = () => {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [sampleData, setSampleData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const { salesRep } = useAuth();

  const loadDiagnostics = async () => {
    try {
      setIsLoading(true);
      const db = getDatabaseAdapter();
      await db.initDatabase();
      
      const diag = await db.getDatabaseDiagnostics();
      setDiagnostics(diag);

      // Load sample data for inspection
      const clients = await db.getClients();
      const products = await db.getProducts();
      const orders = await db.getAllOrders();
      const paymentTables = await db.getPaymentTables();

      setSampleData({
        clients: clients.slice(0, 5),
        products: products.slice(0, 3),
        orders: orders.slice(0, 3),
        paymentTables: paymentTables.slice(0, 3)
      });

      console.log('🔍 Debug data loaded:', {
        diagnostics: diag,
        sampleClients: clients.slice(0, 3),
        totalClients: clients.length
      });

    } catch (error) {
      console.error('❌ Error loading diagnostics:', error);
      toast.error('Erro ao carregar diagnósticos');
    } finally {
      setIsLoading(false);
    }
  };

  const resetMockData = async () => {
    try {
      setIsLoading(true);
      toast.info('Resetando dados mock...');
      
      const db = MobileDatabaseService.getInstance();
      await db.resetMockData();
      
      // Reload diagnostics
      await loadDiagnostics();
      
      toast.success('Dados mock resetados com sucesso!');
    } catch (error) {
      console.error('❌ Error resetting mock data:', error);
      toast.error('Erro ao resetar dados mock');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const getEnvironmentBadge = () => {
    if (!diagnostics) return <Badge variant="secondary">Carregando...</Badge>;
    
    switch (diagnostics.environment) {
      case 'native':
        return <Badge variant="default">Native SQLite</Badge>;
      case 'web':
        return <Badge variant="secondary">Web SQLite</Badge>;
      case 'fallback':
        return <Badge variant="outline">LocalStorage</Badge>;
      default:
        return <Badge variant="destructive">Desconhecido</Badge>;
    }
  };

  const isLovableEnvironment = () => {
    return window.location.hostname.includes('lovableproject.com') || 
           window.location.hostname.includes('localhost');
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Mobile Debug Panel
        </CardTitle>
        <CardDescription>
          Diagnósticos e informações do banco de dados móvel
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Environment Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Ambiente</p>
            {getEnvironmentBadge()}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Status</p>
            <Badge variant={diagnostics?.isInitialized ? "default" : "destructive"}>
              {diagnostics?.isInitialized ? "Inicializado" : "Não Inicializado"}
            </Badge>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Vendedor</p>
            <Badge variant={salesRep ? "default" : "secondary"}>
              {salesRep ? salesRep.name : "Não logado"}
            </Badge>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Lovable</p>
            <Badge variant={isLovableEnvironment() ? "default" : "secondary"}>
              {isLovableEnvironment() ? "Sim" : "Não"}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Database Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{diagnostics?.clientsCount || 0}</p>
              <p className="text-xs text-muted-foreground">Clientes</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{diagnostics?.productsCount || 0}</p>
              <p className="text-xs text-muted-foreground">Produtos</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{diagnostics?.ordersCount || 0}</p>
              <p className="text-xs text-muted-foreground">Pedidos</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{diagnostics?.paymentTablesCount || 0}</p>
              <p className="text-xs text-muted-foreground">Pag. Tables</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Sample Data */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Amostra de Dados</h3>
          
          {sampleData.clients && sampleData.clients.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Clientes (primeiros 5)</h4>
              <div className="bg-gray-50 p-3 rounded text-xs space-y-1">
                {sampleData.clients.map((client: any, index: number) => (
                  <div key={index} className="flex justify-between">
                    <span>{client.name}</span>
                    <span className="text-gray-500">
                      {Array.isArray(client.visit_days) ? 
                        `[${client.visit_days.join(', ')}]` : 
                        client.visit_days || 'sem dias'
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sampleData.products && sampleData.products.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Produtos (primeiros 3)</h4>
              <div className="bg-gray-50 p-3 rounded text-xs space-y-1">
                {sampleData.products.map((product: any, index: number) => (
                  <div key={index} className="flex justify-between">
                    <span>{product.name}</span>
                    <span className="text-gray-500">R$ {product.sale_price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={loadDiagnostics} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          {isLovableEnvironment() && (
            <Button 
              onClick={resetMockData} 
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Reset Mock Data
            </Button>
          )}
        </div>

        {/* Error Info */}
        {diagnostics?.lastError && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <h4 className="font-medium text-red-800 text-sm mb-1">Último Erro</h4>
            <p className="text-red-700 text-xs">{diagnostics.lastError}</p>
          </div>
        )}

        {/* Technical Info */}
        <div className="bg-gray-50 p-3 rounded">
          <h4 className="font-medium text-sm mb-2">Informações Técnicas</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p>Timestamp: {diagnostics?.timestamp}</p>
            <p>Tabelas: {diagnostics?.tableCount || 0}</p>
            <p>Platform: {navigator.platform}</p>
            <p>UserAgent: {navigator.userAgent.substring(0, 50)}...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileDebugPanel;
