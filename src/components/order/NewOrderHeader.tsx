
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NewOrderHeaderProps {
  onGoBack: () => void;
  title?: string; // ✅ NOVO: Prop opcional para título dinâmico
}

const NewOrderHeader: React.FC<NewOrderHeaderProps> = ({
  onGoBack,
  title = 'Digitação de Pedidos' // ✅ NOVO: Valor padrão
}) => {
  return (
    <div className="text-white p-4 shadow-lg bg-blue-700">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onGoBack} className="text-white p-2 bg-inherit">
          <ArrowLeft size={20} />
        </Button>
        <h1 className="font-bold text-base">{title}</h1>
        <div className="w-10" />
      </div>
    </div>
  );
};

export default NewOrderHeader;
