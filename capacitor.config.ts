
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.b59a35aa537b448a9b7f6ed0f1ddcd77',
  appName: 'SalesTrack Mobile',
  webDir: 'dist',
  bundledWebRuntime: true, // Bundle runtime for standalone app
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
      overlaysWebView: true,
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
    backgroundColor: '#3B82F6'
  }
};

export default config;
