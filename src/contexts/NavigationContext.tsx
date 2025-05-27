
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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
  '/': '/home',
  '/home': '/home', // Home não volta para lugar nenhum
  '/clientes-lista': '/rotas',
  '/rotas': '/home',
  '/my-orders': '/home',
  '/sync-settings': '/home',
  '/transmit-orders': '/home',
  '/place-order': '/',
  '/negativar-venda': '/',
  '/ultimas-compras': '/',
  '/mensagem': '/',
  '/capturar-posicao': '/',
  '/order-details': '/my-orders',
  '/client': '/clientes-lista',
};

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [navigationState, setNavigationState] = useState<NavigationState>({
    stack: ['/home'],
    currentIndex: 0
  });

  // Bloquear completamente o botão de voltar do navegador/celular
  useEffect(() => {
    const blockBrowserBack = (event: PopStateEvent) => {
      console.log('🚫 Browser back button blocked');
      event.preventDefault();
      event.stopPropagation();
      
      // Força a manutenção da URL atual
      window.history.pushState(null, '', location.pathname);
      return false;
    };

    // Adicionar estado inicial para bloquear voltar
    window.history.pushState(null, '', location.pathname);
    
    // Escutar e bloquear eventos de voltar
    window.addEventListener('popstate', blockBrowserBack);
    
    // Bloquear também eventos de teclado (Alt+Left, etc)
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
  }, [location.pathname]);

  const navigateTo = (path: string) => {
    console.log(`🧭 Navigating to: ${path}`);
    
    setNavigationState(prev => {
      const newStack = [...prev.stack, path];
      return {
        stack: newStack,
        currentIndex: newStack.length - 1
      };
    });
    
    navigate(path);
  };

  const goBack = () => {
    const currentPath = location.pathname;
    const targetPath = navigationFlows[currentPath] || '/home';
    
    console.log(`⬅️ Going back from ${currentPath} to ${targetPath}`);
    
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
    
    navigate(targetPath);
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
