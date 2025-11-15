/**
 * Ingestion Service
 * 
 * Main service that orchestrates the full ingestion pipeline
 */

import { syncAllAgents } from './sync-agents';
import { syncAllGroups } from './sync-groups';
import { ingestTimeEntries, ingestIncrementalTimeEntries } from './ingest-time-entries';
import { deriveSessionsForDateRange } from './derive-sessions';
import { getSupabaseAdmin } from '../supabase';
import type { ActivitySession, DatabaseInsert } from '../../types';

interface IngestionOptions {
  startDate?: string; // ISO date string (YYYY-MM-DD)
  endDate?: string; // ISO date string (YYYY-MM-DD)
  groupIds?: string[];
  syncAgents?: boolean;
  syncGroups?: boolean;
  deriveSessions?: boolean;
  dryRun?: boolean;
}

interface IngestionResult {
  agents: { synced: number; errors: number };
  groups: { synced: number; errors: number };
  timeEntries: {
    fetched: number;
    inserted: number;
    skipped: number;
    errors: number;
    duplicates: number;
  };
  sessions?: {
    derived: number;
    errors: number;
  };
}

/**
 * Main ingestion function
 * Orchestrates the full pipeline: sync agents/groups, ingest time entries, derive sessions
 */
export async function runIngestion(options: IngestionOptions = {}): Promise<IngestionResult> {
  const supabase = getSupabaseAdmin();
  const result: IngestionResult = {
    agents: { synced: 0, errors: 0 },
    groups: { synced: 0, errors: 0 },
    timeEntries: {
      fetched: 0,
      inserted: 0,
      skipped: 0,
      errors: 0,
      duplicates: 0,
    },
  };

  try {
    console.log('🚀 Starting ingestion pipeline...\n');

    // Step 1: Sync agents
    if (options.syncAgents !== false) {
      console.log('📋 Step 1: Syncing agents...');
      result.agents = await syncAllAgents();
      console.log('');
    }

    // Step 2: Sync groups
    if (options.syncGroups !== false) {
      console.log('📋 Step 2: Syncing groups...');
      result.groups = await syncAllGroups();
      console.log('');
    }

    // Step 3: Ingest time entries
    console.log('📋 Step 3: Ingesting time entries...');
    const startDate = options.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = options.endDate || new Date().toISOString().split('T')[0];

    if (options.startDate && options.endDate) {
      // Full date range ingestion
      result.timeEntries = await ingestTimeEntries(startDate, endDate, {
        groupIds: options.groupIds,
        dryRun: options.dryRun,
      });
    } else {
      // Incremental ingestion (last 7 days by default)
      result.timeEntries = await ingestIncrementalTimeEntries(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        {
          groupIds: options.groupIds,
          dryRun: options.dryRun,
        }
      );
    }
    console.log('');

    // Step 4: Derive sessions (optional)
    if (options.deriveSessions !== false && result.timeEntries.inserted > 0) {
      console.log('📋 Step 4: Deriving sessions...');
      try {
        const sessions = await deriveSessionsForDateRange(startDate, endDate, {
          clientGroupId: options.groupIds?.[0],
        });

        if (!options.dryRun && sessions.length > 0) {
          // Store sessions in database
          const sessionsToInsert: DatabaseInsert<ActivitySession>[] = sessions.map(s => ({
            activity_id: s.activity_id || undefined,
            agent_id: s.agent_id,
            client_group_id: s.client_group_id,
            start_time_utc: s.start_time_utc,
            end_time_utc: s.end_time_utc || undefined,
            duration_minutes: s.duration_minutes || undefined,
            is_complete: s.is_complete,
          }));

          // Batch insert sessions
          const batchSize = 100;
          let inserted = 0;
          let errors = 0;

          for (let i = 0; i < sessionsToInsert.length; i += batchSize) {
            const batch = sessionsToInsert.slice(i, i + batchSize);
            try {
              const { error } = await supabase
                .from('activity_sessions')
                .insert(batch);
              
              if (error) throw error;
              inserted += batch.length;
            } catch (error: any) {
              console.error(`   ❌ Error inserting session batch: ${error.message}`);
              errors += batch.length;
            }
          }

          result.sessions = {
            derived: sessions.length,
            errors,
          };
          console.log(`   ✅ Derived ${sessions.length} sessions, ${inserted} inserted, ${errors} errors`);
        } else {
          result.sessions = {
            derived: sessions.length,
            errors: 0,
          };
          console.log(`   ✅ Derived ${sessions.length} sessions (dry run)`);
        }
      } catch (error: any) {
        console.error(`   ❌ Error deriving sessions: ${error.message}`);
        result.sessions = {
          derived: 0,
          errors: 1,
        };
      }
      console.log('');
    }

    console.log('✅ Ingestion pipeline complete!\n');
    console.log('📊 Summary:');
    console.log(`   Agents: ${result.agents.synced} synced, ${result.agents.errors} errors`);
    console.log(`   Groups: ${result.groups.synced} synced, ${result.groups.errors} errors`);
    console.log(`   Time Entries: ${result.timeEntries.inserted} inserted, ${result.timeEntries.duplicates} duplicates, ${result.timeEntries.skipped} skipped, ${result.timeEntries.errors} errors`);
    if (result.sessions) {
      console.log(`   Sessions: ${result.sessions.derived} derived, ${result.sessions.errors} errors`);
    }

    return result;
  } catch (error: any) {
    console.error('❌ Ingestion pipeline failed:', error.message);
    throw error;
  }
}

/**
 * Run incremental ingestion (last N hours)
 */
export async function runIncrementalIngestion(hours: number = 1): Promise<IngestionResult> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  return runIngestion({
    startDate: since.split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    syncAgents: true,
    syncGroups: true,
    deriveSessions: false, // Sessions can be derived separately
  });
}

