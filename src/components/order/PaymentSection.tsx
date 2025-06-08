
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PaymentTable {
  id: string;
  name: string;
  description?: string;
  type?: string;
  payable_to?: string;
  payment_location?: string;
  active: boolean;
}

interface PaymentSectionProps {
  paymentTables: PaymentTable[];
  selectedPaymentTable: PaymentTable | null;
  onPaymentTableChange: (value: string) => void;
}

const PaymentSection: React.FC<PaymentSectionProps> = ({
  paymentTables,
  selectedPaymentTable,
  onPaymentTableChange
}) => {
  // Debug log para investigar as tabelas de pagamento
  console.log('🔍 PaymentSection - tabelas recebidas:', paymentTables);
  console.log('🔍 PaymentSection - tabela selecionada:', selectedPaymentTable);

  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-3">
        <Label className="text-sm font-medium text-gray-600 block mb-2">Forma de Pagamento:</Label>
        <Select 
          value={selectedPaymentTable?.id || 'none'} 
          onValueChange={onPaymentTableChange}
        >
          <SelectTrigger className="w-full h-9">
            <SelectValue placeholder="Selecione a forma de pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">A definir</SelectItem>
            {paymentTables.length > 0 ? (
              paymentTables.map(table => (
                <SelectItem key={table.id} value={table.id}>
                  {table.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="loading" disabled>
                Carregando formas de pagamento...
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        {paymentTables.length === 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Nenhuma forma de pagamento disponível
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentSection;
