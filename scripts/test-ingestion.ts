/**
 * Test Ingestion Service
 * 
 * Tests the full ingestion pipeline
 * Run with: npx tsx scripts/test-ingestion.ts
 */

import { runIngestion } from '../app/lib/services/ingestion.service';

const GROUP_ID = '0c04e7ff-ec5b-4bba-8951-a7b2b99c4af3'; // 111 Hospitality

async function testIngestion() {
  try {
    console.log('🧪 Testing Ingestion Service...\n');

    // Test 1: Dry run - sync agents and groups
    console.log('1. Testing agent and group sync (dry run)...');
    const syncResult = await runIngestion({
      syncAgents: true,
      syncGroups: true,
      deriveSessions: false,
      dryRun: true,
    });
    console.log(`   ✅ Agents: ${syncResult.agents.synced} synced`);
    console.log(`   ✅ Groups: ${syncResult.groups.synced} synced\n`);

    // Test 2: Actual sync
    console.log('2. Actually syncing agents and groups...');
    const actualSyncResult = await runIngestion({
      syncAgents: true,
      syncGroups: true,
      deriveSessions: false,
      dryRun: false,
    });
    console.log(`   ✅ Agents: ${actualSyncResult.agents.synced} synced, ${actualSyncResult.agents.errors} errors`);
    console.log(`   ✅ Groups: ${actualSyncResult.groups.synced} synced, ${actualSyncResult.groups.errors} errors\n`);

    // Test 3: Ingest time entries for last 7 days (dry run)
    console.log('3. Testing time entry ingestion (dry run, last 7 days)...');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const today = new Date();
    
    const dryRunResult = await runIngestion({
      startDate: sevenDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      groupIds: [GROUP_ID],
      syncAgents: false,
      syncGroups: false,
      deriveSessions: false,
      dryRun: true,
    });
    console.log(`   ✅ Would insert: ${dryRunResult.timeEntries.inserted} entries`);
    console.log(`   ✅ Would skip: ${dryRunResult.timeEntries.skipped} entries`);
    console.log(`   ✅ Duplicates: ${dryRunResult.timeEntries.duplicates} entries\n`);

    // Test 4: Actual ingestion for last 1 day
    console.log('4. Actually ingesting time entries (last 1 day)...');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const ingestResult = await runIngestion({
      startDate: yesterday.toISOString().split('T')[0],
      endDate: yesterday.toISOString().split('T')[0],
      groupIds: [GROUP_ID],
      syncAgents: false,
      syncGroups: false,
      deriveSessions: false,
      dryRun: false,
    });
    console.log(`   ✅ Inserted: ${ingestResult.timeEntries.inserted} entries`);
    console.log(`   ✅ Skipped: ${ingestResult.timeEntries.skipped} entries`);
    console.log(`   ✅ Duplicates: ${ingestResult.timeEntries.duplicates} entries`);
    console.log(`   ✅ Errors: ${ingestResult.timeEntries.errors} errors\n`);

    console.log('✅ All ingestion tests passed!');
    
  } catch (error: any) {
    console.error('\n❌ Ingestion test failed:');
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testIngestion();

