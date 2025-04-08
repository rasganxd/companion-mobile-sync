
import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import AppButton from '@/components/AppButton';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const LastPurchases = () => {
  const [date, setDate] = useState<Date | undefined>(new Date('2025-03-03'));
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewMode, setViewMode] = useState<'details' | 'calendar'>('details');
  const navigate = useNavigate();

  // Dados de exemplo para uma compra
  const purchaseDetails = {
    date: '03/03/2025',
    total: 'R$ 225,00',
    items: [
      {
        id: '700',
        name: 'CX-HEINEKEN 600ML',
        quantity: 3.0,
        value: 'R$ 225.0',
        table: 1,
        deviation: 0.0,
        type: ''
      }
    ]
  };

  const handleDateSelect = (date: Date | undefined) => {
    setDate(date);
    setShowCalendar(false);
    setViewMode('details');
  };

  const handleCalendarToggle = () => {
    setViewMode('calendar');
  };
  
  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header title="Ultimas Compras" showBackButton backgroundColor={viewMode === 'details' ? 'gray' : 'orange'} />
      
      {viewMode === 'details' ? (
        <div className="p-4 flex-1 flex flex-col">
          <div>
            <div className="font-semibold mb-2">Data Selecionada:</div>
            <div className="text-2xl">{purchaseDetails.date}</div>
          </div>
          
          <div className="mt-4">
            <div className="font-semibold mb-2">Valor Total:</div>
            <div className="text-2xl">{purchaseDetails.total}</div>
          </div>
          
          <div className="mt-4">
            <div className="font-semibold mb-2">Filtro:</div>
          </div>
          
          <div className="mt-2 bg-gray-400 text-white p-2">
            <div className="grid grid-cols-5 gap-2 font-medium">
              <div>Produto</div>
              <div>Qtd</div>
              <div>Valor</div>
              <div>Tabela</div>
              <div>Dev./Tipo</div>
            </div>
          </div>
          
          {purchaseDetails.items.map((item, index) => (
            <div key={index} className="border border-gray-300 p-2">
              <div className="font-medium">[{item.id}] {item.name}</div>
              <div className="grid grid-cols-5 gap-2 mt-1">
                <div>{item.quantity}</div>
                <div>{item.value}</div>
                <div>{item.table}</div>
                <div>{item.deviation}</div>
                <div>{item.type}</div>
              </div>
            </div>
          ))}
          
          <div className="mt-auto space-y-3">
            <AppButton 
              variant="purple" 
              fullWidth 
              className="flex items-center justify-center gap-2"
              onClick={handleCalendarToggle}
            >
              Trocar data <CalendarIcon size={20} />
            </AppButton>
            
            <AppButton 
              variant="gray" 
              fullWidth 
              className="flex items-center justify-center gap-2"
              onClick={handleGoBack}
            >
              <ArrowLeft size={20} />
              <span>Voltar</span>
            </AppButton>
          </div>
        </div>
      ) : (
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex justify-center mb-4">
            <label className="inline-flex items-center">
              <input 
                type="radio" 
                className="form-radio" 
                name="filter" 
                value="todos" 
                checked 
              />
              <span className="ml-2">Todos</span>
            </label>
          </div>
          
          <div className="text-center mb-4">
            <div className="flex justify-between items-center mb-4">
              <button className="p-2">&lt;</button>
              <h3 className="text-2xl font-bold text-purple-900">
                {format(date || new Date(), 'MMMM - yyyy', { locale: ptBR })}
              </h3>
              <button className="p-2">&gt;</button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-sm">
              <div>dom.</div>
              <div>seg.</div>
              <div>ter.</div>
              <div>qua.</div>
              <div>qui.</div>
              <div>sex.</div>
              <div>sáb.</div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mt-2">
              {[...Array(30)].map((_, i) => (
                <button 
                  key={i} 
                  className="aspect-square bg-purple-100 rounded-lg flex items-center justify-center p-2"
                  onClick={() => handleDateSelect(new Date(2025, 3, i + 1))}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-6">
            <p className="text-xl text-center">
              Selecione um dia do mês para ver as compras.
            </p>
            <p className="text-center mt-4 font-medium">
              Nenhuma compra encontrada para o filtro selecionado
            </p>
          </div>
          
          <div className="mt-auto">
            <AppButton 
              variant="gray" 
              fullWidth 
              className="flex items-center justify-center gap-2"
              onClick={handleGoBack}
            >
              <ArrowLeft size={20} />
              <span>Voltar</span>
            </AppButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default LastPurchases;
