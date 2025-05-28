
import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useNavigation } from '@/contexts/NavigationContext';

export const useNativeBackButton = () => {
  const { goBack, canGoBack, getCurrentPath } = useNavigation();

  useEffect(() => {
    console.log('🔄 Setting up native back button handler...');
    
    const handleBackButton = async () => {
      const currentPath = getCurrentPath();
      console.log(`📱 Physical back button pressed on: ${currentPath}`);
      
      // Se estamos na home, minimizar o app ao invés de sair
      if (!canGoBack || currentPath === '/home') {
        console.log('📱 On home screen, minimizing app...');
        App.minimizeApp();
        return;
      }
      
      // Caso contrário, usar navegação interna
      console.log('📱 Using internal navigation...');
      goBack();
    };

    // Registrar listener para o botão físico de voltar
    const backButtonListener = App.addListener('backButton', handleBackButton);
    
    return () => {
      console.log('🧹 Cleaning up native back button handler...');
      backButtonListener.remove();
    };
  }, [goBack, canGoBack, getCurrentPath]);
};
