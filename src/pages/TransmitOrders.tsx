
import React, { useState } from 'react';
import Header from '@/components/Header';
import { useOrderTransmission } from '@/hooks/useOrderTransmission';
import OrderSummaryCard from '@/components/transmit/OrderSummaryCard';
import OrderTabs from '@/components/transmit/OrderTabs';
import OrderActionButtons from '@/components/transmit/OrderActionButtons';
import OrdersList from '@/components/transmit/OrdersList';
import TransmissionErrorDialog from '@/components/transmit/TransmissionErrorDialog';

const TransmitOrders = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'transmitted' | 'error'>('pending');
  
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
  } = useOrderTransmission();

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
          onTransmitAll={transmitAllOrders}
          onRetryAllErrors={retryAllErrorOrders}
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
    </div>
  );
};

export default TransmitOrders;
