
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, Trash2, FileText, AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface OrderOptionsMenuProps {
  onClearCart: () => void;
  hasItems: boolean;
}

const OrderOptionsMenu: React.FC<OrderOptionsMenuProps> = ({
  onClearCart,
  hasItems
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearCart = () => {
    setShowClearConfirm(false);
    onClearCart();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2"
          >
            <Settings size={16} />
            Opções
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setShowClearConfirm(true)}
            disabled={!hasItems}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 size={16} className="mr-2" />
            Limpar Carrinho
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <FileText size={16} className="mr-2" />
            Imprimir Pedido
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle size={20} className="text-orange-500" />
              Confirmar Limpeza
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja limpar todos os itens do carrinho? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearCart}
              className="bg-red-600 hover:bg-red-700"
            >
              Limpar Carrinho
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default OrderOptionsMenu;
