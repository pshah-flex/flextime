/**
 * Sync Agents Service
 * 
 * Syncs agents/members from Jibble to Supabase
 */

import { jibbleClient } from '../jibble';
import { agentsRepository } from '../repositories';
import type { JibbleMember, Agent, DatabaseInsert } from '../../types';

/**
 * Sync a single agent from Jibble
 */
export async function syncAgent(jibbleMember: JibbleMember): Promise<Agent> {
  const agentData: DatabaseInsert<Agent> = {
    jibble_member_id: jibbleMember.id,
    name: jibbleMember.fullName || jibbleMember.preferredName || jibbleMember.email || 'Unknown',
    email: jibbleMember.email || undefined,
    timezone: undefined, // Can be extracted from member settings if available
  };

  return agentsRepository.upsert(agentData);
}

/**
 * Sync all agents from Jibble
 */
export async function syncAllAgents(): Promise<{ synced: number; errors: number }> {
  try {
    console.log('🔄 Syncing agents from Jibble...');
    
    const jibbleMembers = await jibbleClient.getMembers();
    console.log(`   Found ${jibbleMembers.length} members in Jibble`);

    let synced = 0;
    let errors = 0;

    for (const member of jibbleMembers) {
      try {
        await syncAgent(member);
        synced++;
      } catch (error: any) {
        console.error(`   ❌ Error syncing agent ${member.id}: ${error.message}`);
        errors++;
      }
    }

    console.log(`   ✅ Synced ${synced} agents, ${errors} errors`);
    return { synced, errors };
  } catch (error: any) {
    console.error('❌ Error syncing agents:', error.message);
    throw error;
  }
}

