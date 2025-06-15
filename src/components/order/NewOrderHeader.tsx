import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
interface NewOrderHeaderProps {
  onGoBack: () => void;
}
const NewOrderHeader: React.FC<NewOrderHeaderProps> = ({
  onGoBack
}) => {
  return <div className="text-white p-4 shadow-lg bg-blue-700">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onGoBack} className="text-white p-2 bg-sky-500 hover:bg-sky-400">
          <ArrowLeft size={20} />
        </Button>
        <h1 className="font-bold text-base">Digitação de Pedidos</h1>
        <div className="w-10" />
      </div>
    </div>;
};
export default NewOrderHeader;