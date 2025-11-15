/**
 * Test Weekly Email Job
 * 
 * Script to test the weekly email generation and sending
 * 
 * Usage:
 *   npx tsx scripts/test-weekly-email.ts
 * 
 * Environment variables required:
 *   - RESEND_API_KEY
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - AIRTABLE_PERSONAL_ACCESS_TOKEN
 *   - JIBBLE_CLIENT_ID
 *   - JIBBLE_CLIENT_SECRET
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { runWeeklyEmailJob, runPreviousWeekEmailJob } from '../app/lib/services/weekly-email-job';

async function main() {
  console.log('🧪 Testing Weekly Email Job\n');

  try {
    // Test previous week email job (default)
    console.log('📧 Running previous week email job...\n');
    const result = await runPreviousWeekEmailJob({
      syncClients: true, // Sync clients from Airtable first
      // Optionally override email addresses:
      // fromEmail: 'noreply@flexscale.com',
      // replyTo: 'support@flexscale.com',
    });

    console.log('\n✅ Test completed successfully!');
    console.log('\n📊 Results:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

