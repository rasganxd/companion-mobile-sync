
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PhoneCall, MapPin, FileText, User, Building2, MapPinned, Navigation, Info } from 'lucide-react';
import Header from '@/components/Header';
import AppButton from '@/components/AppButton';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

const ClientDetails = () => {
  const navigate = useNavigate();
  
  // Dados de exemplo para um cliente
  const client = {
    codigo: '179',
    status: 'Pendente',
    nome: 'GILMAR ELIAS TAZONIERO',
    fantasia: 'CANCHA DE BOCHA DO PILA',
    endereco: 'RUA MARECHAL DEODORO 2325',
    comprador: 'GILMAR',
    bairro: 'PARAISO',
    cidade: 'CHAPECO',
    telefone: ['(49)99825.9077', '', ''],
    tipoFJ: 'F',
    diasMaxPrazo: '0',
    canal: '001-SUPERMERCAD',
    rotatividade: 'Semanal',
    proximaVisita: '14/04/2025',
    restricao: 'Livre'
  };

  const handleInitiate = () => {
    // Quando clica em "Iniciar", volta para a página inicial
    navigate('/');
  };

  const handleClose = () => {
    // Volta para a tela de rotas
    navigate('/rotas');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="Detalhes do Cliente" showBackButton backgroundColor="blue" />
      
      <ScrollArea className="flex-1 px-2">
        <div className="p-2 space-y-3">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-app-blue to-app-blue-dark p-2 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="bg-white text-app-blue p-1 rounded-lg font-bold text-sm">
                  {client.codigo}
                </div>
                <span className="text-white text-sm">{client.status}</span>
              </div>
              <FileText size={20} className="text-white" />
            </div>
            
            <CardContent className="p-3 text-sm">
              <div className="space-y-1 mb-2">
                <div className="flex items-center gap-1">
                  <User size={16} className="text-app-blue" />
                  <span className="text-gray-500 text-xs">Cliente:</span>
                </div>
                <div className="pl-6 font-medium">{client.nome}</div>
              </div>
              
              <div className="space-y-1 mb-2">
                <div className="flex items-center gap-1">
                  <Building2 size={16} className="text-app-blue" />
                  <span className="text-gray-500 text-xs">Fantasia:</span>
                </div>
                <div className="pl-6 font-medium">{client.fantasia}</div>
              </div>
              
              <div className="space-y-1 mb-2">
                <div className="flex items-start gap-1">
                  <MapPin size={16} className="text-app-blue mt-1" />
                  <div>
                    <span className="text-gray-500 text-xs">Endereço:</span>
                    <div className="text-app-blue font-medium">{client.endereco}</div>
                  </div>
                </div>
              </div>
              
              <Separator className="my-2" />
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="space-y-0">
                  <span className="text-gray-500 text-xs">Comprador:</span>
                  <div className="text-sm">{client.comprador}</div>
                </div>
                
                <div className="space-y-0">
                  <span className="text-gray-500 text-xs">Bairro:</span>
                  <div className="text-sm">{client.bairro}</div>
                </div>
              </div>
              
              <div className="mt-2 space-y-0">
                <div className="flex items-center gap-1">
                  <MapPinned size={16} className="text-app-blue" />
                  <span className="text-gray-500 text-xs">Cidade:</span>
                </div>
                <div className="pl-6 text-sm">{client.cidade}</div>
              </div>
              
              <div className="mt-2">
                <div className="flex items-center gap-1">
                  <PhoneCall size={16} className="text-app-blue" />
                  <span className="text-gray-500 text-xs">Telefone:</span>
                </div>
                <div className="pl-6 text-app-blue font-medium text-sm">{client.telefone[0]}</div>
                {client.telefone[1] && <div className="mt-0 ml-6 text-sm">{client.telefone[1]}</div>}
                {client.telefone[2] && <div className="mt-0 ml-6 text-sm">{client.telefone[2]}</div>}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500 text-xs">Tipo F/J:</span>
                  <div className="font-medium text-sm">{client.tipoFJ}</div>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Dias máx prazo:</span>
                  <div className="font-medium text-sm">{client.diasMaxPrazo}</div>
                </div>
              </div>
              
              <div className="mt-2">
                <span className="text-gray-500 text-xs">Canal:</span>
                <div className="font-medium text-sm">{client.canal}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <span className="text-gray-500 text-xs">Rotatividade:</span>
                  <div className="font-medium text-sm">{client.rotatividade}</div>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Próx. Visita:</span>
                  <div className="font-medium text-sm">{client.proximaVisita}</div>
                </div>
              </div>
              
              <div className="mt-2">
                <div className="flex items-center gap-1">
                  <Info size={16} className="text-app-blue" />
                  <span className="text-gray-500 text-xs">Restrição:</span>
                </div>
                <div className="font-medium text-sm mt-0">{client.restricao}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
      
      <div className="p-2 grid grid-cols-2 gap-2 bg-white border-t">
        <AppButton variant="gray" size="sm">Listar</AppButton>
        <div className="grid grid-cols-2 gap-2">
          <AppButton variant="gray" size="sm">&lt;</AppButton>
          <AppButton variant="gray" size="sm">&gt;</AppButton>
        </div>
        <AppButton variant="gray" size="sm">Consultar</AppButton>
        <AppButton onClick={handleInitiate} variant="blue" size="sm">Iniciar</AppButton>
        <AppButton onClick={handleClose} variant="gray" size="sm">Fechar</AppButton>
        <AppButton variant="gray" size="sm">Compl/Obs</AppButton>
      </div>
    </div>
  );
};

export default ClientDetails;
