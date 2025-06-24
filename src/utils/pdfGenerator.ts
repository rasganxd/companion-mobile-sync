
import jsPDF from 'jspdf';

export const generateOrderPDF = async (order: any, clientName: string): Promise<Blob> => {
  const doc = new jsPDF();
  
  // Cabeçalho
  doc.setFontSize(20);
  doc.text('PEDIDO DE VENDA', 105, 20, { align: 'center' });
  
  // Informações do cliente
  doc.setFontSize(12);
  doc.text('DADOS DO CLIENTE', 20, 40);
  doc.setFontSize(10);
  doc.text(`Nome: ${clientName}`, 20, 50);
  doc.text(`Código: ${order.customer_id || 'N/A'}`, 20, 56);
  doc.text(`Data: ${new Date(order.date).toLocaleDateString('pt-BR')}`, 20, 62);
  
  // Status e total
  doc.text(`Status: ${order.status === 'pending' ? 'Pendente' : 'Positivado'}`, 120, 50);
  doc.text(`Total: R$ ${order.total.toFixed(2)}`, 120, 56);
  
  // Linha separadora
  doc.line(20, 70, 190, 70);
  
  // Cabeçalho dos itens
  doc.setFontSize(12);
  doc.text('ITENS DO PEDIDO', 20, 80);
  
  // Cabeçalho da tabela
  doc.setFontSize(8);
  doc.text('Produto', 20, 90);
  doc.text('Qtd', 120, 90);
  doc.text('Preço Un.', 140, 90);
  doc.text('Total', 170, 90);
  
  // Linha do cabeçalho
  doc.line(20, 92, 190, 92);
  
  // Itens
  let yPosition = 100;
  if (order.items && order.items.length > 0) {
    order.items.forEach((item: any, index: number) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      const productName = item.product_name.length > 40 
        ? item.product_name.substring(0, 40) + '...' 
        : item.product_name;
      
      doc.text(productName, 20, yPosition);
      doc.text(item.quantity.toString(), 120, yPosition);
      doc.text(`R$ ${(item.price || item.unit_price || 0).toFixed(2)}`, 140, yPosition);
      doc.text(`R$ ${((item.price || item.unit_price || 0) * item.quantity).toFixed(2)}`, 170, yPosition);
      
      yPosition += 6;
    });
  }
  
  // Total final
  yPosition += 10;
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 8;
  doc.setFontSize(12);
  doc.text(`TOTAL GERAL: R$ ${order.total.toFixed(2)}`, 120, yPosition);
  
  // Observações se houver
  if (order.notes) {
    yPosition += 15;
    doc.setFontSize(10);
    doc.text('Observações:', 20, yPosition);
    yPosition += 6;
    doc.text(order.notes, 20, yPosition);
  }
  
  // Rodapé
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.text('Documento gerado automaticamente pelo sistema de vendas', 105, pageHeight - 20, { align: 'center' });
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 105, pageHeight - 15, { align: 'center' });
  
  // Retornar como blob
  return doc.output('blob');
};
