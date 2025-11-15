/**
 * Ingest Time Entries Service
 * 
 * Fetches time entries from Jibble and stores them in Supabase
 */

import { jibbleClient } from '../jibble';
import { 
  activitiesRepository, 
  agentsRepository, 
  clientGroupsRepository 
} from '../repositories';
import type { JibbleTimeEntry, Activity, DatabaseInsert } from '../../types';

/**
 * Normalize a Jibble time entry to our Activity format
 */
function normalizeTimeEntry(
  jibbleEntry: JibbleTimeEntry,
  agentId: string,
  clientGroupId: string
): DatabaseInsert<Activity> {
  return {
    jibble_time_entry_id: jibbleEntry.id,
    agent_id: agentId,
    client_group_id: clientGroupId,
    activity_id: jibbleEntry.activityId || undefined,
    entry_type: jibbleEntry.type, // 'In' or 'Out'
    time_utc: jibbleEntry.time, // Already in UTC
    local_time: jibbleEntry.localTime || undefined,
    belongs_to_date: jibbleEntry.belongsToDate, // YYYY-MM-DD format
    raw_payload: jibbleEntry, // Store full payload for auditing
  };
}

/**
 * Ingest time entries for a date range
 */
export async function ingestTimeEntries(
  startDate: string,
  endDate: string,
  options: {
    groupIds?: string[];
    dryRun?: boolean;
  } = {}
): Promise<{ 
  fetched: number; 
  inserted: number; 
  skipped: number; 
  errors: number;
  duplicates: number;
}> {
  try {
    console.log(`🔄 Ingesting time entries from ${startDate} to ${endDate}...`);

    // Step 1: Sync agents and groups first (ensure they exist)
    console.log('   Step 1: Ensuring agents and groups are synced...');
    const [agents, groups, jibbleMembers] = await Promise.all([
      agentsRepository.findAll(),
      clientGroupsRepository.findAll(),
      jibbleClient.getMembers(), // Fetch once for group mapping
    ]);
    
    const agentMap = new Map(agents.map(a => [a.jibble_member_id, a.id]));
    const groupMap = new Map(groups.map(g => [g.jibble_group_id, g.id]));
    const memberToGroupMap = new Map(jibbleMembers.map(m => [m.id, m.groupId]));

    // Step 2: Fetch time entries from Jibble
    console.log('   Step 2: Fetching time entries from Jibble...');
    let jibbleEntries: JibbleTimeEntry[];
    
    if (options.groupIds && options.groupIds.length > 0) {
      // Fetch for specific groups
      const allEntries: JibbleTimeEntry[] = [];
      for (const groupId of options.groupIds) {
        const entries = await jibbleClient.getTimeEntriesForGroup(groupId, startDate, endDate);
        allEntries.push(...entries);
      }
      jibbleEntries = allEntries;
    } else {
      // Fetch all entries
      jibbleEntries = await jibbleClient.getTimeEntries(startDate, endDate);
    }

    console.log(`   Found ${jibbleEntries.length} time entries in Jibble`);

    // Step 3: Process and store entries
    console.log('   Step 3: Processing time entries...');
    let inserted = 0;
    let skipped = 0;
    let duplicates = 0;
    let errors = 0;

    // Batch processing for efficiency
    const batchSize = 100;
    for (let i = 0; i < jibbleEntries.length; i += batchSize) {
      const batch = jibbleEntries.slice(i, i + batchSize);
      const activitiesToInsert: DatabaseInsert<Activity>[] = [];

      for (const entry of batch) {
        try {
          // Get agent ID
          const agentId = agentMap.get(entry.personId);
          if (!agentId) {
            console.warn(`   ⚠️  Agent not found for personId: ${entry.personId}, skipping entry ${entry.id}`);
            skipped++;
            continue;
          }

          // Get group ID from member's groupId (using pre-fetched map)
          const memberGroupId = memberToGroupMap.get(entry.personId);
          if (!memberGroupId) {
            console.warn(`   ⚠️  Group not found for personId: ${entry.personId}, skipping entry ${entry.id}`);
            skipped++;
            continue;
          }

          const clientGroupId = groupMap.get(memberGroupId);
          if (!clientGroupId) {
            console.warn(`   ⚠️  Client group not found for groupId: ${memberGroupId}, skipping entry ${entry.id}`);
            skipped++;
            continue;
          }

          // Check for duplicates
          const existing = await activitiesRepository.findByJibbleTimeEntryId(entry.id);
          if (existing) {
            duplicates++;
            continue;
          }

          // Normalize and prepare for insert
          // Ensure entry_type is valid ('In' or 'Out')
          if (entry.type !== 'In' && entry.type !== 'Out') {
            console.warn(`   ⚠️  Invalid entry_type '${entry.type}' for entry ${entry.id}, skipping`);
            skipped++;
            continue;
          }
          
          const activityData = normalizeTimeEntry(entry, agentId, clientGroupId);
          activitiesToInsert.push(activityData);
        } catch (error: any) {
          console.error(`   ❌ Error processing entry ${entry.id}: ${error.message}`);
          errors++;
        }
      }

      // Bulk insert batch
      if (activitiesToInsert.length > 0 && !options.dryRun) {
        try {
          await activitiesRepository.createMany(activitiesToInsert);
          inserted += activitiesToInsert.length;
        } catch (error: any) {
          console.error(`   ❌ Error inserting batch: ${error.message}`);
          errors += activitiesToInsert.length;
        }
      } else if (activitiesToInsert.length > 0 && options.dryRun) {
        inserted += activitiesToInsert.length;
      }
    }

    console.log(`   ✅ Ingested ${inserted} entries, ${duplicates} duplicates, ${skipped} skipped, ${errors} errors`);
    
    return {
      fetched: jibbleEntries.length,
      inserted,
      skipped,
      errors,
      duplicates,
    };
  } catch (error: any) {
    console.error('❌ Error ingesting time entries:', error.message);
    throw error;
  }
}

/**
 * Ingest time entries incrementally (only new entries since last run)
 */
export async function ingestIncrementalTimeEntries(
  since: string, // ISO timestamp
  options: {
    groupIds?: string[];
    dryRun?: boolean;
  } = {}
): Promise<{ 
  fetched: number; 
  inserted: number; 
  skipped: number; 
  errors: number;
  duplicates: number;
}> {
  const now = new Date().toISOString();
  return ingestTimeEntries(since, now, options);
}

