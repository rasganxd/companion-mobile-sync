
import { useState } from 'react';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { generateOrderPDF } from '@/utils/pdfGenerator';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { toast } from 'sonner';

export const usePDFWhatsAppShare = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const shareOrderPDF = async (
    clientId: string,
    clientName: string,
    phoneNumber?: string
  ) => {
    try {
      setIsGenerating(true);
      
      // Buscar pedidos do cliente
      const db = getDatabaseAdapter();
      const orders = await db.getClientOrders(clientId);
      
      if (!orders || orders.length === 0) {
        toast.error('Nenhum pedido encontrado para este cliente');
        return;
      }

      // Pegar o pedido mais recente com status positivado
      const activeOrder = orders.find(order => order.status === 'pending' || order.status === 'positivado') || orders[0];
      
      if (!activeOrder) {
        toast.error('Nenhum pedido ativo encontrado');
        return;
      }

      // Gerar PDF
      const pdfBlob = await generateOrderPDF(activeOrder, clientName);
      
      if (Capacitor.isNativePlatform()) {
        // Compartilhar nativamente no mobile
        await shareViaNative(pdfBlob, clientName, phoneNumber);
      } else {
        // Fallback para web
        await shareViaWeb(pdfBlob, clientName, phoneNumber);
      }
      
      toast.success('PDF gerado com sucesso!');
      setShowModal(false);
      
    } catch (error) {
      console.error('Erro ao gerar/compartilhar PDF:', error);
      toast.error('Erro ao gerar PDF do pedido');
    } finally {
      setIsGenerating(false);
    }
  };

  const shareViaNative = async (pdfBlob: Blob, clientName: string, phoneNumber?: string) => {
    try {
      // Converter blob para base64
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      
      reader.onload = async () => {
        const base64Data = reader.result as string;
        
        await Share.share({
          title: `Pedido - ${clientName}`,
          text: `Pedido para ${clientName}`,
          url: base64Data,
          dialogTitle: 'Compartilhar Pedido PDF'
        });
      };
    } catch (error) {
      console.error('Erro no compartilhamento nativo:', error);
      throw error;
    }
  };

  const shareViaWeb = async (pdfBlob: Blob, clientName: string, phoneNumber?: string) => {
    // Criar URL para download
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedido-${clientName.replace(/\s+/g, '-')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Abrir WhatsApp Web com mensagem
    if (phoneNumber) {
      const message = encodeURIComponent(`Olá! Segue o pedido em PDF para ${clientName}. O arquivo foi baixado no seu dispositivo.`);
      const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${message}`;
      window.open(whatsappUrl, '_blank');
    } else {
      const message = encodeURIComponent(`Olá! Segue o pedido em PDF para ${clientName}. O arquivo foi baixado no seu dispositivo.`);
      const whatsappUrl = `https://web.whatsapp.com/send?text=${message}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  return {
    isGenerating,
    showModal,
    setShowModal,
    shareOrderPDF
  };
};
