
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign, Check } from 'lucide-react';
import OrderOptionsMenu from './OrderOptionsMenu';

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
  onSaveAsDraft: () => void;
  onFinishOrder: () => void;
  selectedClient: {
    id: string;
  };
  isSubmitting: boolean;
  finishButtonText?: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  orderItems,
  onClearCart,
  onGoBack,
  onSaveAsDraft,
  onFinishOrder,
  selectedClient,
  isSubmitting,
  finishButtonText = 'Finalizar'
}) => {
  const hasItems = orderItems.length > 0;
  const canFinish = hasItems && selectedClient.id;

  return (
    <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
      <div className="grid grid-cols-3 gap-3">
        <OrderOptionsMenu onClearCart={onClearCart} hasItems={hasItems} />
        
        <Button
          onClick={onSaveAsDraft}
          disabled={!hasItems}
          className="flex items-center justify-center gap-2 text-white bg-emerald-600 hover:bg-emerald-500 text-sm"
        >
          <DollarSign size={16} />
          Gravar
        </Button>
        
        <Button
          onClick={onFinishOrder}
          disabled={!canFinish || isSubmitting}
          className="flex items-center justify-center gap-2 text-white bg-sky-600 hover:bg-sky-500"
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
