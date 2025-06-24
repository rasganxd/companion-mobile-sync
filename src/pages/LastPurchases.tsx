
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowLeft, Package, RefreshCw, Filter } from 'lucide-react';
import Header from '@/components/Header';
import AppButton from '@/components/AppButton';
import PurchaseHistoryCard from '@/components/clients/PurchaseHistoryCard';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useClientPurchaseHistory } from '@/hooks/useClientPurchaseHistory';

const LastPurchases = () => {
  const { goBack, navigateToViewOrderDetails } = useAppNavigation();
  const location = useLocation();
  const [filterPeriod, setFilterPeriod] = useState<'all' | '30d' | '6m'>('all');
  
  const { clientName, clientId, day } = location.state || {};
  
  const { purchases, loading, error, refetch } = useClientPurchaseHistory(clientId);

  const handleViewDetails = (purchaseId: string) => {
    navigateToViewOrderDetails(purchaseId);
  };

  const handleRefresh = () => {
    refetch();
  };

  if (!clientId || !clientName) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header title="Últimas Compras" showBackButton backgroundColor="blue" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-lg">Dados do cliente não encontrados</div>
          </div>
        </div>
      </div>
    );
  }

  const filteredPurchases = purchases.filter(purchase => {
    if (filterPeriod === 'all') return true;
    
    const purchaseDate = new Date(purchase.date);
    const now = new Date();
    
    if (filterPeriod === '30d') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return purchaseDate >= thirtyDaysAgo;
    }
    
    if (filterPeriod === '6m') {
      const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
      return purchaseDate >= sixMonthsAgo;
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title={`Últimas Compras - ${clientName}`} showBackButton backgroundColor="blue" />
      
      <div className="flex-1 p-4">
        {/* Filtros e ações */}
        <div className="bg-white rounded-lg shadow p-3 mb-4">
          <div className="flex justify-between items-center gap-3">
            <div className="flex gap-2">
              <select 
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value as any)}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">Todos os períodos</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="6m">Últimos 6 meses</option>
              </select>
            </div>
            
            <AppButton 
              variant="gray"
              onClick={handleRefresh}
              className="text-xs py-1 px-2 flex items-center gap-1"
              disabled={loading}
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Atualizar
            </AppButton>
          </div>
        </div>

        {/* Conteúdo principal */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center text-gray-500">
              <RefreshCw size={48} className="mx-auto mb-4 text-gray-400 animate-spin" />
              <h2 className="text-lg font-semibold mb-2">Carregando histórico</h2>
              <p className="text-sm">Buscando últimas compras...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center text-red-500">
              <Package size={48} className="mx-auto mb-4 text-red-400" />
              <h2 className="text-lg font-semibold mb-2">Erro ao carregar</h2>
              <p className="text-sm mb-4">{error}</p>
              <AppButton variant="blue" onClick={handleRefresh}>
                Tentar novamente
              </AppButton>
            </div>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center text-gray-500">
              <Package size={48} className="mx-auto mb-4 text-gray-400" />
              <h2 className="text-lg font-semibold mb-2">Nenhuma compra encontrada</h2>
              <p className="text-sm">
                {filterPeriod === 'all' 
                  ? `O cliente ${clientName} ainda não possui histórico de compras.`
                  : `Nenhuma compra encontrada no período selecionado.`
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-600 mb-3">
              {filteredPurchases.length} compra(s) encontrada(s)
            </div>
            
            {filteredPurchases.map(purchase => (
              <PurchaseHistoryCard
                key={purchase.id}
                purchase={purchase}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}
      </div>
      
      <div className="p-3 bg-white border-t">
        <AppButton 
          variant="gray"
          fullWidth
          onClick={goBack}
          className="flex items-center justify-center gap-2"
        >
          <ArrowLeft size={18} />
          <span>Voltar</span>
        </AppButton>
      </div>
    </div>
  );
};

export default LastPurchases;
