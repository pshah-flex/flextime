/**
 * Sync Client Groups Service
 * 
 * Syncs groups from Jibble to Supabase
 */

import { jibbleClient } from '../jibble';
import { clientGroupsRepository } from '../repositories';
import type { JibbleGroup, ClientGroup, DatabaseInsert } from '../../types';

/**
 * Sync a single group from Jibble
 */
export async function syncGroup(jibbleGroup: JibbleGroup): Promise<ClientGroup> {
  const groupData: DatabaseInsert<ClientGroup> = {
    jibble_group_id: jibbleGroup.id,
    group_name: jibbleGroup.name,
    group_code: undefined, // Jibble groups don't have a code field in the API response
  };

  return clientGroupsRepository.upsert(groupData);
}

/**
 * Sync all groups from Jibble
 */
export async function syncAllGroups(): Promise<{ synced: number; errors: number }> {
  try {
    console.log('🔄 Syncing groups from Jibble...');
    
    const jibbleGroups = await jibbleClient.getGroups();
    console.log(`   Found ${jibbleGroups.length} groups in Jibble`);

    let synced = 0;
    let errors = 0;

    for (const group of jibbleGroups) {
      try {
        await syncGroup(group);
        synced++;
      } catch (error: any) {
        console.error(`   ❌ Error syncing group ${group.id}: ${error.message}`);
        errors++;
      }
    }

    console.log(`   ✅ Synced ${synced} groups, ${errors} errors`);
    return { synced, errors };
  } catch (error: any) {
    console.error('❌ Error syncing groups:', error.message);
    throw error;
  }
}

