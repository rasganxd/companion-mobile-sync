
import React, { useState } from 'react';
import Header from '@/components/Header';
import { useOrderTransmission } from '@/hooks/useOrderTransmission';
import OrderSummaryCard from '@/components/transmit/OrderSummaryCard';
import OrderTabs from '@/components/transmit/OrderTabs';
import OrderActionButtons from '@/components/transmit/OrderActionButtons';
import OrdersList from '@/components/transmit/OrdersList';

const TransmitOrders = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'transmitted'>('pending');
  
  const {
    pendingOrders,
    transmittedOrders,
    isTransmitting,
    isLoading,
    loadOrders,
    transmitAllOrders,
    deleteTransmittedOrder
  } = useOrderTransmission();

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
          onTransmitAll={transmitAllOrders}
          onRefresh={loadOrders}
        />

        <OrdersList
          orders={activeTab === 'pending' ? pendingOrders : transmittedOrders}
          isLoading={isLoading}
          showDeleteButton={activeTab === 'transmitted'}
          onDeleteOrder={activeTab === 'transmitted' ? deleteTransmittedOrder : undefined}
          emptyStateType={activeTab}
        />
      </div>
    </div>
  );
};

export default TransmitOrders;
