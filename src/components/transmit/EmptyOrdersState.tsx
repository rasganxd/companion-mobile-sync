
import React from 'react';
import { CheckCircle, Send, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyOrdersStateProps {
  type: 'pending' | 'transmitted' | 'error';
}

const EmptyOrdersState: React.FC<EmptyOrdersStateProps> = ({ type }) => {
  const getEmptyStateContent = () => {
    switch (type) {
      case 'pending':
        return {
          icon: <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />,
          title: 'Nenhum pedido pendente',
          description: 'Todos os pedidos foram transmitidos com sucesso!'
        };
      case 'transmitted':
        return {
          icon: <Send className="mx-auto mb-4 text-blue-500" size={48} />,
          title: 'Nenhum pedido transmitido',
          description: 'Pedidos transmitidos aparecerão aqui após a sincronização.'
        };
      case 'error':
        return {
          icon: <AlertTriangle className="mx-auto mb-4 text-orange-500" size={48} />,
          title: 'Nenhum pedido com erro',
          description: 'Ótimo! Não há pedidos com falha na transmissão.'
        };
      default:
        return {
          icon: <CheckCircle className="mx-auto mb-4 text-gray-500" size={48} />,
          title: 'Nenhum pedido encontrado',
          description: 'Não há pedidos para exibir.'
        };
    }
  };

  const content = getEmptyStateContent();

  return (
    <Card>
      <CardContent className="pt-6 text-center">
        {content.icon}
        <h3 className="text-lg font-medium mb-2">{content.title}</h3>
        <p className="text-gray-500">{content.description}</p>
      </CardContent>
    </Card>
  );
};

export default EmptyOrdersState;
