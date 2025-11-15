/**
 * Test Client Email Flow
 * 
 * End-to-end test for:
 * 1. Pulling client data from Airtable
 * 2. Verifying Jibble Group ID and email
 * 3. Generating weekly report
 * 4. Sending email
 * 
 * Usage:
 *   npx tsx scripts/test-client-email-flow.ts
 * 
 * Make sure environment variables are set in .env.local
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables FIRST with override to ensure they're set
config({ path: resolve(process.cwd(), '.env.local'), override: true });

// Verify critical environment variables are loaded
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set in .env.local');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in .env.local');
}
if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set in .env.local');
}
if (!process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN) {
  throw new Error('AIRTABLE_PERSONAL_ACCESS_TOKEN is not set in .env.local');
}

// Use dynamic imports after environment variables are loaded
async function main() {
  // Dynamic imports after env vars are loaded
  const { fetchClientEmails } = await import('../app/lib/airtable');
  const { syncClientsFromAirtable } = await import('../app/lib/services/sync-clients');
  const { syncAllGroups } = await import('../app/lib/services/sync-groups');
  const { generateWeeklyReportForClient } = await import('../app/lib/services/weekly-report');
  const { sendWeeklyReportEmail } = await import('../app/lib/services/email.service');
  console.log('🧪 Testing Client Email Flow for "111 Hospitality"\n');

  try {
    // Step 1: Fetch clients from Airtable
    console.log('📋 Step 1: Fetching clients from Airtable...');
    const airtableClients = await fetchClientEmails();
    console.log(`   ✅ Found ${airtableClients.length} clients in Airtable\n`);

    // Find the specific client (111 Hospitality)
    const clientEmail = 'paramdshah@gmail.com';
    const expectedGroupId = '0c04e7ff-ec5b-4bba-8951-a7b2b99c4af3';
    
    const client = airtableClients.find(c => 
      c.email.toLowerCase() === clientEmail.toLowerCase()
    );

    if (!client) {
      throw new Error(`Client with email ${clientEmail} not found in Airtable`);
    }

    console.log('📧 Client Details from Airtable:');
    console.log(`   Email: ${client.email}`);
    console.log(`   Record ID: ${client.recordId}`);
    console.log(`   Jibble Group IDs: ${client.jibbleGroupIds.join(', ')}\n`);

    // Verify the group ID matches
    if (!client.jibbleGroupIds.includes(expectedGroupId)) {
      throw new Error(
        `Expected Group ID ${expectedGroupId} not found. ` +
        `Found: ${client.jibbleGroupIds.join(', ')}`
      );
    }

    console.log(`   ✅ Group ID ${expectedGroupId} found in client's groups\n`);

    // Step 2: Sync groups from Jibble (required before syncing clients)
    console.log('📋 Step 2: Syncing groups from Jibble...');
    const groupsSyncResult = await syncAllGroups();
    console.log(`   ✅ Synced ${groupsSyncResult.synced} groups, ${groupsSyncResult.errors} errors\n`);

    // Step 3: Sync clients to database
    console.log('📋 Step 3: Syncing clients to database...');
    const syncResult = await syncClientsFromAirtable();
    console.log(`   ✅ Synced ${syncResult.clientsSynced} clients, ${syncResult.mappingsSynced} mappings\n`);

    // Step 4: Generate weekly report for previous week
    console.log('📋 Step 4: Generating weekly report...');
    
    // Get previous week (Monday to Sunday)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - endDate.getDay()); // Last Sunday
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6); // Previous Monday

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`   Period: ${startDateStr} to ${endDateStr}`);

    const report = await generateWeeklyReportForClient({
      clientEmail: clientEmail,
      startDate: startDateStr,
      endDate: endDateStr,
    });

    console.log(`   ✅ Report generated for ${clientEmail}`);
    console.log(`   Total Hours: ${report.summary.total_hours.toFixed(2)}`);
    console.log(`   Total Sessions: ${report.summary.total_sessions}`);
    console.log(`   Unique Agents: ${report.summary.unique_agents}`);
    console.log(`   Unique Groups: ${report.summary.unique_groups}`);
    console.log(`   Incomplete Sessions: ${report.summary.incomplete_sessions}\n`);

    if (report.hours_by_agent.length > 0) {
      console.log('   Hours by Agent:');
      report.hours_by_agent.forEach(agent => {
        console.log(`     - ${agent.agent_name}: ${agent.total_hours.toFixed(2)} hrs (${agent.session_count} sessions)`);
      });
      console.log('');
    }

    if (report.hours_by_activity.length > 0) {
      console.log('   Hours by Activity:');
      report.hours_by_activity.forEach(activity => {
        console.log(`     - ${activity.activity_name || 'Unspecified'}: ${activity.total_hours.toFixed(2)} hrs`);
      });
      console.log('');
    }

    // Step 5: Send email
    console.log('📋 Step 5: Sending email...');
    // Use Resend's test domain for testing (no domain verification needed)
    // Note: Resend test mode only allows sending to param@flexscale.com
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const testEmail = 'param@flexscale.com'; // Resend test mode restriction
    console.log(`   From: ${fromEmail}`);
    console.log(`   To: ${testEmail} (Resend test mode - original: ${clientEmail})`);
    
    // Create a test report with the allowed email
    const testReport = {
      ...report,
      client_email: testEmail,
    };
    
    const emailResult = await sendWeeklyReportEmail(testReport, {
      from: fromEmail,
    });

    if (emailResult.success) {
      console.log(`   ✅ Email sent successfully!`);
      console.log(`   Message ID: ${emailResult.messageId}\n`);
    } else {
      throw new Error(`Failed to send email: ${emailResult.error}`);
    }

    console.log('✅ End-to-end test completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Client Email: ${clientEmail}`);
    console.log(`   Jibble Group ID: ${expectedGroupId} ✅`);
    console.log(`   Report Period: ${startDateStr} to ${endDateStr}`);
    console.log(`   Total Hours: ${report.summary.total_hours.toFixed(2)}`);
    console.log(`   Email Sent: Yes ✅`);
    console.log(`   Message ID: ${emailResult.messageId}`);

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

