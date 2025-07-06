
import React, { useState } from 'react';
import Header from '@/components/Header';
import { useTransmitOrdersPage } from '@/hooks/useTransmitOrdersPage';
import OrderSummaryCard from '@/components/transmit/OrderSummaryCard';
import OrderTabs from '@/components/transmit/OrderTabs';
import OrderActionButtons from '@/components/transmit/OrderActionButtons';
import OrdersList from '@/components/transmit/OrdersList';
import TransmissionErrorDialog from '@/components/transmit/TransmissionErrorDialog';
import { useConfirm } from '@/hooks/useConfirm';
import ConfirmDialog from '@/components/ConfirmDialog';

const TransmitOrders = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'transmitted' | 'error'>('pending');
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();
  
  const {
    pendingOrders,
    transmittedOrders,
    errorOrders,
    isTransmitting,
    isLoading,
    transmissionError,
    loadOrders,
    transmitAllOrders,
    retryOrder,
    retryAllErrorOrders,
    deleteTransmittedOrder,
    retryTransmission,
    clearTransmissionError
  } = useTransmitOrdersPage();

  const getCurrentOrders = () => {
    switch (activeTab) {
      case 'pending':
        return pendingOrders;
      case 'transmitted':
        return transmittedOrders;
      case 'error':
        return errorOrders;
      default:
        return [];
    }
  };

  const handleTransmitAll = async () => {
    const confirmed = await confirm({
      title: 'Confirmar Transmissão',
      description: `Tem certeza que deseja transmitir ${pendingOrders.length} pedido(s)?`,
      confirmText: 'Transmitir',
      cancelText: 'Cancelar'
    });
    if (confirmed) {
      await transmitAllOrders();
    }
  };

  const handleRetryAllErrors = async () => {
    const confirmed = await confirm({
      title: 'Confirmar Nova Tentativa',
      description: `Tem certeza que deseja reenviar ${errorOrders.length} pedido(s) com erro?`,
      confirmText: 'Reenviar',
      cancelText: 'Cancelar'
    });
    if (confirmed) {
      await retryAllErrorOrders();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title="Transmitir Pedidos" 
        showBackButton={true} 
        backgroundColor="blue" 
      />
      
      <div className="p-4 flex-1">
        <OrderTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingCount={pendingOrders.length}
          transmittedCount={transmittedOrders.length}
          errorCount={errorOrders.length}
        />

        <OrderSummaryCard
          pendingCount={pendingOrders.length}
          transmittedCount={transmittedOrders.length}
        />

        <OrderActionButtons
          activeTab={activeTab}
          isTransmitting={isTransmitting}
          isLoading={isLoading}
          pendingCount={pendingOrders.length}
          errorCount={errorOrders.length}
          onTransmitAll={handleTransmitAll}
          onRetryAllErrors={handleRetryAllErrors}
          onRefresh={loadOrders}
        />

        <OrdersList
          orders={getCurrentOrders()}
          isLoading={isLoading}
          showDeleteButton={activeTab === 'transmitted'}
          showRetryButton={activeTab === 'error'}
          onDeleteOrder={activeTab === 'transmitted' ? deleteTransmittedOrder : undefined}
          onRetryOrder={activeTab === 'error' ? retryOrder : undefined}
          emptyStateType={activeTab}
        />
      </div>

      <TransmissionErrorDialog
        isOpen={!!transmissionError}
        onClose={clearTransmissionError}
        error={transmissionError || ''}
        onRetry={retryTransmission}
        isRetrying={isTransmitting}
      />

      <ConfirmDialog
        isOpen={isOpen}
        title={options.title}
        description={options.description}
        confirmText={options.confirmText || 'Confirmar'}
        cancelText={options.cancelText || 'Cancelar'}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default TransmitOrders;
