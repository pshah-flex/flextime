/**
 * Daily Sync Service
 * 
 * Syncs previous day's Jibble data to Supabase
 * Designed to run daily at 5 AM Pacific Time
 */

import { syncAllAgents } from './sync-agents';
import { syncAllGroups } from './sync-groups';
import { ingestTimeEntries } from './ingest-time-entries';
import { deriveSessionsForDateRange } from './derive-sessions';
import { getSupabaseAdmin } from '../supabase';
import { getPreviousDayPacific, getDateRangePacific, getPacificDateForDate } from '../utils/timezone';
import type { ActivitySession, DatabaseInsert } from '../../types';

export interface DailySyncResult {
  success: boolean;
  date: string; // Date synced (YYYY-MM-DD in Pacific timezone)
  agents: { synced: number; errors: number };
  groups: { synced: number; errors: number };
  timeEntries: {
    fetched: number;
    inserted: number;
    skipped: number;
    errors: number;
    duplicates: number;
  };
  sessions: {
    derived: number;
    inserted: number;
    skipped: number;
    errors: number;
  };
  error?: string;
}

/**
 * Run daily sync for a specific date (previous day by default)
 * @param targetDate - Optional date to sync (YYYY-MM-DD format). If not provided, syncs previous day in Pacific time.
 * @returns DailySyncResult with sync statistics
 */
export async function runDailySync(targetDate?: string): Promise<DailySyncResult> {
  try {
    const supabase = getSupabaseAdmin();
    
    // Determine date to sync (previous day in Pacific time if not specified)
    const dateToSync = targetDate || getPreviousDayPacific();
    
    console.log(`🔄 Starting daily sync for ${dateToSync} (Pacific Time)...`);
    console.log(`   Current Pacific date: ${getPacificDateForDate()}`);
    console.log('');
    
    // Get date range in UTC for API calls
    const { startUTC, endUTC } = getDateRangePacific(dateToSync);
    const startDate = dateToSync; // YYYY-MM-DD for ingestTimeEntries
    const endDate = dateToSync; // YYYY-MM-DD for ingestTimeEntries
    
    console.log(`   Date range (UTC): ${startUTC} to ${endUTC}`);
    console.log('');
    
    // Step 1: Sync agents (full sync)
    console.log('📋 Step 1: Syncing agents...');
    const agentsResult = await syncAllAgents();
    console.log('');
    
    // Step 2: Sync groups (full sync)
    console.log('📋 Step 2: Syncing groups...');
    const groupsResult = await syncAllGroups();
    console.log('');
    
    // Step 3: Sync time entries for previous day (incremental)
    console.log(`📋 Step 3: Ingesting time entries for ${dateToSync}...`);
    const timeEntriesResult = await ingestTimeEntries(startDate, endDate, {
      dryRun: false,
    });
    console.log('');
    
    // Step 4: Derive sessions from time entries
    console.log(`📋 Step 4: Deriving sessions for ${dateToSync}...`);
    let sessionsDerived = 0;
    let sessionsInserted = 0;
    let sessionsSkipped = 0;
    let sessionsErrors = 0;
    
    try {
      const sessions = await deriveSessionsForDateRange(startDate, endDate);
      sessionsDerived = sessions.length;
      
      if (sessions.length > 0) {
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

        // Batch insert sessions with duplicate handling
        const batchSize = 100;
        
        for (let i = 0; i < sessionsToInsert.length; i += batchSize) {
          const batch = sessionsToInsert.slice(i, i + batchSize);
          
          // Try inserting one by one to handle duplicates gracefully
          for (const session of batch) {
            try {
              const { error: insertError } = await supabase
                .from('activity_sessions')
                .insert(session)
                .select()
                .single();
              
              if (insertError) {
                // Check if it's a duplicate (unique constraint violation)
                if (insertError.code === '23505' || insertError.message?.includes('duplicate') || insertError.message?.includes('unique')) {
                  sessionsSkipped++;
                  continue;
                }
                throw insertError;
              }
              sessionsInserted++;
            } catch (err: any) {
              // Handle duplicates
              if (err.code === '23505' || err.message?.includes('duplicate') || err.message?.includes('unique')) {
                sessionsSkipped++;
              } else {
                sessionsErrors++;
                console.error(`   ⚠️  Error inserting session: ${err.message}`);
              }
            }
          }
        }
        
        console.log(`   ✅ Derived ${sessionsDerived} sessions, ${sessionsInserted} inserted, ${sessionsSkipped} skipped (duplicates), ${sessionsErrors} errors`);
      } else {
        console.log(`   ℹ️  No sessions to derive for ${dateToSync}`);
      }
    } catch (error: any) {
      console.error(`   ❌ Error deriving sessions: ${error.message}`);
      sessionsErrors++;
    }
    console.log('');
    
    // Summary
    const result: DailySyncResult = {
      success: true,
      date: dateToSync,
      agents: agentsResult,
      groups: groupsResult,
      timeEntries: timeEntriesResult,
      sessions: {
        derived: sessionsDerived,
        inserted: sessionsInserted,
        skipped: sessionsSkipped,
        errors: sessionsErrors,
      },
    };
    
    console.log('✅ Daily sync complete!\n');
    console.log('📊 Summary:');
    console.log(`   Date synced: ${dateToSync} (Pacific Time)`);
    console.log(`   Agents: ${agentsResult.synced} synced, ${agentsResult.errors} errors`);
    console.log(`   Groups: ${groupsResult.synced} synced, ${groupsResult.errors} errors`);
    console.log(`   Time Entries: ${timeEntriesResult.fetched} fetched, ${timeEntriesResult.inserted} inserted, ${timeEntriesResult.duplicates} duplicates, ${timeEntriesResult.skipped} skipped, ${timeEntriesResult.errors} errors`);
    console.log(`   Sessions: ${sessionsDerived} derived, ${sessionsInserted} inserted, ${sessionsSkipped} skipped, ${sessionsErrors} errors`);
    
    return result;
  } catch (error: any) {
    console.error('❌ Daily sync failed:', error.message);
    throw error;
  }
}

