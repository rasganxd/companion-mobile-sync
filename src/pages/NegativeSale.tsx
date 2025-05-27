
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import AppButton from '@/components/AppButton';
import { ArrowLeft, AlertTriangle, Check, X } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { toast } from 'sonner';

const NegativeSale = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientId, clientName } = location.state || { clientId: null, clientName: 'Cliente' };
  
  const [reason, setReason] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  useEffect(() => {
    if (!clientId) {
      toast.error("Nenhum cliente selecionado");
      navigate(-1);
    }
  }, [clientId, navigate]);

  const handleCancel = () => {
    navigate(-1);
  };

  const handleConfirm = async () => {
    if (!reason) {
      toast.error("Por favor selecione um motivo");
      return;
    }

    try {
      setIsLoading(true);
      const db = getDatabaseAdapter();
      
      // Create a negative sale record locally
      const order = {
        id: `neg_${Date.now()}`, // Local ID with negative prefix
        customer_id: clientId,
        customer_name: clientName,
        date: new Date().toISOString(),
        status: "negativado",
        reason: reason,
        notes: message,
        items: [],
        total: 0,
        sync_status: "pending_sync", // Offline status
        source_project: "mobile",
        payment_method: "N/A"
      };
      
      await db.saveOrder(order);
      
      // Update client status locally
      await db.updateClientStatus(clientId, "Negativado");
      
      console.log('📱 Negative sale saved locally:', order);
      toast.success("Venda negativada localmente! Use 'Transmitir Pedidos' para enviar ao servidor.");
      
      navigate('/clientes-lista', { state: { day: location.state?.day || 'Segunda' } });
    } catch (error) {
      console.error("Error saving negative sale:", error);
      toast.error("Falha ao registrar venda negativada localmente");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Negativar Venda" 
        backgroundColor="orange"
        showBackButton
      />
      
      {clientName && (
        <div className="bg-red-600 text-white px-3 py-1 text-xs">
          <span className="font-semibold">{clientId}</span> - {clientName}
        </div>
      )}
      
      <ScrollArea className="flex-1 px-4 py-4">
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h3 className="text-lg font-medium">Motivo da Negativação</h3>
            </div>
            
            <RadioGroup value={reason} onValueChange={setReason} className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cliente_fechado" id="cliente_fechado" />
                <Label htmlFor="cliente_fechado">Cliente Fechado</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sem_interesse" id="sem_interesse" />
                <Label htmlFor="sem_interesse">Sem Interesse</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inadimplencia" id="inadimplencia" />
                <Label htmlFor="inadimplencia">Inadimplência</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="estoque_suficiente" id="estoque_suficiente" />
                <Label htmlFor="estoque_suficiente">Estoque Suficiente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="outro" id="outro" />
                <Label htmlFor="outro">Outro Motivo</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
        
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="space-y-2">
              <Label htmlFor="message">Observações (opcional):</Label>
              <Textarea 
                id="message" 
                placeholder="Insira detalhes adicionais aqui..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="resize-none"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </ScrollArea>
      
      <div className="p-4 bg-white border-t grid grid-cols-2 gap-4">
        <AppButton 
          variant="gray" 
          onClick={handleCancel}
          disabled={isLoading}
          className="flex items-center justify-center"
        >
          <X size={16} className="mr-2" />
          Cancelar
        </AppButton>
        
        <AppButton 
          variant="orange" 
          onClick={handleConfirm}
          disabled={isLoading || !reason}
          className="flex items-center justify-center"
        >
          <Check size={16} className="mr-2" />
          Confirmar
        </AppButton>
      </div>
    </div>
  );
};

export default NegativeSale;
