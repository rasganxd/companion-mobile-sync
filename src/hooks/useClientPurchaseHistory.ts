
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
        
        console.log('🔍 Fetching purchase history for client UUID:', clientId);
        
        // Buscar pedidos diretamente da tabela orders via Supabase
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id,
            code,
            date,
            total,
            status,
            customer_id,
            customer_name
          `)
          .eq('customer_id', clientId)
          .order('date', { ascending: false })
          .limit(20);

        if (ordersError) {
          console.error('❌ Error fetching orders:', ordersError);
          throw ordersError;
        }

        console.log(`✅ Found ${orders?.length || 0} orders for client:`, orders);

        // Buscar itens dos pedidos para contar quantidade
        const orderIds = orders?.map(order => order.id) || [];
        let orderItemsCounts: { [key: string]: number } = {};

        if (orderIds.length > 0) {
          const { data: orderItems, error: itemsError } = await supabase
            .from('order_items')
            .select('order_id')
            .in('order_id', orderIds);

          if (!itemsError && orderItems) {
            orderItemsCounts = orderItems.reduce((acc, item) => {
              acc[item.order_id] = (acc[item.order_id] || 0) + 1;
              return acc;
            }, {} as { [key: string]: number });
          }
        }

        // Converter para o formato unificado
        const purchaseHistory: PurchaseHistoryItem[] = (orders || []).map(order => ({
          id: order.id,
          code: order.code || 0,
          date: order.date,
          total: order.total || 0,
          status: order.status || 'pending',
          itemsCount: orderItemsCounts[order.id] || 0,
          source: 'orders' as const
        }));

        console.log(`📊 Processed ${purchaseHistory.length} purchase history items:`, purchaseHistory);
        setPurchases(purchaseHistory);
        
      } catch (err) {
        console.error('❌ Error fetching purchase history:', err);
        setError('Erro ao carregar histórico de compras');
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
