
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
  goBackWithState: (state?: any) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// Mapeamento de fluxos de navegação - define para onde cada tela "volta"
const navigationFlows: { [key: string]: string } = {
  '/home': '/home', // Home é a tela raiz - não volta para lugar nenhum
  '/client-activities': '/clients-list', // Lista de atividades volta para a lista de clientes
  '/client-fullscreen': '/rotas', // Visualização full-screen volta para rotas
  '/clients-list': '/rotas', // Lista de clientes volta para rotas
  '/rotas': '/home',
  '/my-orders': '/home',
  '/sync-settings': '/home',
  '/transmit-orders': '/home',
  '/new-order': '/client-activities', // ✅ CORRIGIDO: Novo pedido volta para atividades do cliente
  '/negativar-venda': '/client-activities',
  '/ultimas-compras': '/client-activities',
  '/mensagem': '/client-activities',
  '/capturar-posicao': '/client-activities',
  '/order-details': '/my-orders',
  '/view-order-details': '/transmit-orders', // Nova rota volta para transmissão
  '/client': '/clients-list',
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
    console.log(`🔄 NavigationContext: Setting up navigation for ${isNative ? 'native' : 'web'} platform...`);
    
    if (isNative) {
      // Para apps nativos, gerenciamento mais suave do histórico
      console.log('📱 Native platform: Using controlled navigation with less aggressive history blocking');
      
      // Substituir estado do histórico apenas uma vez
      window.history.replaceState({ managed: true }, '', location.pathname);
      
      // Listener mais suave para popstate em apps nativos
      const handleNativeNavigation = (event: PopStateEvent) => {
        console.log('📱 Native navigation event detected:', {
          pathname: location.pathname,
          state: event.state
        });
        
        // Permitir navegação natural, mas registrar
        if (!event.state?.managed) {
          console.log('📱 Unmanaged navigation detected, managing state');
          window.history.replaceState({ managed: true }, '', location.pathname);
        }
      };

      window.addEventListener('popstate', handleNativeNavigation);
      
      return () => {
        window.removeEventListener('popstate', handleNativeNavigation);
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
        // Verificar se estamos em um elemento editável
        const target = event.target as HTMLElement;
        const isEditableElement = 
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' ||
          target.contentEditable === 'true' ||
          target.isContentEditable;

        if (
          (event.altKey && event.key === 'ArrowLeft') ||
          (event.altKey && event.key === 'ArrowRight') ||
          (event.key === 'Backspace' && !isEditableElement) // Só bloquear Backspace se NÃO estivermos em campo editável
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
    console.log(`🧭 NavigationContext: Navigating to: ${path} (${isNative ? 'native' : 'web'} mode)`);
    
    setNavigationState(prev => {
      const newStack = [...prev.stack, path];
      return {
        stack: newStack,
        currentIndex: newStack.length - 1
      };
    });
    
    // Para apps nativos, usar replace apenas quando necessário (não sempre)
    if (isNative && (path === '/login' || path === '/home')) {
      console.log('📱 Using replace navigation for:', path);
      navigate(path, { replace: true });
    } else {
      console.log('📱 Using push navigation for:', path);
      navigate(path);
    }
  };

  const goBack = () => {
    const currentPath = location.pathname;
    
    // Para rotas dinâmicas como /view-order-details/:orderId, usar o padrão base
    let pathKey = currentPath;
    if (currentPath.startsWith('/view-order-details/')) {
      pathKey = '/view-order-details';
    }
    
    const targetPath = navigationFlows[pathKey] || '/home';
    
    console.log(`⬅️ NavigationContext: Going back from ${currentPath} to ${targetPath} (${isNative ? 'native' : 'web'} mode)`);
    
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
    
    // Para navegação de volta, usar push ao invés de replace para preservar histórico
    navigate(targetPath);
  };

  const goBackWithState = (state?: any) => {
    const currentPath = location.pathname;
    
    // Para rotas dinâmicas como /view-order-details/:orderId, usar o padrão base
    let pathKey = currentPath;
    if (currentPath.startsWith('/view-order-details/')) {
      pathKey = '/view-order-details';
    }
    
    const targetPath = navigationFlows[pathKey] || '/home';
    
    console.log(`⬅️ NavigationContext: Going back with state from ${currentPath} to ${targetPath}`, state ? 'with state' : 'no state');
    
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
    
    // Navegar com state se fornecido
    if (state) {
      navigate(targetPath, { state });
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
        getCurrentPath,
        goBackWithState
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
