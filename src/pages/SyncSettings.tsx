
import React from 'react';
import { Database, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useLocalSyncStatus } from '@/hooks/useLocalSyncStatus';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SyncSettings = () => {
  const navigate = useNavigate();
  const { syncStatus } = useLocalSyncStatus();

  const formatLastSync = () => {
    if (!syncStatus.lastSync) {
      return 'Nunca sincronizado';
    }
    
    try {
      return format(syncStatus.lastSync, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Configurações de Sync" 
        showBackButton={true} 
        backgroundColor="blue" 
      />
      
      <div className="p-4 flex-1">
        {/* Sync Method Card */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
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
              <div className="text-sm text-gray-600 mb-2">
                ✅ Dados salvos localmente no dispositivo<br/>
                ✅ Funciona completamente offline<br/>
                ✅ Pedidos aguardam transmissão para o desktop
              </div>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
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
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <div className="flex items-center">
              <Clock size={20} className="text-blue-500 mr-2" />
              <span className="text-blue-700 text-sm">
                Sistema funcionando em modo local - dados salvos no dispositivo
              </span>
            </div>
          </div>
        </div>
        
        {/* Info Card */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Informações do Sistema</h2>
          
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              <strong>Configuração Atual:</strong> Sistema Local (Offline-First)
            </div>
            
            <div className="text-sm text-gray-600">
              <strong>Armazenamento:</strong> SQLite Local
            </div>
            
            <div className="text-sm text-gray-600">
              <strong>Transmissão:</strong> Via sincronização com desktop
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncSettings;
