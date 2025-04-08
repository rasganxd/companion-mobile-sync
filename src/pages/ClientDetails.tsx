
import React from 'react';
import { PhoneCall, MapPin, FileText } from 'lucide-react';
import Header from '@/components/Header';
import AppButton from '@/components/AppButton';

const ClientDetails = () => {
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header title="Clientes" showBackButton backgroundColor="orange" />
      
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold">Código:</span>
            <span className="ml-2 bg-gray-200 px-3 py-1 rounded">{client.codigo}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{client.status}</span>
            <FileText size={24} />
          </div>
        </div>
        
        <div>
          <span className="font-semibold">Cliente:</span>
          <div className="mt-1">{client.nome}</div>
        </div>
        
        <div>
          <span className="font-semibold">Fantasia:</span>
          <div className="mt-1">{client.fantasia}</div>
        </div>
        
        <div className="flex items-start gap-2">
          <MapPin size={20} />
          <div>
            <span className="font-semibold">Endereço:</span>
            <div className="mt-1 text-blue-500">{client.endereco}</div>
          </div>
        </div>
        
        <div>
          <span className="font-semibold">Comprador:</span>
          <div className="mt-1">{client.comprador}</div>
        </div>
        
        <div>
          <span className="font-semibold">Bairro:</span>
          <div className="mt-1">{client.bairro}</div>
        </div>
        
        <div>
          <span className="font-semibold">Cidade:</span>
          <div className="mt-1">{client.cidade}</div>
        </div>
        
        <div>
          <span className="font-semibold">Telefone:</span>
          <div className="flex items-center mt-1">
            <PhoneCall size={20} className="mr-2" />
            <span className="text-blue-500">{client.telefone[0]}</span>
          </div>
          {client.telefone[1] && <div className="mt-1 ml-6">{client.telefone[1]}</div>}
          {client.telefone[2] && <div className="mt-1 ml-6">{client.telefone[2]}</div>}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div>
            <span className="font-semibold">Tipo F/J:</span>
            <div className="mt-1">{client.tipoFJ}</div>
          </div>
          <div>
            <span className="font-semibold">Dias max prazo:</span>
            <div className="mt-1">{client.diasMaxPrazo}</div>
          </div>
        </div>
        
        <div>
          <span className="font-semibold">Canal:</span>
          <div className="mt-1">{client.canal}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-semibold">Rotatividade:</span>
            <div className="mt-1">{client.rotatividade}</div>
          </div>
          <div>
            <span className="font-semibold">Próx. Visita:</span>
            <div className="mt-1">{client.proximaVisita}</div>
          </div>
        </div>
        
        <div>
          <span className="font-semibold">Restrição:</span>
          <div className="mt-1">{client.restricao}</div>
        </div>
      </div>
      
      <div className="mt-auto grid grid-cols-2 gap-2 p-4">
        <AppButton>Listar</AppButton>
        <div className="grid grid-cols-2 gap-2">
          <AppButton>&lt;</AppButton>
          <AppButton>&gt;</AppButton>
        </div>
        <AppButton>Consultar</AppButton>
        <AppButton>Iniciar</AppButton>
        <AppButton>Fechar</AppButton>
        <AppButton>Compl/Obs</AppButton>
      </div>
    </div>
  );
};

export default ClientDetails;
