
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, ShoppingCart, DollarSign } from 'lucide-react';

interface ExistingOrder {
  id: string;
  date: string;
  total: number;
  items: any[];
  status: string;
}

interface ExistingOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ExistingOrder | null;
  onEditOrder: () => void;
  onCreateNew: () => void;
}

const ExistingOrderModal: React.FC<ExistingOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  onEditOrder,
  onCreateNew
}) => {
  if (!order) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Pedido Existente Encontrado
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart size={20} className="text-blue-600" />
              <span className="font-medium text-blue-900">Detalhes do Pedido</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-500" />
                <span className="text-gray-700">Data: {formatDate(order.date)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-gray-500" />
                <span className="text-gray-700">
                  Total: R$ {order.total.toFixed(2)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} className="text-gray-500" />
                <span className="text-gray-700">
                  {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                </span>
              </div>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mb-4">
            Este cliente já possui um pedido não transmitido. O que você gostaria de fazer?
          </p>
        </div>
        
        <div className="flex flex-col gap-3">
          <Button 
            onClick={onEditOrder}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Editar Pedido Existente
          </Button>
          
          <Button 
            onClick={onCreateNew}
            variant="outline"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Criar Novo Pedido
          </Button>
          
          <Button 
            onClick={onClose}
            variant="ghost"
            className="w-full text-gray-500 hover:bg-gray-50"
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExistingOrderModal;
