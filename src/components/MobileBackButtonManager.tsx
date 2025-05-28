
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useNativeBackButton } from '@/hooks/useNativeBackButton';

export const MobileBackButtonManager = () => {
  // Só inicializar o hook se estivermos em plataforma nativa
  if (Capacitor.isNativePlatform()) {
    useNativeBackButton();
  }

  return null; // Este componente não renderiza nada
};
