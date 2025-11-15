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
      // Generate previous week report (Sunday to Saturday)
      // Use the same logic as generatePreviousWeekReport
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
      const endDate = new Date(today);
      
      if (dayOfWeek === 0) {
        // Today is Sunday, so last Saturday is yesterday
        endDate.setDate(endDate.getDate() - 1);
      } else if (dayOfWeek === 6) {
        // Today is Saturday, so last Saturday is 7 days ago
        endDate.setDate(endDate.getDate() - 7);
      } else {
        // Go back to the Saturday of the PREVIOUS week
        // Find the Saturday of the current week first
        const currentWeekSaturday = new Date(today);
        const daysToCurrentSaturday = (6 - dayOfWeek + 7) % 7;
        currentWeekSaturday.setDate(currentWeekSaturday.getDate() + daysToCurrentSaturday);
        
        // Always go back 8 days from current week's Saturday to get previous week's Saturday
        endDate.setTime(currentWeekSaturday.getTime());
        endDate.setDate(endDate.getDate() - 8);
        // Now find the Saturday of that week
        const daysToSaturday = (6 - endDate.getDay() + 7) % 7;
        if (daysToSaturday > 0) {
          endDate.setDate(endDate.getDate() + daysToSaturday);
        }
      }
      
      // Set to Saturday 23:59:59
      endDate.setHours(23, 59, 59, 999);
      
      // Get previous Sunday (start of the week)
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6); // 6 days before Saturday = Sunday
      startDate.setHours(0, 0, 0, 0); // Sunday 00:00:00
      
      // Verify the dates are correct (start should be Sunday, end should be Saturday)
      if (startDate.getDay() !== 0) {
        const daysToSunday = startDate.getDay();
        startDate.setDate(startDate.getDate() - daysToSunday);
        startDate.setHours(0, 0, 0, 0);
        endDate.setTime(startDate.getTime());
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      }
      
      if (endDate.getDay() !== 6) {
        const daysToSaturday = (6 - endDate.getDay() + 7) % 7;
        endDate.setDate(endDate.getDate() + daysToSaturday);
        endDate.setHours(23, 59, 59, 999);
        startDate.setTime(endDate.getTime());
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
      }

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
  // Get previous week (Sunday to Saturday)
  // Use the same logic as generatePreviousWeekReport
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
  const endDate = new Date(today);
  
  if (dayOfWeek === 0) {
    // Today is Sunday, so last Saturday is yesterday
    endDate.setDate(endDate.getDate() - 1);
  } else if (dayOfWeek === 6) {
    // Today is Saturday, so last Saturday is 7 days ago
    endDate.setDate(endDate.getDate() - 7);
  } else {
    // Go back to the Saturday of the PREVIOUS week
    // Find the Saturday of the current week first
    const currentWeekSaturday = new Date(today);
    const daysToCurrentSaturday = (6 - dayOfWeek + 7) % 7;
    currentWeekSaturday.setDate(currentWeekSaturday.getDate() + daysToCurrentSaturday);
    
    // Always go back 8 days from current week's Saturday to get previous week's Saturday
    endDate.setTime(currentWeekSaturday.getTime());
    endDate.setDate(endDate.getDate() - 8);
    // Now find the Saturday of that week
    const daysToSaturday = (6 - endDate.getDay() + 7) % 7;
    if (daysToSaturday > 0) {
      endDate.setDate(endDate.getDate() + daysToSaturday);
    }
  }
  
  // Set to Saturday 23:59:59
  endDate.setHours(23, 59, 59, 999);
  
  // Get previous Sunday (start of the week)
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 6); // 6 days before Saturday = Sunday
  startDate.setHours(0, 0, 0, 0); // Sunday 00:00:00
  
  // Verify the dates are correct (start should be Sunday, end should be Saturday)
  if (startDate.getDay() !== 0) {
    const daysToSunday = startDate.getDay();
    startDate.setDate(startDate.getDate() - daysToSunday);
    startDate.setHours(0, 0, 0, 0);
    endDate.setTime(startDate.getTime());
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
  }
  
  if (endDate.getDay() !== 6) {
    const daysToSaturday = (6 - endDate.getDay() + 7) % 7;
    endDate.setDate(endDate.getDate() + daysToSaturday);
    endDate.setHours(23, 59, 59, 999);
    startDate.setTime(endDate.getTime());
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
  }

  return runWeeklyEmailJob({
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    ...options,
  });
}

