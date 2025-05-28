
import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyOrdersStateProps {
  type: 'pending' | 'transmitted';
}

const EmptyOrdersState: React.FC<EmptyOrdersStateProps> = ({ type }) => {
  if (type === 'pending') {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <CheckCircle className="mx-auto mb-2 text-green-500" size={24} />
          <p className="text-gray-500 mb-2">Não há pedidos pendentes para transmitir</p>
          <p className="text-sm text-gray-400">Todos os pedidos foram transmitidos com sucesso!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 text-center">
        <AlertCircle className="mx-auto mb-2 text-gray-400" size={24} />
        <p className="text-gray-500 mb-2">Nenhum pedido transmitido encontrado</p>
        <p className="text-sm text-gray-400">Pedidos aparecerão aqui após serem transmitidos</p>
      </CardContent>
    </Card>
  );
};

export default EmptyOrdersState;
