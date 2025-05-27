
import React from 'react';
import { ArrowLeft, ShoppingCart, Eye, Trash2 } from 'lucide-react';
import AppButton from '@/components/AppButton';

interface ActionButtonsProps {
  orderItems: any[];
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
  return (
    <div className="p-1.5 bg-white border-t shadow-lg flex-shrink-0">
      {/* Clear cart button if there are items */}
      {orderItems.length > 0 && (
        <div className="mb-1">
          <AppButton 
            variant="gray" 
            className="flex items-center justify-center h-6 text-xs w-full text-red-600 border-red-200 hover:bg-red-50"
            onClick={onClearCart}
          >
            <Trash2 size={10} className="mr-1" />
            Limpar Carrinho
          </AppButton>
        </div>
      )}
      
      <div className="grid grid-cols-3 gap-1.5">
        <AppButton 
          variant="gray" 
          className={`flex items-center justify-center h-6 text-xs ${
            orderItems.length > 0 
              ? 'opacity-50 cursor-not-allowed' 
              : ''
          }`}
          onClick={onGoBack}
        >
          <ArrowLeft size={10} className="mr-1" />
          Voltar
        </AppButton>
        
        <AppButton 
          variant="blue" 
          className="flex items-center justify-center h-6 text-xs"
          onClick={onViewOrder}
          disabled={orderItems.length === 0}
        >
          <Eye size={10} className="mr-1" />
          Gravar
        </AppButton>
        
        <AppButton 
          variant="blue" 
          className="flex items-center justify-center h-6 text-xs bg-green-600 hover:bg-green-700 text-white"
          onClick={onFinishOrder}
          disabled={orderItems.length === 0 || !selectedClient.id || isSubmitting}
        >
          <ShoppingCart size={10} className="mr-1" />
          {isSubmitting ? 'Salvando...' : 'Finalizar'}
        </AppButton>
      </div>
    </div>
  );
};

export default ActionButtons;
