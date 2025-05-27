
import { useNavigation } from '@/contexts/NavigationContext';

export const useAppNavigation = () => {
  const { navigateTo, goBack, canGoBack, getCurrentPath } = useNavigation();

  const navigateToHome = () => navigateTo('/home');
  const navigateToClients = (day?: string) => {
    if (day) {
      // Simular state passando pela URL ou context se necessário
      navigateTo('/clientes-lista');
    } else {
      navigateTo('/clientes-lista');
    }
  };
  const navigateToOrders = () => navigateTo('/my-orders');
  const navigateToRoutes = () => navigateTo('/rotas');
  const navigateToOrderDetails = (orderId: string) => navigateTo(`/order-details/${orderId}`);
  const navigateToPlaceOrder = () => navigateTo('/place-order');
  const navigateToNegativeSale = () => navigateTo('/negativar-venda');
  const navigateToLastPurchases = () => navigateTo('/ultimas-compras');
  const navigateToMessage = () => navigateTo('/mensagem');
  const navigateToSettings = () => navigateTo('/sync-settings');
  const navigateToTransmitOrders = () => navigateTo('/transmit-orders');
  const navigateToClientActivities = (clientName: string, clientId: string, day?: string) => {
    // Navegar para a nova rota de atividades do cliente
    navigateTo('/client-activities');
  };

  return {
    navigateTo,
    goBack,
    canGoBack,
    getCurrentPath,
    navigateToHome,
    navigateToClients,
    navigateToOrders,
    navigateToRoutes,
    navigateToOrderDetails,
    navigateToPlaceOrder,
    navigateToNegativeSale,
    navigateToLastPurchases,
    navigateToMessage,
    navigateToSettings,
    navigateToTransmitOrders,
    navigateToClientActivities,
  };
};
