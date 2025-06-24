
import { jsPDF } from 'jspdf';

export const generateOrderPDF = async (order: any, clientName: string): Promise<Blob> => {
  console.log('📋 Generating PDF for order:', order);
  console.log('📋 Order items:', order.items);
  
  const doc = new jsPDF();
  
  // Cabeçalho
  doc.setFontSize(20);
  doc.text('PEDIDO DE VENDA', 105, 20, { align: 'center' });
  
  // Informações do cliente
  doc.setFontSize(12);
  doc.text('DADOS DO CLIENTE', 20, 40);
  doc.setFontSize(10);
  doc.text(`Nome: ${clientName || 'N/A'}`, 20, 50);
  doc.text(`Código: ${order.customer_id || order.client_id || 'N/A'}`, 20, 56);
  doc.text(`Data: ${new Date(order.date || Date.now()).toLocaleDateString('pt-BR')}`, 20, 62);
  
  // Status e total
  const status = order.status === 'pending' ? 'Pendente' : 'Positivado';
  const total = order.total || 0;
  doc.text(`Status: ${status}`, 120, 50);
  doc.text(`Total: R$ ${total.toFixed(2)}`, 120, 56);
  
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
  if (order.items && Array.isArray(order.items) && order.items.length > 0) {
    order.items.forEach((item: any, index: number) => {
      console.log(`📋 Processing item ${index}:`, item);
      
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Validações e valores padrão para cada propriedade
      const productName = item.product_name || item.productName || `Produto ${index + 1}`;
      const quantity = item.quantity || 0;
      const unitPrice = item.price || item.unit_price || 0;
      const itemTotal = unitPrice * quantity;
      
      // Truncar nome do produto se muito longo
      const displayName = productName.length > 40 
        ? productName.substring(0, 40) + '...' 
        : productName;
      
      doc.text(displayName, 20, yPosition);
      doc.text(quantity.toString(), 120, yPosition);
      doc.text(`R$ ${unitPrice.toFixed(2)}`, 140, yPosition);
      doc.text(`R$ ${itemTotal.toFixed(2)}`, 170, yPosition);
      
      yPosition += 6;
    });
  } else {
    // Caso não tenha itens
    doc.setFontSize(10);
    doc.text('Nenhum item encontrado no pedido', 20, yPosition);
    yPosition += 10;
  }
  
  // Total final
  yPosition += 10;
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 8;
  doc.setFontSize(12);
  doc.text(`TOTAL GERAL: R$ ${total.toFixed(2)}`, 120, yPosition);
  
  // Observações se houver
  if (order.notes || order.message) {
    yPosition += 15;
    doc.setFontSize(10);
    doc.text('Observações:', 20, yPosition);
    yPosition += 6;
    doc.text(order.notes || order.message || '', 20, yPosition);
  }
  
  // Rodapé
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.text('Documento gerado automaticamente pelo sistema de vendas', 105, pageHeight - 20, { align: 'center' });
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 105, pageHeight - 15, { align: 'center' });
  
  console.log('✅ PDF generated successfully');
  
  // Retornar como blob
  return doc.output('blob');
};
