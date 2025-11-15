/**
 * Test Email with New Domain
 * 
 * Tests sending an email to the actual client email using the new Resend domain
 * (notifications@notifications.flexscale.com)
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local'), override: true });

async function main() {
  try {
    console.log('🧪 Testing Email with New Domain (notifications.flexscale.com)\n');

    // Step 1: Get client data from Airtable
    console.log('📋 Step 1: Fetching client data from Airtable...');
    const { fetchClientEmails } = await import('../app/lib/airtable');
    const clients = await fetchClientEmails();

    // Find the test client (111 Hospitality)
    const client = clients.find(c =>
      c.email.toLowerCase() === 'paramdshah@gmail.com' ||
      c.jibbleGroupIds.includes('0c04e7ff-ec5b-4bba-8951-a7b2b99c4af3')
    );

    if (!client) {
      throw new Error('Client not found in Airtable');
    }

    console.log('   ✅ Client found:');
    console.log(`      Email: ${client.email}`);
    console.log(`      Group IDs: ${client.jibbleGroupIds.join(', ')}\n`);

    // Step 2: Generate weekly report
    console.log('📋 Step 2: Generating weekly report...');
    const { generateWeeklyReportForClient } = await import('../app/lib/services/weekly-report');
    
    // Generate report for Nov 3-9 period (Sunday to Saturday)
    const report = await generateWeeklyReportForClient({
      clientEmail: client.email,
      startDate: '2025-11-03',
      endDate: '2025-11-09',
    });

    console.log('   ✅ Report generated:');
    console.log(`      Period: ${report.period_start} to ${report.period_end}`);
    console.log(`      Total Hours: ${report.summary.total_hours.toFixed(2)}`);
    console.log(`      Total Sessions: ${report.summary.total_sessions}`);
    console.log(`      Agents: ${report.summary.unique_agents}\n`);

    if (report.hours_by_day && report.hours_by_day.length > 0) {
      console.log('   Hours by Day:');
      report.hours_by_day.forEach(day => {
        console.log(`      - ${day.date_formatted}: ${day.session_count} session(s)`);
      });
      console.log('');
    }

    // Step 3: Send email with new domain
    console.log('📋 Step 3: Sending email with new domain...');
    const { sendWeeklyReportEmail } = await import('../app/lib/services/email.service');
    const { formatHoursAsHrsMin } = await import('../app/lib/utils/format-hours');
    
    // Use the new domain
    const fromEmail = 'notifications@notifications.flexscale.com';

    console.log('   📧 Email details:');
    console.log(`      From: ${fromEmail}`);
    console.log(`      To: ${report.client_email}`);
    console.log(`      Domain: notifications.flexscale.com\n`);

    const result = await sendWeeklyReportEmail(report, {
      from: fromEmail,
    });

    if (result.success) {
      console.log('   ✅ Email sent successfully!');
      console.log(`      Message ID: ${result.messageId}`);
      console.log(`      To: ${report.client_email}`);
      console.log(`      From: ${fromEmail}\n`);
    } else {
      throw new Error(`Failed to send email: ${result.error}`);
    }

    console.log('✅ Test completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Client Email: ${client.email} ✅`);
    console.log(`   Report Period: ${report.period_start} to ${report.period_end}`);
    console.log(`   Total Hours: ${formatHoursAsHrsMin(report.summary.total_hours)}`);
    console.log(`   Total Sessions: ${report.summary.total_sessions}`);
    console.log(`   Email Sent: Yes ✅`);
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   From Domain: notifications.flexscale.com ✅`);

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

