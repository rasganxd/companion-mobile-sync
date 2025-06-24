
import { useState, useEffect } from 'react';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';

interface PurchaseHistoryItem {
  id: string;
  code: number;
  date: string;
  total: number;
  status: string;
  itemsCount: number;
  source: 'orders' | 'mobile_orders';
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
        
        const db = getDatabaseAdapter();
        
        // Buscar pedidos das duas tabelas
        const [orders, mobileOrders] = await Promise.all([
          db.getClientOrders(clientId),
          db.getAllOrders() // Depois filtraremos pelo customer_id
        ]);

        // Filtrar mobile orders pelo customer_id
        const clientMobileOrders = mobileOrders.filter(order => 
          order.customer_id === clientId
        );

        // Converter pedidos para o formato unificado
        const orderHistory: PurchaseHistoryItem[] = orders.map(order => ({
          id: order.id,
          code: order.code || 0,
          date: order.date,
          total: order.total || 0,
          status: order.status || 'pending',
          itemsCount: Array.isArray(order.items) ? order.items.length : 0,
          source: 'orders' as const
        }));

        const mobileOrderHistory: PurchaseHistoryItem[] = clientMobileOrders.map(order => ({
          id: order.id,
          code: order.code || 0,
          date: order.date,
          total: order.total || 0,
          status: order.status || 'pending',
          itemsCount: 0, // Mobile orders podem não ter items facilmente acessíveis
          source: 'mobile_orders' as const
        }));

        // Combinar e ordenar por data (mais recentes primeiro)
        const allPurchases = [...orderHistory, ...mobileOrderHistory]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 20); // Limitar aos últimos 20 pedidos

        setPurchases(allPurchases);
      } catch (err) {
        console.error('Erro ao buscar histórico de compras:', err);
        setError('Erro ao carregar histórico de compras');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseHistory();
  }, [clientId]);

  return { purchases, loading, error, refetch: () => {
    if (clientId) {
      setPurchases([]);
      setLoading(true);
      setError(null);
    }
  }};
};
