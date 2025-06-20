
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.b59a35aa537b448a9b7f6ed0f1ddcd77',
  appName: 'SalesTrack Mobile',
  webDir: 'dist',
  bundledWebRuntime: true,
  plugins: {
    App: {
      'android:exported': true
    },
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#3B82F6',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#999999',
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: 'launch_screen',
      useDialog: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#3B82F6',
      overlaysWebView: false, // Mudança importante: não sobrepor o conteúdo
      androidStatusBarBackgroundColor: '#3B82F6'
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true,
    },
    Network: {
      enabled: true
    },
    Camera: {
      enabled: true
    }
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#3B82F6',
    webContentsDebuggingEnabled: false
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#3B82F6',
    // Melhor suporte para safe areas no iOS
    preferredContentMode: 'mobile'
  }
};

export default config;
