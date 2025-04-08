
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.b59a35aa537b448a9b7f6ed0f1ddcd77',
  appName: 'companion-mobile-sync',
  webDir: 'dist',
  server: {
    url: 'https://b59a35aa-537b-448a-9b7f-6ed0f1ddcd77.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  bundledWebRuntime: false
};

export default config;
