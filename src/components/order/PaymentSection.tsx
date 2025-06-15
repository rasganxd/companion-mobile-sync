
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';

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
    <Card className="bg-white shadow-sm border-l-4 border-l-blue-500">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Label className="text-sm font-medium text-gray-700">Forma de Pagamento:</Label>
          <span className="text-red-500 text-sm">*</span>
          {!selectedPaymentTable && paymentTables.length > 0 && (
            <AlertCircle className="h-4 w-4 text-amber-500" />
          )}
        </div>
        
        <Select 
          value={selectedPaymentTable?.id || ''} 
          onValueChange={onPaymentTableChange}
          required
        >
          <SelectTrigger className={`w-full h-10 ${!selectedPaymentTable && paymentTables.length > 0 ? 'border-amber-300 bg-amber-50' : ''}`}>
            <SelectValue placeholder="⚠️ Selecione a forma de pagamento (obrigatório)" />
          </SelectTrigger>
          <SelectContent>
            {paymentTables.length > 0 ? (
              paymentTables.map(table => (
                <SelectItem key={table.id} value={table.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{table.name}</span>
                    {table.description && (
                      <span className="text-xs text-gray-500">{table.description}</span>
                    )}
                  </div>
                </SelectItem>
              ))
            ) : (
              <SelectItem value="loading" disabled>
                Carregando formas de pagamento...
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        
        {!selectedPaymentTable && paymentTables.length > 0 && (
          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Selecionar forma de pagamento é obrigatório
          </p>
        )}
        
        {paymentTables.length === 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Carregando formas de pagamento...
          </p>
        )}

        {selectedPaymentTable && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
            ✅ Forma selecionada: <strong>{selectedPaymentTable.name}</strong>
            {selectedPaymentTable.description && (
              <div className="text-green-600">{selectedPaymentTable.description}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentSection;
