
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PhoneCall, MapPin, FileText, User, Building2, MapPinned, Navigation, Info } from 'lucide-react';
import Header from '@/components/Header';
import AppButton from '@/components/AppButton';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
      
      <div className="p-4 space-y-4 flex-1">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-app-blue to-app-blue-dark p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-white text-app-blue p-2 rounded-lg font-bold">
                {client.codigo}
              </div>
              <span className="text-white">{client.status}</span>
            </div>
            <FileText size={24} className="text-white" />
          </div>
          
          <CardContent className="p-5">
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2">
                <User size={18} className="text-app-blue" />
                <span className="text-gray-500 text-sm font-medium">Cliente:</span>
              </div>
              <div className="pl-7 text-lg font-medium">{client.nome}</div>
            </div>
            
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-app-blue" />
                <span className="text-gray-500 text-sm font-medium">Fantasia:</span>
              </div>
              <div className="pl-7 text-lg font-medium">{client.fantasia}</div>
            </div>
            
            <div className="space-y-1 mb-4">
              <div className="flex items-start gap-2">
                <MapPin size={18} className="text-app-blue mt-1" />
                <div>
                  <span className="text-gray-500 text-sm font-medium">Endereço:</span>
                  <div className="text-app-blue font-medium">{client.endereco}</div>
                </div>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-gray-500 text-sm font-medium">Comprador:</span>
                <div>{client.comprador}</div>
              </div>
              
              <div className="space-y-1">
                <span className="text-gray-500 text-sm font-medium">Bairro:</span>
                <div>{client.bairro}</div>
              </div>
            </div>
            
            <div className="mt-4 space-y-1">
              <div className="flex items-center gap-2">
                <MapPinned size={18} className="text-app-blue" />
                <span className="text-gray-500 text-sm font-medium">Cidade:</span>
              </div>
              <div className="pl-7">{client.cidade}</div>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <PhoneCall size={18} className="text-app-blue" />
                <span className="text-gray-500 text-sm font-medium">Telefone:</span>
              </div>
              <div className="pl-7 text-app-blue font-medium mt-1">{client.telefone[0]}</div>
              {client.telefone[1] && <div className="mt-1 ml-6">{client.telefone[1]}</div>}
              {client.telefone[2] && <div className="mt-1 ml-6">{client.telefone[2]}</div>}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500 text-sm">Tipo F/J:</span>
                <div className="font-medium">{client.tipoFJ}</div>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Dias máx prazo:</span>
                <div className="font-medium">{client.diasMaxPrazo}</div>
              </div>
            </div>
            
            <div className="mt-4">
              <span className="text-gray-500 text-sm">Canal:</span>
              <div className="font-medium">{client.canal}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <span className="text-gray-500 text-sm">Rotatividade:</span>
                <div className="font-medium">{client.rotatividade}</div>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Próx. Visita:</span>
                <div className="font-medium">{client.proximaVisita}</div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <Info size={18} className="text-app-blue" />
                <span className="text-gray-500 text-sm">Restrição:</span>
              </div>
              <div className="font-medium mt-1">{client.restricao}</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="p-4 grid grid-cols-2 gap-2 bg-white border-t">
        <AppButton variant="gray">Listar</AppButton>
        <div className="grid grid-cols-2 gap-2">
          <AppButton variant="gray">&lt;</AppButton>
          <AppButton variant="gray">&gt;</AppButton>
        </div>
        <AppButton variant="gray">Consultar</AppButton>
        <AppButton onClick={handleInitiate} variant="blue">Iniciar</AppButton>
        <AppButton onClick={handleClose} variant="gray">Fechar</AppButton>
        <AppButton variant="gray">Compl/Obs</AppButton>
      </div>
    </div>
  );
};

export default ClientDetails;
