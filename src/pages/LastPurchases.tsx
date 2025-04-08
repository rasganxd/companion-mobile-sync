import React, { useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import Header from '@/components/Header';
import AppButton from '@/components/AppButton';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Interface for purchase data
interface Purchase {
  id: string;
  date: string;
  total: string;
  items: PurchaseItem[];
}

interface PurchaseItem {
  id: string;
  name: string;
  quantity: number;
  value: string;
  table: number;
  deviation: number;
  type: string;
}

const LastPurchases = () => {
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list');
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const clientName = location.state?.clientName || 'Cliente';

  // Dummy purchase history data grouped by date
  const purchaseHistory = [
    {
      date: '05/04/2025',
      purchases: [
        {
          id: '001',
          date: '05/04/2025',
          total: 'R$ 325,50',
          items: [
            {
              id: '700',
              name: 'CX-HEINEKEN 600ML',
              quantity: 3.0,
              value: 'R$ 225,00',
              table: 1,
              deviation: 0.0,
              type: ''
            },
            {
              id: '701',
              name: 'CX-SKOL 350ML',
              quantity: 2.0,
              value: 'R$ 100,50',
              table: 1,
              deviation: 0.0,
              type: ''
            }
          ]
        }
      ]
    },
    {
      date: '03/04/2025',
      purchases: [
        {
          id: '002',
          date: '03/04/2025',
          total: 'R$ 225,00',
          items: [
            {
              id: '700',
              name: 'CX-HEINEKEN 600ML',
              quantity: 3.0,
              value: 'R$ 225,00',
              table: 1,
              deviation: 0.0,
              type: ''
            }
          ]
        }
      ]
    },
    {
      date: '28/03/2025',
      purchases: [
        {
          id: '003',
          date: '28/03/2025',
          total: 'R$ 450,00',
          items: [
            {
              id: '700',
              name: 'CX-HEINEKEN 600ML',
              quantity: 6.0,
              value: 'R$ 450,00',
              table: 1,
              deviation: 0.0,
              type: ''
            }
          ]
        }
      ]
    }
  ];

  // Filter purchase history based on search term
  const filteredPurchaseHistory = purchaseHistory.filter(group => 
    group.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.purchases.some(purchase => 
      purchase.items.some(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  );

  const handlePurchaseSelect = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setViewMode('details');
  };

  const handleGoBack = () => {
    if (viewMode === 'details') {
      setViewMode('list');
      setSelectedPurchase(null);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        title={viewMode === 'details' ? 'Detalhes da Compra' : `Compras - ${clientName}`}
        backgroundColor={viewMode === 'details' ? 'gray' : 'blue'}
        showBackButton
      />
      
      {viewMode === 'list' && (
        <div className="p-4 flex-1 flex flex-col">
          <div className="mb-4 relative">
            <Input
              placeholder="Pesquisar compras..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
          
          <ScrollArea className="flex-1">
            {filteredPurchaseHistory.length > 0 ? (
              <div className="space-y-4">
                {filteredPurchaseHistory.map((group, groupIndex) => (
                  <div key={groupIndex}>
                    <div className="bg-slate-100 py-1 px-3 rounded-t-lg font-medium">
                      {group.date}
                    </div>
                    <div className="space-y-2">
                      {group.purchases.map((purchase, purchaseIndex) => (
                        <Card 
                          key={purchaseIndex} 
                          className="cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => handlePurchaseSelect(purchase)}
                        >
                          <CardContent className="p-3 flex justify-between items-center">
                            <div>
                              <p className="font-medium">Pedido #{purchase.id}</p>
                              <p className="text-sm text-gray-500">
                                {purchase.items.length} {purchase.items.length > 1 ? 'itens' : 'item'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-app-blue">{purchase.total}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhuma compra encontrada</p>
              </div>
            )}
          </ScrollArea>
          
          <div className="mt-4">
            <AppButton 
              variant="gray" 
              fullWidth 
              className="flex items-center justify-center gap-2"
              onClick={handleGoBack}
            >
              <ArrowLeft size={20} />
              <span>Voltar</span>
            </AppButton>
          </div>
        </div>
      )}

      {viewMode === 'details' && selectedPurchase && (
        <div className="p-4 flex-1 flex flex-col">
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-500">Data</div>
                <div className="font-medium">{selectedPurchase.date}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Valor Total</div>
                <div className="font-medium text-app-blue">{selectedPurchase.total}</div>
              </div>
            </div>

            <div className="mb-2 font-medium">Itens do Pedido</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedPurchase.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">[{item.id}] {item.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-auto">
            <AppButton 
              variant="gray" 
              fullWidth 
              className="flex items-center justify-center gap-2"
              onClick={handleGoBack}
            >
              <ArrowLeft size={20} />
              <span>Voltar para Lista</span>
            </AppButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default LastPurchases;
