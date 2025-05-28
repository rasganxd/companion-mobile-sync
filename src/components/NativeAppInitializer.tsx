
import React, { useEffect, useState, ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { toast } from 'sonner';

interface NativeAppInitializerProps {
  children: ReactNode;
}

export const NativeAppInitializer: React.FC<NativeAppInitializerProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeNativeFeatures = async () => {
      if (!Capacitor.isNativePlatform()) {
        console.log('🌐 Running in web mode, skipping native initialization');
        setIsInitialized(true);
        return;
      }

      try {
        console.log('📱 Initializing native app features...');

        // Configurar StatusBar
        try {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#3B82F6' });
          console.log('✅ StatusBar configured');
        } catch (error) {
          console.warn('⚠️ StatusBar configuration failed:', error);
        }

        // Configurar Keyboard
        try {
          Keyboard.addListener('keyboardWillShow', (info) => {
            console.log('⌨️ Keyboard will show, height:', info.keyboardHeight);
          });
          
          Keyboard.addListener('keyboardWillHide', () => {
            console.log('⌨️ Keyboard will hide');
          });
          console.log('✅ Keyboard listeners configured');
        } catch (error) {
          console.warn('⚠️ Keyboard configuration failed:', error);
        }

        // Esconder SplashScreen após inicialização
        try {
          await SplashScreen.hide();
          console.log('✅ SplashScreen hidden');
        } catch (error) {
          console.warn('⚠️ SplashScreen hide failed:', error);
        }

        console.log('🎉 Native app initialization completed');
        setIsInitialized(true);

      } catch (error) {
        console.error('❌ Native app initialization failed:', error);
        toast.error('Erro na inicialização do app');
        setIsInitialized(true); // Continue mesmo com erro
      }
    };

    initializeNativeFeatures();
  }, []);

  // Mostrar loading enquanto inicializa (apenas para apps nativos)
  if (!isInitialized && Capacitor.isNativePlatform()) {
    return (
      <div className="min-h-screen bg-blue-500 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg font-medium">Iniciando Vendas Fortes...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
