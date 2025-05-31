
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

interface NavigationState {
  stack: string[];
  currentIndex: number;
}

interface NavigationContextType {
  navigateTo: (path: string) => void;
  goBack: () => void;
  canGoBack: boolean;
  getCurrentPath: () => string;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// Mapeamento de fluxos de navegação - define para onde cada tela "volta"
const navigationFlows: { [key: string]: string } = {
  '/home': '/home', // Home é a tela raiz - não volta para lugar nenhum
  '/client-activities': '/client-fullscreen', // Lista de atividades volta para fullscreen
  '/client-fullscreen': '/rotas', // Visualização full-screen volta para rotas
  '/clientes-lista': '/rotas', // Lista de clientes volta para rotas (caso ainda seja usada)
  '/rotas': '/home',
  '/my-orders': '/home',
  '/sync-settings': '/home',
  '/transmit-orders': '/home',
  '/place-order': '/client-activities',
  '/negativar-venda': '/client-activities',
  '/ultimas-compras': '/client-activities',
  '/mensagem': '/client-activities',
  '/capturar-posicao': '/client-activities',
  '/order-details': '/my-orders',
  '/client': '/clientes-lista',
};

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [navigationState, setNavigationState] = useState<NavigationState>({
    stack: ['/home'], // Iniciar sempre com /home
    currentIndex: 0
  });

  const isNative = Capacitor.isNativePlatform();

  // Configurar controle de navegação baseado na plataforma
  useEffect(() => {
    console.log(`🔄 Setting up navigation for ${isNative ? 'native' : 'web'} platform...`);
    
    if (isNative) {
      // Para apps nativos, bloquear completamente o histórico do navegador
      console.log('📱 Native platform: Disabling browser history completely');
      
      // Substituir estado do histórico para evitar voltar
      window.history.replaceState(null, '', location.pathname);
      
      // Bloquear eventos de popstate (não deve acontecer em nativo, mas por garantia)
      const blockBrowserBack = (event: PopStateEvent) => {
        console.log('🚫 Browser back blocked in native app');
        event.preventDefault();
        event.stopPropagation();
        window.history.replaceState(null, '', location.pathname);
        return false;
      };

      window.addEventListener('popstate', blockBrowserBack);
      
      return () => {
        window.removeEventListener('popstate', blockBrowserBack);
      };
    } else {
      // Para web, manter o comportamento anterior de bloqueio
      console.log('🌐 Web platform: Using controlled browser history blocking');
      
      const blockBrowserBack = (event: PopStateEvent) => {
        console.log('🚫 Browser back button blocked');
        event.preventDefault();
        event.stopPropagation();
        window.history.pushState(null, '', location.pathname);
        return false;
      };

      window.history.pushState(null, '', location.pathname);
      window.addEventListener('popstate', blockBrowserBack);
      
      const blockKeyboardNavigation = (event: KeyboardEvent) => {
        if (
          (event.altKey && event.key === 'ArrowLeft') ||
          (event.altKey && event.key === 'ArrowRight') ||
          event.key === 'Backspace'
        ) {
          console.log('🚫 Keyboard navigation blocked');
          event.preventDefault();
          event.stopPropagation();
          return false;
        }
      };

      window.addEventListener('keydown', blockKeyboardNavigation);

      return () => {
        window.removeEventListener('popstate', blockBrowserBack);
        window.removeEventListener('keydown', blockKeyboardNavigation);
      };
    }
  }, [location.pathname, isNative]);

  const navigateTo = (path: string) => {
    console.log(`🧭 Navigating to: ${path} (${isNative ? 'native' : 'web'} mode)`);
    
    setNavigationState(prev => {
      const newStack = [...prev.stack, path];
      return {
        stack: newStack,
        currentIndex: newStack.length - 1
      };
    });
    
    // Em apps nativos, usar replace para evitar empilhamento no histórico
    if (isNative) {
      navigate(path, { replace: true });
    } else {
      navigate(path);
    }
  };

  const goBack = () => {
    const currentPath = location.pathname;
    const targetPath = navigationFlows[currentPath] || '/home';
    
    console.log(`⬅️ Going back from ${currentPath} to ${targetPath} (${isNative ? 'native' : 'web'} mode)`);
    
    setNavigationState(prev => {
      // Se já estamos na home, não faz nada
      if (currentPath === '/home') {
        return prev;
      }
      
      // Atualizar stack removendo a tela atual
      const newStack = prev.stack.filter(path => path !== currentPath);
      if (!newStack.includes(targetPath)) {
        newStack.push(targetPath);
      }
      
      return {
        stack: newStack,
        currentIndex: newStack.length - 1
      };
    });
    
    // Em apps nativos, sempre usar replace
    if (isNative) {
      navigate(targetPath, { replace: true });
    } else {
      navigate(targetPath);
    }
  };

  const canGoBack = location.pathname !== '/home';

  const getCurrentPath = () => location.pathname;

  return (
    <NavigationContext.Provider 
      value={{ 
        navigateTo, 
        goBack, 
        canGoBack, 
        getCurrentPath 
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
