
import { useState, useEffect } from 'react';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';

interface PurchaseHistoryItem {
  id: string;
  code: number;
  date: string;
  total: number;
  status: string;
  itemsCount: number;
  source: 'orders';
}

export const useClientPurchaseHistory = (clientId: string) => {
  const [purchases, setPurchases] = useState<PurchaseHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPurchaseHistory = async () => {
      if (!clientId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Fetching purchase history for client UUID from local database:', clientId);
        
        const db = getDatabaseAdapter();
        
        // Buscar pedidos do cliente no banco local
        const orders = await db.getClientOrders(clientId);
        
        console.log(`✅ Found ${orders?.length || 0} orders for client in local database:`, orders);

        // Converter para o formato unificado
        const purchaseHistory: PurchaseHistoryItem[] = (orders || []).map(order => ({
          id: order.id,
          code: order.code || 0,
          date: order.date,
          total: order.total || 0,
          status: order.status || 'pending',
          itemsCount: Array.isArray(order.items) ? order.items.length : 0,
          source: 'orders' as const
        }));

        console.log(`📊 Processed ${purchaseHistory.length} purchase history items:`, purchaseHistory);
        setPurchases(purchaseHistory);
        
      } catch (err) {
        console.error('❌ Error fetching purchase history from local database:', err);
        setError('Erro ao carregar histórico de compras. Execute uma sincronização para atualizar os dados.');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseHistory();
  }, [clientId]);

  const refetch = () => {
    if (clientId) {
      setPurchases([]);
      setLoading(true);
      setError(null);
      // O useEffect irá disparar novamente devido à mudança no estado
    }
  };

  return { purchases, loading, error, refetch };
};
