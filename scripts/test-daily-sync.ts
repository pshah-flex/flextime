/**
 * Test Daily Sync Script
 * 
 * Test the daily sync service with a specific date or previous day
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { runDailySync } from '../app/lib/services/daily-sync.service';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local'), override: true });

async function main() {
  console.log('🧪 Testing Daily Sync Service\n');

  // Get target date from command line argument, or use previous day
  const targetDate = process.argv[2];

  if (targetDate) {
    console.log(`   Target date: ${targetDate} (Pacific Time)`);
    console.log('');
  } else {
    console.log('   Using previous day (Pacific Time)');
    console.log('');
  }

  try {
    const result = await runDailySync(targetDate);

    console.log('\n✅ Daily sync test complete!\n');
    console.log('📊 Results:');
    console.log(`   Date synced: ${result.date} (Pacific Time)`);
    console.log(`   Agents: ${result.agents.synced} synced, ${result.agents.errors} errors`);
    console.log(`   Groups: ${result.groups.synced} synced, ${result.groups.errors} errors`);
    console.log(`   Time Entries: ${result.timeEntries.fetched} fetched, ${result.timeEntries.inserted} inserted, ${result.timeEntries.duplicates} duplicates`);
    console.log(`   Sessions: ${result.sessions.derived} derived, ${result.sessions.inserted} inserted, ${result.sessions.skipped} skipped`);

    if (result.error) {
      console.error(`\n❌ Error: ${result.error}`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();

