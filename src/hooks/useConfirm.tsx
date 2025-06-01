
import { useState } from 'react';

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
}

export const useConfirm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: '',
    description: ''
  });
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = (confirmOptions: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions({
        ...confirmOptions,
        confirmText: confirmOptions.confirmText || 'Confirmar',
        cancelText: confirmOptions.cancelText || 'Cancelar'
      });
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  };

  const handleConfirm = () => {
    if (resolvePromise) {
      resolvePromise(true);
    }
    setIsOpen(false);
    setResolvePromise(null);
  };

  const handleCancel = () => {
    if (resolvePromise) {
      resolvePromise(false);
    }
    setIsOpen(false);
    setResolvePromise(null);
  };

  return {
    isOpen,
    options,
    confirm,
    handleConfirm,
    handleCancel
  };
};
