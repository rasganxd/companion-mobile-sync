
import React, { useEffect, useState, ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';

interface NativeAppInitializerProps {
  children: ReactNode;
}

export const NativeAppInitializer: React.FC<NativeAppInitializerProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      console.log('🔧 Initializing app features...');
      console.log('📱 Platform info:', {
        platform: Capacitor.getPlatform(),
        isNative: Capacitor.isNativePlatform(),
        userAgent: navigator.userAgent
      });

      try {
        // Inicializar SQLite para ambiente web primeiro
        if (!Capacitor.isNativePlatform()) {
          console.log('🌐 Web environment detected, initializing jeep-sqlite...');
          await initializeWebSQLite();
        } else {
          console.log('📱 Native environment detected, using native SQLite');
        }

        // Configurar recursos nativos apenas se estivermos em plataforma nativa
        if (Capacitor.isNativePlatform()) {
          await initializeNativeFeatures();
        } else {
          console.log('🌐 Running in web mode, skipping native initialization');
        }

        console.log('🎉 App initialization completed');
        setIsInitialized(true);

      } catch (error) {
        console.error('❌ App initialization failed:', error);
        console.warn('⚠️ Continuing with limited functionality...');
        setIsInitialized(true); // Continue mesmo com erro
      }
    };

    const initializeWebSQLite = async () => {
      try {
        // Dinamicamente importar jeep-sqlite apenas em ambiente web
        const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite');
        
        // Verificar se jeep-sqlite está disponível
        if (typeof window !== 'undefined' && !window.customElements.get('jeep-sqlite')) {
          console.log('📦 Loading jeep-sqlite web component...');
          const jeepSqlite = await import('jeep-sqlite');
          await customElements.whenDefined('jeep-sqlite');
          console.log('✅ jeep-sqlite web component loaded');
        }

        // Inicializar conexão SQLite para web
        const sqlite = new SQLiteConnection(CapacitorSQLite);
        console.log('✅ Web SQLite connection initialized');
        
        // Armazenar a instância globalmente para uso posterior
        (window as any).webSQLiteConnection = sqlite;
        
      } catch (error) {
        console.warn('⚠️ Failed to initialize web SQLite:', error);
        console.log('📝 Will fallback to localStorage if needed');
      }
    };

    const initializeNativeFeatures = async () => {
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

      } catch (error) {
        console.error('❌ Native app initialization failed:', error);
        throw error;
      }
    };

    initializeApp();
  }, []);

  // Mostrar loading apenas para apps nativos ou durante inicialização
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
