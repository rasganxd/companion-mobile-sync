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
import ConfirmDialog from '@/components/ConfirmDialog';
import { useConfirm } from '@/hooks/useConfirm';
import { toast } from '@/hooks/use-toast';
const NegativeSale = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    clientId,
    clientName
  } = location.state || {
    clientId: null,
    clientName: 'Cliente'
  };
  const [reason, setReason] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [clientAlreadyNegated, setClientAlreadyNegated] = useState<boolean>(false);
  const {
    isOpen,
    options,
    confirm,
    handleConfirm: confirmHandleConfirm,
    handleCancel: confirmHandleCancel
  } = useConfirm();
  useEffect(() => {
    if (!clientId) {
      navigate(-1);
    } else {
      checkClientStatus();
    }
  }, [clientId, navigate]);
  const checkClientStatus = async () => {
    try {
      const db = getDatabaseAdapter();
      const isNegated = await db.isClientNegated(clientId);
      setClientAlreadyNegated(isNegated);
      if (isNegated) {
        console.log(`⚠️ Cliente ${clientName} já está negativado`);
      }
    } catch (error) {
      console.error('Error checking client status:', error);
    }
  };
  const handleCancelAction = () => {
    navigate(-1);
  };
  const handleConfirmAction = async () => {
    if (!reason) {
      toast({
        title: "Erro",
        description: "Selecione o motivo da negativação",
        variant: "destructive"
      });
      return;
    }

    // Se cliente já está negativado, pedir confirmação
    if (clientAlreadyNegated) {
      const confirmed = await confirm({
        title: 'Cliente já negativado',
        description: `O cliente ${clientName} já está com status "Negativado". Deseja registrar uma nova negativação mesmo assim?`,
        confirmText: 'Sim, negativar novamente',
        cancelText: 'Cancelar'
      });
      if (!confirmed) {
        return;
      }
    }
    try {
      setIsLoading(true);
      const db = getDatabaseAdapter();

      // Create a negative sale record locally with status 'cancelled'
      const order = {
        id: `neg_${Date.now()}`,
        // Local ID with negative prefix
        customer_id: clientId,
        customer_name: clientName,
        date: new Date().toISOString(),
        status: "cancelled",
        // Usar 'cancelled' para pedidos negativados
        reason: reason,
        notes: message,
        items: [],
        total: 0,
        sync_status: "pending_sync",
        // Offline status
        source_project: "mobile",
        payment_method: "N/A"
      };
      await db.saveOrder(order);

      // Update client status locally - usar 'negativado' minúsculo
      await db.updateClientStatus(clientId, "negativado");
      console.log('📱 Negative sale saved locally:', order);
      if (clientAlreadyNegated) {
        toast({
          title: "Sucesso",
          description: `Nova negativação registrada para ${clientName}`
        });
      } else {
        toast({
          title: "Sucesso",
          description: `Cliente ${clientName} negativado com sucesso`
        });
      }

      // Corrigir navegação para usar a rota correta e passar o day
      navigate('/clients-list', {
        state: {
          day: location.state?.day || 'Segunda'
        }
      });
    } catch (error) {
      console.error("Error saving negative sale:", error);
      toast({
        title: "Erro",
        description: "Erro ao negativar cliente",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="Negativar Venda" backgroundColor="red" showBackButton />
      
      {clientName && <div className="bg-red-600 text-white px-3 py-1 text-xs">
           - {clientName}
          {clientAlreadyNegated && <span className="ml-2 bg-red-800 px-2 py-0.5 rounded text-xs">
              ⚠️ JÁ NEGATIVADO
            </span>}
        </div>}
      
      <ScrollArea className="flex-1 px-4 py-4">
        {clientAlreadyNegated && <Card className="mb-4 border-yellow-300 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <h3 className="font-medium">Cliente já negativado</h3>
                  <p className="text-sm">
                    Este cliente já possui status "Negativado". Uma nova negativação será registrada como histórico adicional.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>}
        
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
              <Textarea id="message" placeholder="Insira detalhes adicionais aqui..." value={message} onChange={e => setMessage(e.target.value)} className="resize-none" rows={4} />
            </div>
          </CardContent>
        </Card>
      </ScrollArea>
      
      <div className="p-4 bg-white border-t grid grid-cols-2 gap-4">
        <AppButton variant="gray" onClick={handleCancelAction} disabled={isLoading} className="flex items-center justify-center">
          <X size={16} className="mr-2" />
          Cancelar
        </AppButton>
        
        <AppButton variant="orange" onClick={handleConfirmAction} disabled={isLoading || !reason} className="flex items-center justify-center">
          <Check size={16} className="mr-2" />
          {clientAlreadyNegated ? 'Registrar Nova Negativação' : 'Confirmar'}
        </AppButton>
      </div>
      
      <ConfirmDialog isOpen={isOpen} title={options.title} description={options.description} confirmText={options.confirmText || 'Confirmar'} cancelText={options.cancelText || 'Cancelar'} onConfirm={confirmHandleConfirm} onCancel={confirmHandleCancel} />
    </div>;
};
export default NegativeSale;