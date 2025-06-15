
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import AppButton from '@/components/AppButton';
import { ArrowLeft, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { toast } from '@/components/ui/use-toast';

const MessagePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientId, clientName } = location.state || { clientId: null, clientName: 'Cliente' };
  
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (!clientId) {
      toast({
        title: "Aviso",
        description: "Nenhum cliente selecionado",
        variant: "default"
      });
    }
  }, [clientId]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite uma mensagem",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // In a real app, this would send the message to a server
      // For now, we'll just log it to the sync log
      const db = getDatabaseAdapter();
      await db.logSync(
        'message', 
        'pending', 
        JSON.stringify({
          clientId,
          message,
          date: new Date().toISOString()
        })
      );
      
      toast({
        title: "Sucesso",
        description: "Mensagem enviada com sucesso"
      });
      
      // Navigate back
      navigate(-1);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erro",
        description: "Falha ao enviar mensagem",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Nova Mensagem" 
        backgroundColor="blue"
        showBackButton
      />
      
      {clientName && (
        <div className="bg-app-blue text-white px-3 py-1 text-xs">
          <span className="font-semibold">{clientId}</span> - {clientName}
        </div>
      )}
      
      <ScrollArea className="flex-1 p-4">
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message">Mensagem:</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem aqui..."
                  rows={10}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </ScrollArea>
      
      <div className="p-4 bg-white border-t grid grid-cols-2 gap-4">
        <AppButton 
          variant="gray" 
          onClick={handleGoBack}
          disabled={isLoading}
          className="flex items-center justify-center"
        >
          <ArrowLeft size={16} className="mr-2" />
          Voltar
        </AppButton>
        
        <AppButton 
          variant="blue" 
          onClick={handleSend}
          disabled={isLoading || !message.trim()}
          className="flex items-center justify-center"
        >
          <Send size={16} className="mr-2" />
          Enviar
        </AppButton>
      </div>
    </div>
  );
};

export default MessagePage;
