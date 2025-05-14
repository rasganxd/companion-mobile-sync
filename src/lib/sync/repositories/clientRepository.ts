
import {
  getAllRecords,
  getRecordById,
  insertRecord,
  updateRecord,
  deleteRecord,
  executeQuery,
} from '../database';

export interface Client {
  id: string;
  name: string;
  fantasy_name?: string;
  address?: string;
  city?: string;
  status?: string;
  version?: number;
  synced?: number;
}

/**
 * Get all clients
 */
export async function getAllClients(): Promise<Client[]> {
  return await getAllRecords<Client>('clients');
}

/**
 * Get client by ID
 */
export async function getClientById(id: string): Promise<Client | null> {
  return await getRecordById<Client>('clients', id);
}

/**
 * Search clients by name or fantasy name
 */
export async function searchClients(term: string): Promise<Client[]> {
  const query = `
    SELECT * FROM clients 
    WHERE name LIKE ? OR fantasy_name LIKE ?
    ORDER BY name
  `;
  const searchTerm = `%${term}%`;
  return await executeQuery<Client>(query, [searchTerm, searchTerm]);
}

/**
 * Create a new client
 */
export async function createClient(client: Omit<Client, 'id'>): Promise<string> {
  return await insertRecord('clients', {
    ...client,
    synced: 0,
    version: 1,
  });
}

/**
 * Update an existing client
 */
export async function updateClient(id: string, clientData: Partial<Client>): Promise<void> {
  await updateRecord<Client>('clients', id, {
    ...clientData,
    synced: 0,
  });
}

/**
 * Delete a client
 */
export async function deleteClient(id: string): Promise<void> {
  await deleteRecord('clients', id);
}
