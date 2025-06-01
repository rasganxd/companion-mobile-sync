
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit, Plus, Trash2, DollarSign } from 'lucide-react';

interface OrderChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditOrder: () => void;
  onCreateNew: () => void;
  onDeleteOrder: () => void;
  clientName: string;
  orderTotal: number;
  orderItemsCount: number;
}

const OrderChoiceModal: React.FC<OrderChoiceModalProps> = ({
  isOpen,
  onClose,
  onEditOrder,
  onCreateNew,
  onDeleteOrder,
  clientName,
  orderTotal,
  orderItemsCount
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pedido Existente Encontrado</DialogTitle>
          <DialogDescription>
            O cliente <strong>{clientName}</strong> já possui um pedido pendente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">Pedido Atual:</span>
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(orderTotal)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <DollarSign className="h-4 w-4" />
              <span>{orderItemsCount} item{orderItemsCount !== 1 ? 's' : ''} no pedido</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">O que você gostaria de fazer?</p>
            
            <Button 
              onClick={onEditOrder} 
              className="w-full justify-start" 
              variant="outline"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar Pedido Existente
            </Button>
            
            <Button 
              onClick={onCreateNew} 
              className="w-full justify-start" 
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Novo Pedido (substitui o atual)
            </Button>
            
            <Button 
              onClick={onDeleteOrder} 
              className="w-full justify-start" 
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Pedido Existente
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderChoiceModal;
