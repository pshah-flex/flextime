/**
 * Weekly Email Job Service
 * 
 * Orchestrates the weekly email digest generation and sending
 */

import { generateWeeklyReportsForAllClients, generatePreviousWeekReport } from './weekly-report';
import { sendWeeklyReportEmailsToAllClients } from './email.service';
import { syncClientsFromAirtable } from './sync-clients';

interface WeeklyEmailJobResult {
  clientsSynced: {
    clientsSynced: number;
    mappingsSynced: number;
    clientsErrors: number;
    mappingsErrors: number;
  };
  reportsGenerated: number;
  emailsSent: number;
  emailsFailed: number;
  emailResults: Array<{ email: string; success: boolean; messageId?: string; error?: string }>;
  period: {
    start: string;
    end: string;
  };
}

/**
 * Run weekly email job
 * 
 * This job:
 * 1. Syncs clients from Airtable
 * 2. Generates weekly reports for all clients
 * 3. Sends emails to all clients
 */
export async function runWeeklyEmailJob(options: {
  startDate?: string; // ISO date (YYYY-MM-DD)
  endDate?: string; // ISO date (YYYY-MM-DD)
  syncClients?: boolean; // Default: true
  fromEmail?: string;
  replyTo?: string;
} = {}): Promise<WeeklyEmailJobResult> {
  try {
    console.log('📧 Starting weekly email job...\n');

    // Step 1: Sync clients from Airtable (if needed)
    let clientsSyncResult = {
      clientsSynced: 0,
      mappingsSynced: 0,
      clientsErrors: 0,
      mappingsErrors: 0,
    };

    if (options.syncClients !== false) {
      console.log('📋 Step 1: Syncing clients from Airtable...');
      clientsSyncResult = await syncClientsFromAirtable();
      console.log('');
    }

    // Step 2: Generate weekly reports
    console.log('📋 Step 2: Generating weekly reports...');
    let reports;
    let period = { start: '', end: '' };

    if (options.startDate && options.endDate) {
      period.start = options.startDate;
      period.end = options.endDate;
      reports = await generateWeeklyReportsForAllClients({
        startDate: options.startDate,
        endDate: options.endDate,
      });
    } else {
      // Generate previous week report
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - endDate.getDay()); // Last Sunday
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6); // Previous Monday

      period.start = startDate.toISOString().split('T')[0];
      period.end = endDate.toISOString().split('T')[0];

      reports = await generateWeeklyReportsForAllClients({
        startDate: period.start,
        endDate: period.end,
      });
    }

    console.log(`   ✅ Generated ${reports.length} reports\n`);

    // Step 3: Send emails
    console.log('📋 Step 3: Sending weekly report emails...');
    const emailResult = await sendWeeklyReportEmailsToAllClients(reports, {
      from: options.fromEmail,
      replyTo: options.replyTo,
    });
    console.log('');

    console.log('✅ Weekly email job complete!\n');
    console.log('📊 Summary:');
    console.log(`   Clients synced: ${clientsSyncResult.clientsSynced} clients, ${clientsSyncResult.mappingsSynced} mappings`);
    console.log(`   Reports generated: ${reports.length}`);
    console.log(`   Emails sent: ${emailResult.sent}`);
    console.log(`   Emails failed: ${emailResult.failed}`);
    console.log(`   Period: ${period.start} to ${period.end}`);

    return {
      clientsSynced: clientsSyncResult,
      reportsGenerated: reports.length,
      emailsSent: emailResult.sent,
      emailsFailed: emailResult.failed,
      emailResults: emailResult.results,
      period,
    };
  } catch (error: any) {
    console.error('❌ Weekly email job failed:', error.message);
    throw error;
  }
}

/**
 * Run weekly email job for previous week
 */
export async function runPreviousWeekEmailJob(options: {
  syncClients?: boolean;
  fromEmail?: string;
  replyTo?: string;
} = {}): Promise<WeeklyEmailJobResult> {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - endDate.getDay()); // Last Sunday
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 6); // Previous Monday

  return runWeeklyEmailJob({
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    ...options,
  });
}

