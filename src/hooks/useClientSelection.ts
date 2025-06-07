
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';

interface Client {
  id: string;
  name: string;
  company_name?: string;
  sales_rep_id?: string;
}

export const useClientSelection = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientSelection, setShowClientSelection] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showOrderChoice, setShowOrderChoice] = useState(false);
  const [existingOrder, setExistingOrder] = useState<any>(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const db = getDatabaseAdapter();
      const clientsData = await db.getClients();
      console.log('👥 Clientes carregados:', clientsData);
      
      // Remover duplicatas baseadas no ID
      const uniqueClients = clientsData?.reduce((acc: Client[], current: Client) => {
        const existingClient = acc.find(client => client.id === current.id);
        if (!existingClient) {
          acc.push(current);
        }
        return acc;
      }, []) || [];
      
      console.log('👥 Clientes únicos após remoção de duplicatas:', uniqueClients);
      setClients(uniqueClients);
    } catch (error) {
      console.error('❌ Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    }
  };

  const checkExistingOrder = async (customerId: string) => {
    try {
      const db = getDatabaseAdapter();
      const orders = await db.getClientOrders(customerId);
      
      const pendingOrder = orders?.find((order: any) => 
        order.status === 'pending' || order.sync_status === 'pending_sync'
      );
      
      if (pendingOrder) {
        setExistingOrder(pendingOrder);
        setShowOrderChoice(true);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar pedidos existentes:', error);
    }
  };

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setShowClientSelection(false);
    setClientSearchTerm('');
    checkExistingOrder(client.id);
  };

  const handleEditOrder = () => {
    setShowOrderChoice(false);
    toast.info('Editando pedido existente');
  };

  const handleCreateNew = () => {
    setShowOrderChoice(false);
    setExistingOrder(null);
    toast.info('Criando novo pedido');
  };

  const handleDeleteOrder = async () => {
    if (!existingOrder) return;
    
    try {
      const db = getDatabaseAdapter();
      await db.deleteOrder(existingOrder.id);
      setShowOrderChoice(false);
      setExistingOrder(null);
      toast.success('Pedido existente excluído');
    } catch (error) {
      console.error('❌ Erro ao excluir pedido:', error);
      toast.error('Erro ao excluir pedido');
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    (client.company_name && client.company_name.toLowerCase().includes(clientSearchTerm.toLowerCase()))
  );

  return {
    clients,
    selectedClient,
    showClientSelection,
    clientSearchTerm,
    showOrderChoice,
    existingOrder,
    filteredClients,
    setSelectedClient,
    setShowClientSelection,
    setClientSearchTerm,
    setShowOrderChoice,
    selectClient,
    handleEditOrder,
    handleCreateNew,
    handleDeleteOrder
  };
};
