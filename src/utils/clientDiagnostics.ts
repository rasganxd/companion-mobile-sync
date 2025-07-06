
/**
 * Utilitário para diagnóstico e limpeza de dados de clientes
 */

interface ClientData {
  id: string;
  name: string;
  sales_rep_id?: string;
  visit_days?: string[] | string;
  active: boolean;
}

export const diagnoseClientData = (clients: ClientData[], salesRepId: string, day: string) => {
  const diagnosis = {
    totalClients: clients.length,
    activeClients: 0,
    salesRepClients: 0,
    activeSalesRepClients: 0,
    duplicateIds: [] as string[],
    invalidVisitDays: [] as string[],
    clientsForDay: 0,
    issues: [] as string[]
  };

  // Verificar duplicatas
  const seenIds = new Set<string>();
  const duplicateIds = new Set<string>();
  
  clients.forEach(client => {
    if (seenIds.has(client.id)) {
      duplicateIds.add(client.id);
    } else {
      seenIds.add(client.id);
    }
  });

  diagnosis.duplicateIds = Array.from(duplicateIds);
  
  if (duplicateIds.size > 0) {
    diagnosis.issues.push(`Encontradas ${duplicateIds.size} duplicatas de ID`);
  }

  // Mapear dia para inglês
  const dayMapping: { [key: string]: string } = {
    'Segunda': 'monday',
    'Terça': 'tuesday', 
    'Quarta': 'wednesday',
    'Quinta': 'thursday',
    'Sexta': 'friday',
    'Sábado': 'saturday',
    'Domingo': 'sunday'
  };

  const englishDay = dayMapping[day];
  
  if (!englishDay) {
    diagnosis.issues.push(`Dia inválido: ${day}`);
    return diagnosis;
  }

  // Analisar cada cliente
  clients.forEach(client => {
    if (client.active) {
      diagnosis.activeClients++;
    }

    if (client.sales_rep_id === salesRepId) {
      diagnosis.salesRepClients++;
      
      if (client.active) {
        diagnosis.activeSalesRepClients++;
        
        // Verificar visit_days
        if (!client.visit_days) {
          return;
        }

        let visitDays = client.visit_days;
        
        // Normalizar visit_days
        if (typeof visitDays === 'string') {
          try {
            visitDays = JSON.parse(visitDays);
          } catch (e) {
            diagnosis.invalidVisitDays.push(`${client.name}: JSON inválido`);
            return;
          }
        }

        if (!Array.isArray(visitDays)) {
          diagnosis.invalidVisitDays.push(`${client.name}: não é array`);
          return;
        }

        // Verificar se tem o dia
        if (visitDays.includes(englishDay)) {
          diagnosis.clientsForDay++;
        }
      }
    }
  });

  if (diagnosis.invalidVisitDays.length > 0) {
    diagnosis.issues.push(`${diagnosis.invalidVisitDays.length} clientes com visit_days inválidos`);
  }

  return diagnosis;
};

export const cleanDuplicateClients = (clients: ClientData[]): ClientData[] => {
  const seenIds = new Set<string>();
  const cleanedClients: ClientData[] = [];
  
  clients.forEach(client => {
    if (!seenIds.has(client.id)) {
      seenIds.add(client.id);
      cleanedClients.push(client);
    }
  });

  return cleanedClients;
};

export const normalizeVisitDays = (visitDays: string[] | string | null | undefined): string[] => {
  if (!visitDays) {
    return [];
  }

  if (typeof visitDays === 'string') {
    try {
      const parsed = JSON.parse(visitDays);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return Array.isArray(visitDays) ? visitDays : [];
};
