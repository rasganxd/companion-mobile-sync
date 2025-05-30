import { useNavigation } from '@/contexts/NavigationContext';
import { useNavigate } from 'react-router-dom';

export const useAppNavigation = () => {
  const { navigateTo: contextNavigateTo, goBack, canGoBack, getCurrentPath } = useNavigation();
  const navigate = useNavigate();

  const navigateTo = (path: string, state?: any) => {
    if (state) {
      // Usar navigate do React Router quando há estado
      navigate(path, { state });
    } else {
      // Usar contexto de navegação quando não há estado
      contextNavigateTo(path);
    }
  };

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
  const navigateToCapturePosition = () => navigateTo('/capturar-posicao');
  const navigateToSettings = () => navigateTo('/sync-settings');
  const navigateToTransmitOrders = () => navigateTo('/transmit-orders');
  const navigateToClientActivities = (clientName: string, clientId: string, day?: string) => {
    // Navegar para a nova rota de atividades do cliente
    navigateTo('/client-activities');
  };

  const navigateToClientFullScreen = (clients: any[], initialIndex: number = 0, day?: string) => {
    navigateTo('/client-fullscreen', { clients, initialIndex, day });
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
    navigateToCapturePosition,
    navigateToSettings,
    navigateToTransmitOrders,
    navigateToClientActivities,
    navigateToClientFullScreen,
  };
};
