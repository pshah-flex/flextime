/**
 * Backfill Script
 * 
 * Backfills historical data from Jibble
 * 
 * Usage:
 *   npx tsx scripts/backfill.ts --startDate=2024-01-01 --endDate=2024-01-31
 *   npx tsx scripts/backfill.ts --startDate=2024-01-01 --endDate=2024-01-31 --groupIds=group-id-1,group-id-2
 */

import { runIngestion } from '../app/lib/services/ingestion.service';

async function main() {
  const args = process.argv.slice(2);
  const options: any = {};

  // Parse command line arguments
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      if (key === 'startDate') {
        options.startDate = value;
      } else if (key === 'endDate') {
        options.endDate = value;
      } else if (key === 'groupIds') {
        options.groupIds = value.split(',');
      } else if (key === 'dryRun') {
        options.dryRun = value === 'true';
      } else if (key === 'deriveSessions') {
        options.deriveSessions = value === 'true';
      }
    }
  }

  if (!options.startDate || !options.endDate) {
    console.error('❌ Error: startDate and endDate are required');
    console.error('Usage: npx tsx scripts/backfill.ts --startDate=2024-01-01 --endDate=2024-01-31');
    process.exit(1);
  }

  console.log(`🔄 Starting backfill from ${options.startDate} to ${options.endDate}`);
  if (options.groupIds) {
    console.log(`   Group IDs: ${options.groupIds.join(', ')}`);
  }
  if (options.dryRun) {
    console.log('   ⚠️  DRY RUN MODE - No data will be written');
  }
  console.log('');

  try {
    const result = await runIngestion({
      startDate: options.startDate,
      endDate: options.endDate,
      groupIds: options.groupIds,
      syncAgents: true,
      syncGroups: true,
      deriveSessions: options.deriveSessions || false,
      dryRun: options.dryRun || false,
    });

    console.log('\n✅ Backfill complete!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Backfill failed:', error.message);
    process.exit(1);
  }
}

main();

