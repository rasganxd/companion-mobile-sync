
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.b59a35aa537b448a9b7f6ed0f1ddcd77',
  appName: 'SalesTrack Mobile',
  webDir: 'dist',
  bundledWebRuntime: false, // Disable for production mobile
  plugins: {
    App: {
      'android:exported': true
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#3B82F6',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#FFFFFF',
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: 'launch_screen',
      useDialog: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#3B82F6',
      overlaysWebView: false,
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
    },
    SQLite: {
      iosDatabaseLocation: 'default',
      androidDatabaseLocation: 'default'
    }
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#3B82F6',
    webContentsDebuggingEnabled: true, // Enable for debugging APK issues
    appendUserAgent: 'SalesTrackMobile'
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#3B82F6',
    appendUserAgent: 'SalesTrackMobile',
    // ✅ NOVA configuração para safe areas no iOS
    preferredContentMode: 'mobile',
    allowsLinkPreview: false,
    scrollEnabled: true,
    overrideUserInterfaceStyle: 'light'
  }
};

export default config;
