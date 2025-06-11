
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
      
      // Se estamos na tela de login, também minimizar (evitar loop)
      if (currentPath === '/login') {
        console.log('📱 On login screen, minimizing app...');
        App.minimizeApp();
        return;
      }
      
      // Caso contrário, usar navegação interna
      console.log('📱 Using internal navigation...');
      goBack();
    };

    // Registrar listener para o botão físico de voltar
    let backButtonListener: any = null;
    
    const setupListener = async () => {
      try {
        backButtonListener = await App.addListener('backButton', handleBackButton);
        console.log('✅ Native back button listener registered successfully');
      } catch (error) {
        console.error('❌ Failed to register native back button listener:', error);
      }
    };
    
    setupListener();
    
    return () => {
      console.log('🧹 Cleaning up native back button handler...');
      if (backButtonListener) {
        try {
          backButtonListener.remove();
          console.log('✅ Native back button listener removed successfully');
        } catch (error) {
          console.error('❌ Error removing native back button listener:', error);
        }
      }
    };
  }, [goBack, canGoBack, getCurrentPath]);
};
