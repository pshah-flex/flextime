/**
 * Sync Clients Service
 * 
 * Syncs client records from Airtable to Supabase
 */

import { fetchClientEmails } from '../airtable';
import { clientsRepository, clientGroupMappingsRepository, clientGroupsRepository } from '../repositories';
import type { Client, ClientGroupMapping, DatabaseInsert } from '../../types';

/**
 * Sync all clients from Airtable to Supabase
 */
export async function syncClientsFromAirtable(): Promise<{
  clientsSynced: number;
  mappingsSynced: number;
  clientsErrors: number;
  mappingsErrors: number;
}> {
  try {
    console.log('🔄 Syncing clients from Airtable...');
    
    // Fetch clients from Airtable
    const airtableClients = await fetchClientEmails();
    console.log(`   Found ${airtableClients.length} clients in Airtable`);

    let clientsSynced = 0;
    let mappingsSynced = 0;
    let clientsErrors = 0;
    let mappingsErrors = 0;

    // Get all existing client groups to map Jibble IDs to database IDs
    const existingGroups = await clientGroupsRepository.findAll();
    const jibbleGroupIdToDbId = new Map(
      existingGroups.map(g => [g.jibble_group_id, g.id])
    );

    for (const airtableClient of airtableClients) {
      try {
        // Upsert client record
        const clientData: DatabaseInsert<Client> = {
          airtable_record_id: airtableClient.recordId,
          email: airtableClient.email,
        };

        const client = await clientsRepository.upsert(clientData);
        clientsSynced++;

        // Sync group mappings for this client
        for (const jibbleGroupId of airtableClient.jibbleGroupIds) {
          try {
            // Find the corresponding client_group_id
            const clientGroupId = jibbleGroupIdToDbId.get(jibbleGroupId);

            if (!clientGroupId) {
              console.warn(`   ⚠️  Client group not found in database for Jibble ID: ${jibbleGroupId}, skipping mapping`);
              mappingsErrors++;
              continue;
            }

            // Check if mapping already exists
            const existingMapping = await clientGroupMappingsRepository.findByClientAndGroup(
              client.id,
              clientGroupId
            );

            if (!existingMapping) {
              // Create new mapping
              const mappingData: DatabaseInsert<ClientGroupMapping> = {
                client_id: client.id,
                client_group_id: clientGroupId,
              };

              await clientGroupMappingsRepository.create(mappingData);
              mappingsSynced++;
            }
          } catch (error: any) {
            console.error(`   ❌ Error syncing group mapping for ${airtableClient.email} / ${jibbleGroupId}: ${error.message}`);
            mappingsErrors++;
          }
        }
      } catch (error: any) {
        console.error(`   ❌ Error syncing client ${airtableClient.email}: ${error.message}`);
        clientsErrors++;
      }
    }

    console.log(`   ✅ Synced ${clientsSynced} clients, ${mappingsSynced} mappings`);
    console.log(`   ❌ ${clientsErrors} client errors, ${mappingsErrors} mapping errors`);

    return {
      clientsSynced,
      mappingsSynced,
      clientsErrors,
      mappingsErrors,
    };
  } catch (error: any) {
    console.error('❌ Error syncing clients:', error.message);
    throw error;
  }
}

