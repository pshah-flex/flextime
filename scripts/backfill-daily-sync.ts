/**
 * Backfill Daily Sync Script
 * 
 * Backfills daily sync data from November 1, 2025 to yesterday
 * Includes delays between days to avoid rate limiting
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local BEFORE any other imports
config({ path: resolve(process.cwd(), '.env.local'), override: true });

async function main() {
  // Dynamic imports after env vars are loaded
  const { runDailySync } = await import('../app/lib/services/daily-sync.service');
  const { getPacificDate, getPreviousDayPacific } = await import('../app/lib/utils/timezone');
  
  console.log('🔄 Starting Daily Sync Backfill\n');
  
  // Start date: November 1, 2025
  const startDate = new Date('2025-11-01T12:00:00Z');
  
  // End date: yesterday in Pacific time
  const yesterdayPacific = getPreviousDayPacific();
  const [endYear, endMonth, endDay] = yesterdayPacific.split('-').map(Number);
  const endDate = new Date(Date.UTC(endYear, endMonth - 1, endDay, 12, 0, 0));
  
  console.log(`   Start date: ${startDate.toISOString().split('T')[0]} (Pacific Time)`);
  console.log(`   End date: ${yesterdayPacific} (Pacific Time)`);
  console.log('');
  
  // Generate list of dates to sync
  const datesToSync: string[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const year = currentDate.getUTCFullYear();
    const month = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getUTCDate()).padStart(2, '0');
    datesToSync.push(`${year}-${month}-${day}`);
    
    // Move to next day
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }
  
  console.log(`   Total days to sync: ${datesToSync.length}\n`);
  
  const results: Array<{
    date: string;
    success: boolean;
    agents: number;
    groups: number;
    timeEntries: number;
    sessions: number;
    error?: string;
  }> = [];
  
  let successCount = 0;
  let errorCount = 0;
  
  // Sync each day with a delay between days
  for (let i = 0; i < datesToSync.length; i++) {
    const date = datesToSync[i];
    console.log(`\n📅 [${i + 1}/${datesToSync.length}] Syncing ${date}...`);
    
    try {
      const result = await runDailySync(date);
      
      results.push({
        date,
        success: true,
        agents: result.agents.synced,
        groups: result.groups.synced,
        timeEntries: result.timeEntries.inserted,
        sessions: result.sessions.inserted,
      });
      
      successCount++;
      console.log(`   ✅ Success: ${result.timeEntries.inserted} time entries, ${result.sessions.inserted} sessions`);
      
      // Add delay between days (2 seconds to avoid rate limiting)
      if (i < datesToSync.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error: any) {
      console.error(`   ❌ Error syncing ${date}: ${error.message}`);
      results.push({
        date,
        success: false,
        agents: 0,
        groups: 0,
        timeEntries: 0,
        sessions: 0,
        error: error.message,
      });
      errorCount++;
      
      // Add delay even on error
      if (i < datesToSync.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  // Summary
  console.log('\n\n✅ Backfill complete!\n');
  console.log('📊 Summary:');
  console.log(`   Total days: ${datesToSync.length}`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Failed: ${errorCount}`);
  console.log(`   Total time entries: ${results.reduce((sum, r) => sum + r.timeEntries, 0)}`);
  console.log(`   Total sessions: ${results.reduce((sum, r) => sum + r.sessions, 0)}`);
  
  if (errorCount > 0) {
    console.log('\n❌ Failed dates:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   ${r.date}: ${r.error}`);
    });
  }
  
  console.log('');
}

main().catch(console.error);

