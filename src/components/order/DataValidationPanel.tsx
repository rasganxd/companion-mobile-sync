
import React from 'react';
import AppButton from '@/components/AppButton';
import { AlertTriangle, RefreshCw, CheckCircle, X } from 'lucide-react';

interface DataInconsistency {
  type: 'orphaned_client' | 'missing_sales_rep' | 'data_mismatch';
  clientId: string;
  clientName: string;
  details: string;
}

interface DataValidationPanelProps {
  inconsistencies: DataInconsistency[];
  isValidating: boolean;
  onValidate: () => void;
  onFix: (clientId: string) => void;
  onSync: () => void;
  onClose: () => void;
}

const DataValidationPanel: React.FC<DataValidationPanelProps> = ({
  inconsistencies,
  isValidating,
  onValidate,
  onFix,
  onSync,
  onClose
}) => {
  const getInconsistencyIcon = (type: string) => {
    switch (type) {
      case 'orphaned_client':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'missing_sales_rep':
        return <X className="w-4 h-4 text-red-500" />;
      case 'data_mismatch':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getInconsistencyColor = (type: string) => {
    switch (type) {
      case 'orphaned_client':
        return 'border-yellow-200 bg-yellow-50';
      case 'missing_sales_rep':
        return 'border-red-200 bg-red-50';
      case 'data_mismatch':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Validação de Dados
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <AppButton
              onClick={onValidate}
              disabled={isValidating}
              className="flex items-center gap-2"
            >
              {isValidating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {isValidating ? 'Validando...' : 'Validar Dados'}
            </AppButton>
            
            <AppButton
              onClick={onSync}
              variant="gray"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Sincronizar do Servidor
            </AppButton>
          </div>

          {inconsistencies.length > 0 ? (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">
                Inconsistências Encontradas ({inconsistencies.length})
              </h4>
              
              {inconsistencies.map((inconsistency, index) => (
                <div
                  key={`${inconsistency.clientId}-${index}`}
                  className={`p-3 border rounded-lg ${getInconsistencyColor(inconsistency.type)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {getInconsistencyIcon(inconsistency.type)}
                      <div>
                        <p className="font-medium text-sm">
                          Cliente: {inconsistency.clientName}
                        </p>
                        <p className="text-xs text-gray-600">
                          {inconsistency.details}
                        </p>
                      </div>
                    </div>
                    
                    {inconsistency.type === 'orphaned_client' && (
                      <AppButton
                        size="sm"
                        onClick={() => onFix(inconsistency.clientId)}
                        className="text-xs"
                      >
                        Corrigir
                      </AppButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p>Nenhuma inconsistência encontrada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataValidationPanel;
