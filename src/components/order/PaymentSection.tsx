import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard } from 'lucide-react';

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
  return (
    <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300 animate-scale-in">
      <CardContent className="p-4">
        <Label className="text-sm font-semibold text-gray-700 block mb-3 flex items-center gap-2">
          <CreditCard size={16} className="text-blue-600" />
          Forma de Pagamento:
        </Label>
        <Select 
          value={selectedPaymentTable?.id || 'none'} 
          onValueChange={onPaymentTableChange}
        >
          <SelectTrigger className="w-full h-12 bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-md focus:shadow-lg focus:border-blue-500">
            <SelectValue placeholder="Selecione a forma de pagamento" />
          </SelectTrigger>
          <SelectContent className="bg-white shadow-xl border-0 animate-scale-in">
            <SelectItem 
              value="none" 
              className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 cursor-pointer"
            >
              A definir
            </SelectItem>
            {paymentTables.map(table => (
              <SelectItem 
                key={table.id} 
                value={table.id}
                className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 cursor-pointer"
              >
                {table.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};

export default PaymentSection;
