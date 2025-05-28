
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
    <div className="p-2 bg-gradient-to-r from-white to-gray-50 border-t-2 border-gray-200 shadow-lg flex-shrink-0">
      {/* Clear cart button if there are items */}
      {orderItems.length > 0 && (
        <div className="mb-2">
          <AppButton 
            variant="gray" 
            className="flex items-center justify-center h-8 text-sm w-full text-red-600 border-2 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-200 transform hover:scale-[1.02]"
            onClick={onClearCart}
          >
            <Trash2 size={12} className="mr-2" />
            Limpar Carrinho
          </AppButton>
        </div>
      )}
      
      <div className="grid grid-cols-3 gap-2">
        <AppButton 
          variant="gray" 
          className={`flex items-center justify-center h-8 text-sm border-2 transition-all duration-200 ${
            orderItems.length > 0 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:scale-[1.02] transform'
          }`}
          onClick={onGoBack}
        >
          <ArrowLeft size={12} className="mr-2" />
          Voltar
        </AppButton>
        
        <AppButton 
          variant="blue" 
          className="flex items-center justify-center h-8 text-sm border-2 border-app-blue hover:scale-[1.02] transform transition-all duration-200 shadow-sm hover:shadow-md"
          onClick={onViewOrder}
          disabled={orderItems.length === 0}
        >
          <Eye size={12} className="mr-2" />
          Gravar
        </AppButton>
        
        <AppButton 
          variant="blue" 
          className="flex items-center justify-center h-8 text-sm bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-2 border-green-600 hover:scale-[1.02] transform transition-all duration-200 shadow-sm hover:shadow-md"
          onClick={onFinishOrder}
          disabled={orderItems.length === 0 || !selectedClient.id || isSubmitting}
        >
          <ShoppingCart size={12} className="mr-2" />
          {isSubmitting ? (
            <span className="animate-pulse">Salvando...</span>
          ) : (
            'Finalizar'
          )}
        </AppButton>
      </div>
    </div>
  );
};

export default ActionButtons;
