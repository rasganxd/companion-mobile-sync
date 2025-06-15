import { useState } from 'react';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface ValidationResult {
  canCreate: boolean;
  reason?: string;
  existingOrder?: any;
}

export const useClientValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const navigate = useNavigate();

  const validateClientForOrder = async (clientId: string): Promise<ValidationResult> => {
    setIsValidating(true);
    
    try {
      const db = getDatabaseAdapter();
      const result = await db.canCreateOrderForClient(clientId);
      
      console.log(`🔍 Client validation result for ${clientId}:`, result);
      
      return result;
    } catch (error) {
      console.error('Error validating client:', error);
      toast({
        title: "Erro",
        description: "Erro ao validar cliente",
        variant: "destructive"
      });
      
      return {
        canCreate: false,
        reason: 'Erro ao validar cliente'
      };
    } finally {
      setIsValidating(false);
    }
  };

  const handleClientAction = async (
    clientId: string, 
    clientName: string, 
    day?: string,
    onNegatedClient?: () => void,
    onExistingOrder?: (order: any) => void,
    options?: { backPath?: string }
  ) => {
    const validation = await validateClientForOrder(clientId);
    
    if (!validation.canCreate) {
      if (validation.reason?.includes('negativado')) {
        onNegatedClient?.();
        return;
      }
      
      if (validation.existingOrder) {
        onExistingOrder?.(validation.existingOrder);
        return;
      }
      
      toast({
        title: "Não é possível criar pedido",
        description: validation.reason,
        variant: "destructive"
      });
      return;
    }
    
    // Cliente válido - navegar para atividades
    navigate('/client-activities', {
      state: {
        clientName,
        clientId,
        day,
        backPath: options?.backPath
      }
    });
  };

  const unnegateClient = async (clientId: string, reason: string) => {
    try {
      setIsValidating(true);
      const db = getDatabaseAdapter();
      
      await db.unnegateClient(clientId, reason);
      
      toast({
        title: "Sucesso",
        description: "Cliente reativado com sucesso!"
      });
      
      return true;
    } catch (error) {
      console.error('Error unnegating client:', error);
      toast({
        title: "Erro",
        description: "Erro ao reativar cliente",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  return {
    validateClientForOrder,
    handleClientAction,
    unnegateClient,
    isValidating
  };
};
