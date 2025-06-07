
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingCart, Eye, Trash2, Check } from 'lucide-react';

interface OrderItem {
  id: number;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  code: string;
  unit: string;
}

interface ActionButtonsProps {
  orderItems: OrderItem[];
  onClearCart: () => void;
  onGoBack: () => void;
  onViewOrder: () => void;
  onFinishOrder: () => void;
  selectedClient: { id: string };
  isSubmitting: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  orderItems,
  onClearCart,
  onGoBack,
  onViewOrder,
  onFinishOrder,
  selectedClient,
  isSubmitting
}) => {
  const hasItems = orderItems.length > 0;
  const canFinish = hasItems && selectedClient.id;

  return (
    <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
      <div className="grid grid-cols-2 gap-3">
        {/* Primeira linha */}
        <Button 
          variant="outline" 
          onClick={onGoBack}
          className="flex items-center justify-center gap-2"
        >
          <ArrowLeft size={16} />
          Voltar
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onClearCart}
          disabled={!hasItems}
          className="flex items-center justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
        >
          <Trash2 size={16} />
          Limpar
        </Button>
        
        {/* Segunda linha */}
        <Button 
          variant="outline" 
          onClick={onViewOrder}
          disabled={!hasItems}
          className="flex items-center justify-center gap-2"
        >
          <Eye size={16} />
          Visualizar
        </Button>
        
        <Button 
          onClick={onFinishOrder}
          disabled={!canFinish || isSubmitting}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Salvando...
            </>
          ) : (
            <>
              <Check size={16} />
              Finalizar
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ActionButtons;
