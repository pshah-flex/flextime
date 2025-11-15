/**
 * Test All Clients - End-to-End Test
 * 
 * Tests the complete flow for all clients in Airtable:
 * 1. Fetch all clients from Airtable
 * 2. Sync clients to database
 * 3. Sync groups and agents for all groups
 * 4. Ingest time entries for all groups
 * 5. Generate reports for all clients
 * 6. Send emails to all clients
 * 7. Display summary of results
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local'), override: true });

async function main() {
  try {
    console.log('🧪 Testing All Clients - End-to-End Flow\n');
    console.log('='.repeat(60));

    // Step 1: Fetch all clients from Airtable
    console.log('\n📋 Step 1: Fetching all clients from Airtable...');
    const { fetchClientEmails } = await import('../app/lib/airtable');
    const clients = await fetchClientEmails();

    if (clients.length === 0) {
      throw new Error('No clients found in Airtable');
    }

    console.log(`   ✅ Found ${clients.length} client(s):\n`);
    clients.forEach((client, index) => {
      console.log(`   ${index + 1}. ${client.email}`);
      console.log(`      Group IDs: ${client.jibbleGroupIds.join(', ')}`);
      if (client.jibbleGroupIds.length > 1) {
        console.log(`      ⚠️  Multiple groups detected (will aggregate data)`);
      }
    });

    // Step 2: Sync clients to database
    console.log('\n📋 Step 2: Syncing clients to database...');
    const { syncClientsFromAirtable } = await import('../app/lib/services/sync-clients');
    const syncResult = await syncClientsFromAirtable();
    console.log(`   ✅ Synced ${syncResult.clientsSynced} client(s), ${syncResult.mappingsSynced} group mapping(s)`);

    // Step 3: Get all unique group IDs
    const allGroupIds = Array.from(new Set(clients.flatMap(c => c.jibbleGroupIds)));
    console.log(`\n📋 Step 3: Processing ${allGroupIds.length} unique group(s)...\n`);

    // Step 4: Sync groups for all clients
    console.log('📋 Step 4: Syncing groups from Jibble...');
    const { syncAllGroups } = await import('../app/lib/services/sync-groups');
    const groupsResult = await syncAllGroups(allGroupIds);
    console.log(`   ✅ Synced ${groupsResult.inserted + groupsResult.updated} group(s)`);

    // Step 5: Sync agents for all groups
    console.log('\n📋 Step 5: Syncing agents from Jibble...');
    const { syncAllAgents } = await import('../app/lib/services/sync-agents');
    const agentsResult = await syncAllAgents(allGroupIds);
    console.log(`   ✅ Synced ${agentsResult.inserted + agentsResult.updated} agent(s)`);

    // Step 6: Ingest time entries for all groups
    console.log('\n📋 Step 6: Ingesting time entries...');
    const { runIngestion } = await import('../app/lib/services/ingestion.service');
    
    // Get date range for last 2 weeks to ensure we have data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 14); // 2 weeks ago
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`   Period: ${startDateStr} to ${endDateStr}`);
    
    const ingestionResult = await runIngestion({
      startDate: startDateStr,
      endDate: endDateStr,
      groupIds: allGroupIds,
      deriveSessions: true,
    });

    console.log(`   ✅ Time Entries: ${ingestionResult.timeEntries?.fetched || 0} fetched, ${ingestionResult.timeEntries?.inserted || 0} inserted`);
    console.log(`   ✅ Sessions: ${ingestionResult.sessions?.derived || 0} derived`);

    // Step 7: Generate reports for all clients
    console.log('\n📋 Step 7: Generating weekly reports for all clients...');
    const { generateWeeklyReportForClient } = await import('../app/lib/services/weekly-report');
    const { formatHoursAsHrsMin } = await import('../app/lib/utils/format-hours');
    
    // Calculate previous week (Sunday to Saturday)
    // Use the same logic as generatePreviousWeekReport
    const today = new Date();
    const dayOfWeek = today.getDay();
    const endReportDate = new Date(today);
    
    if (dayOfWeek === 0) {
      endReportDate.setDate(endReportDate.getDate() - 1);
    } else if (dayOfWeek === 6) {
      endReportDate.setDate(endReportDate.getDate() - 7);
    } else {
      // Go back to the Saturday of the PREVIOUS week
      // Find the Saturday of the current week first
      const currentWeekSaturday = new Date(today);
      const daysToCurrentSaturday = (6 - dayOfWeek + 7) % 7;
      currentWeekSaturday.setDate(currentWeekSaturday.getDate() + daysToCurrentSaturday);
      
      // Always go back 8 days from current week's Saturday to get previous week's Saturday
      endReportDate.setTime(currentWeekSaturday.getTime());
      endReportDate.setDate(endReportDate.getDate() - 8);
      // Now find the Saturday of that week
      const daysToSaturday = (6 - endReportDate.getDay() + 7) % 7;
      if (daysToSaturday > 0) {
        endReportDate.setDate(endReportDate.getDate() + daysToSaturday);
      }
    }
    
    endReportDate.setHours(23, 59, 59, 999);
    
    const startReportDate = new Date(endReportDate);
    startReportDate.setDate(startReportDate.getDate() - 6);
    startReportDate.setHours(0, 0, 0, 0);
    
    // Verify the dates are correct (start should be Sunday, end should be Saturday)
    if (startReportDate.getDay() !== 0) {
      const daysToSunday = startReportDate.getDay();
      startReportDate.setDate(startReportDate.getDate() - daysToSunday);
      startReportDate.setHours(0, 0, 0, 0);
      endReportDate.setTime(startReportDate.getTime());
      endReportDate.setDate(endReportDate.getDate() + 6);
      endReportDate.setHours(23, 59, 59, 999);
    }
    
    if (endReportDate.getDay() !== 6) {
      const daysToSaturday = (6 - endReportDate.getDay() + 7) % 7;
      endReportDate.setDate(endReportDate.getDate() + daysToSaturday);
      endReportDate.setHours(23, 59, 59, 999);
      startReportDate.setTime(endReportDate.getTime());
      startReportDate.setDate(startReportDate.getDate() - 6);
      startReportDate.setHours(0, 0, 0, 0);
    }

    const reportStartDateStr = startReportDate.toISOString().split('T')[0];
    const reportEndDateStr = endReportDate.toISOString().split('T')[0];

    console.log(`   Report Period: ${reportStartDateStr} to ${reportEndDateStr}\n`);

    const reports: any[] = [];
    const reportResults: Array<{
      clientEmail: string;
      success: boolean;
      totalHours: number;
      totalSessions: number;
      agents: number;
      error?: string;
    }> = [];

    for (const client of clients) {
      try {
        console.log(`   📊 Generating report for ${client.email}...`);
        const report = await generateWeeklyReportForClient({
          clientEmail: client.email,
          startDate: reportStartDateStr,
          endDate: reportEndDateStr,
        });

        reports.push(report);
        reportResults.push({
          clientEmail: client.email,
          success: true,
          totalHours: report.summary.total_hours,
          totalSessions: report.summary.total_sessions,
          agents: report.summary.unique_agents,
        });

        console.log(`      ✅ Total Hours: ${formatHoursAsHrsMin(report.summary.total_hours)}`);
        console.log(`      ✅ Sessions: ${report.summary.total_sessions}`);
        console.log(`      ✅ Agents: ${report.summary.unique_agents}`);
        if (report.hours_by_agent.length > 0) {
          console.log(`      ✅ Agents with hours:`);
          report.hours_by_agent.slice(0, 3).forEach(agent => {
            console.log(`         - ${agent.agent_name}: ${formatHoursAsHrsMin(agent.total_hours)}`);
          });
          if (report.hours_by_agent.length > 3) {
            console.log(`         ... and ${report.hours_by_agent.length - 3} more`);
          }
        }
      } catch (error: any) {
        console.error(`      ❌ Failed: ${error.message}`);
        reportResults.push({
          clientEmail: client.email,
          success: false,
          totalHours: 0,
          totalSessions: 0,
          agents: 0,
          error: error.message,
        });
      }
    }

    // Step 8: Send emails to all clients
    console.log('\n📋 Step 8: Sending emails to all clients...');
    const { sendWeeklyReportEmail } = await import('../app/lib/services/email.service');
    const fromEmail = 'notifications@notifications.flexscale.com';

    const emailResults: Array<{
      clientEmail: string;
      success: boolean;
      messageId?: string;
      error?: string;
    }> = [];

    for (const report of reports) {
      try {
        console.log(`   📧 Sending email to ${report.client_email}...`);
        const result = await sendWeeklyReportEmail(report, {
          from: fromEmail,
        });

        if (result.success) {
          emailResults.push({
            clientEmail: report.client_email,
            success: true,
            messageId: result.messageId,
          });
          console.log(`      ✅ Email sent (ID: ${result.messageId})`);
        } else {
          emailResults.push({
            clientEmail: report.client_email,
            success: false,
            error: result.error,
          });
          console.error(`      ❌ Failed: ${result.error}`);
        }
        
        // Add delay between emails to avoid rate limits (2 emails per second)
        await new Promise(resolve => setTimeout(resolve, 600)); // 600ms = ~1.67 per second
      } catch (error: any) {
        console.error(`      ❌ Error: ${error.message}`);
        emailResults.push({
          clientEmail: report.client_email,
          success: false,
          error: error.message,
        });
        // Add delay even on error
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }

    // Step 9: Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY\n');
    
    console.log('Clients Processed:');
    clients.forEach((client, index) => {
      const reportResult = reportResults.find(r => r.clientEmail === client.email);
      const emailResult = emailResults.find(e => e.clientEmail === client.email);
      
      console.log(`\n${index + 1}. ${client.email}`);
      console.log(`   Groups: ${client.jibbleGroupIds.join(', ')}`);
      
      if (reportResult?.success) {
        console.log(`   📊 Report: ✅ ${formatHoursAsHrsMin(reportResult.totalHours)} | ${reportResult.totalSessions} sessions | ${reportResult.agents} agents`);
      } else {
        console.log(`   📊 Report: ❌ ${reportResult?.error || 'Failed'}`);
      }
      
      if (emailResult?.success) {
        console.log(`   📧 Email: ✅ Sent (ID: ${emailResult.messageId})`);
      } else {
        console.log(`   📧 Email: ❌ ${emailResult?.error || 'Failed'}`);
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ All Clients Test Completed!\n');

    // Summary statistics
    const successfulReports = reportResults.filter(r => r.success).length;
    const successfulEmails = emailResults.filter(e => e.success).length;
    const totalHours = reportResults
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.totalHours, 0);
    const totalSessions = reportResults
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.totalSessions, 0);

    console.log('📈 Overall Statistics:');
    console.log(`   Clients: ${clients.length}`);
    console.log(`   Groups: ${allGroupIds.length}`);
    console.log(`   Reports Generated: ${successfulReports}/${clients.length}`);
    console.log(`   Emails Sent: ${successfulEmails}/${clients.length}`);
    console.log(`   Total Hours (across all clients): ${formatHoursAsHrsMin(totalHours)}`);
    console.log(`   Total Sessions (across all clients): ${totalSessions}`);
    console.log('');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

