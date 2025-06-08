
import { useNavigation } from '@/contexts/NavigationContext';
import { useNavigate } from 'react-router-dom';

export const useAppNavigation = () => {
  const { navigateTo: contextNavigateTo, goBack, canGoBack, getCurrentPath } = useNavigation();
  const navigate = useNavigate();

  const navigateTo = (path: string, state?: any) => {
    console.log('🧭 useAppNavigation.navigateTo():', path, state ? 'with state' : 'no state');
    
    if (state) {
      // Usar navigate do React Router quando há estado
      navigate(path, { state });
    } else {
      // Usar contexto de navegação quando não há estado
      contextNavigateTo(path);
    }
  };

  const navigateToHome = () => {
    console.log('🧭 useAppNavigation.navigateToHome()');
    navigateTo('/home');
  };
  
  const navigateToClients = (day?: string) => {
    console.log('🧭 useAppNavigation.navigateToClients()', day || 'no day');
    if (day) {
      // Passar o dia como estado para a tela de clientes
      navigateTo('/clientes-lista', { day });
    } else {
      navigateTo('/clientes-lista');
    }
  };
  
  const navigateToOrders = () => {
    console.log('🧭 useAppNavigation.navigateToOrders()');
    navigateTo('/my-orders');
  };
  
  const navigateToRoutes = () => {
    console.log('🧭 useAppNavigation.navigateToRoutes()');
    navigateTo('/rotas');
  };
  
  const navigateToOrderDetails = (orderId: string) => {
    console.log('🧭 useAppNavigation.navigateToOrderDetails():', orderId);
    navigateTo(`/order-details/${orderId}`);
  };
  
  const navigateToNewOrder = () => {
    console.log('🧭 useAppNavigation.navigateToNewOrder()');
    navigateTo('/new-order');
  };
  
  const navigateToNegativeSale = () => {
    console.log('🧭 useAppNavigation.navigateToNegativeSale()');
    navigateTo('/negativar-venda');
  };
  
  const navigateToLastPurchases = () => {
    console.log('🧭 useAppNavigation.navigateToLastPurchases()');
    navigateTo('/ultimas-compras');
  };
  
  const navigateToMessage = () => {
    console.log('🧭 useAppNavigation.navigateToMessage()');
    navigateTo('/mensagem');
  };
  
  const navigateToCapturePosition = () => {
    console.log('🧭 useAppNavigation.navigateToCapturePosition()');
    navigateTo('/capturar-posicao');
  };
  
  const navigateToSettings = () => {
    console.log('🧭 useAppNavigation.navigateToSettings()');
    navigateTo('/sync-settings');
  };
  
  const navigateToTransmitOrders = () => {
    console.log('🧭 useAppNavigation.navigateToTransmitOrders()');
    navigateTo('/transmit-orders');
  };
  
  const navigateToClientActivities = (clientName: string, clientId: string, day?: string) => {
    console.log('🧭 useAppNavigation.navigateToClientActivities():', clientName, clientId, day || 'no day');
    // Navegar para a nova rota de atividades do cliente com estado
    navigateTo('/client-activities', { clientName, clientId, day });
  };

  const navigateToClientFullScreen = (clients: any[], initialIndex: number = 0, day?: string) => {
    console.log('🧭 useAppNavigation.navigateToClientFullScreen():', clients.length, 'clients, index:', initialIndex, day || 'no day');
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
    navigateToNewOrder,
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
