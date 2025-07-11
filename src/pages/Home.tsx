
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Route, Package, BarChart3, Settings, Send, LogOut } from 'lucide-react';
import Header from '@/components/Header';
import MenuCard from '@/components/MenuCard';
import { Badge } from '@/components/ui/badge';
import { useLocalSyncStatus } from '@/hooks/useLocalSyncStatus';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Home = () => {
  const navigate = useNavigate();
  const { salesRep, logout } = useAuth();
  const { syncStatus } = useLocalSyncStatus();

  const formatLastSync = () => {
    if (!syncStatus.lastSync) {
      return 'Sem sincronização';
    }
    
    try {
      return format(syncStatus.lastSync, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="SalesTrack Mobile" backgroundColor="blue" />
      
      {/* Informações do vendedor e sincronização */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Vendedor: {salesRep?.name || 'Usuário'}
            </p>
            {salesRep?.code && (
              <p className="text-xs text-gray-600">Código: {salesRep.code}</p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
              <span className="w-2 h-2 mr-1 rounded-full bg-green-500"></span>
              <span>Local</span>
            </div>
            
            {/* Botão de Logout */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="flex items-center justify-center w-8 h-8 bg-red-100 hover:bg-red-200 rounded-full transition-colors">
                  <LogOut size={16} className="text-red-600" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Logout</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja sair do sistema? Você será redirecionado para a tela de login.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
                    Sair
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-600">
            Última sincronização: {formatLastSync()}
          </p>
        </div>
      </div>
      
      <div className="flex-1 p-4 grid grid-cols-2 gap-4">
        <MenuCard
          icon={<Route size={32} />}
          title="Rotas"
          to="/rotas"
        />
        <MenuCard
          icon={<Package size={32} />}
          title="Meus Pedidos"
          to="/my-orders"
        />
        <MenuCard
          icon={<BarChart3 size={32} />}
          title="Relatórios"
          to="/reports"
        />
        <MenuCard
          icon={<Settings size={32} />}
          title="Configurações"
          to="/sync-settings"
        />
        
        {/* Transmit Orders Card with Badge */}
        <div className="relative">
          <MenuCard
            icon={<Send size={32} />}
            title="Transmitir Pedidos"
            to="/transmit-orders"
          />
          {syncStatus.pendingOrdersCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 min-w-[1.5rem] h-6 rounded-full flex items-center justify-center text-xs font-bold"
            >
              {syncStatus.pendingOrdersCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
