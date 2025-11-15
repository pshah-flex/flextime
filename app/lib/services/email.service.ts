/**
 * Email Service
 * 
 * Handles email sending using Resend
 */

import { Resend } from 'resend';
import type { WeeklyReport } from './weekly-report';
import { formatHoursAsHrsMin } from '../utils/format-hours';

const resend = new Resend(process.env.RESEND_API_KEY);

if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️  RESEND_API_KEY is not set. Email sending will fail.');
}

// Brand colors
const PRIMARY_COLOR = '#163C3C';
const SECONDARY_COLOR = '#ACC9A6';
const LIGHT_COLOR = '#EBFDCF';
const WHITE = '#FFFFFF';

/**
 * Generate HTML email template for weekly report
 */
function generateWeeklyReportHTML(report: WeeklyReport): string {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const periodStart = formatDate(report.period_start);
  const periodEnd = formatDate(report.period_end);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Time Tracking Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; background-color: ${WHITE}; border-collapse: collapse; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${PRIMARY_COLOR}; padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: ${WHITE}; font-size: 28px; font-weight: bold;">FlexTime</h1>
              <p style="margin: 10px 0 0 0; color: ${LIGHT_COLOR}; font-size: 16px;">Weekly Time Tracking Report</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Period -->
              <p style="margin: 0 0 30px 0; color: #666; font-size: 14px; text-align: center;">
                <strong>Period:</strong> ${periodStart} - ${periodEnd}
              </p>

              <!-- Summary Statistics -->
              <div style="background-color: ${LIGHT_COLOR}; padding: 20px; border-radius: 6px; margin-bottom: 30px;">
                <h2 style="margin: 0 0 20px 0; color: ${PRIMARY_COLOR}; font-size: 20px; font-weight: bold;">Summary</h2>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;"><strong>Total Hours:</strong></td>
                    <td style="padding: 8px 0; color: ${PRIMARY_COLOR}; font-size: 14px; font-weight: bold; text-align: right;">${formatHoursAsHrsMin(report.summary.total_hours)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;"><strong>Total Sessions:</strong></td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${report.summary.total_sessions}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;"><strong>Agents:</strong></td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${report.summary.unique_agents}</td>
                  </tr>
                  ${report.summary.incomplete_sessions > 0 ? `
                  <tr>
                    <td style="padding: 8px 0; color: #d97706; font-size: 14px;"><strong>⚠️ Incomplete Sessions:</strong></td>
                    <td style="padding: 8px 0; color: #d97706; font-size: 14px; font-weight: bold; text-align: right;">${report.summary.incomplete_sessions}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              ${report.hours_by_agent.length > 0 ? `
              <!-- Hours by Agent -->
              <div style="margin-bottom: 30px;">
                <h2 style="margin: 0 0 15px 0; color: ${PRIMARY_COLOR}; font-size: 18px; font-weight: bold; border-bottom: 2px solid ${SECONDARY_COLOR}; padding-bottom: 10px;">Hours by Agent</h2>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  ${report.hours_by_agent.map(agent => `
                  <tr style="border-bottom: 1px solid #e5e5e5;">
                    <td style="padding: 12px 0; color: #333; font-size: 14px;">
                      <strong>${agent.agent_name}</strong>
                      ${agent.incomplete_sessions > 0 ? `
                      <span style="color: #d97706; font-size: 12px; margin-left: 8px;">⚠️ ${agent.incomplete_sessions} incomplete</span>
                      ` : ''}
                      <br>
                      <span style="color: #666; font-size: 12px;">${agent.session_count} session(s)</span>
                    </td>
                    <td style="padding: 12px 0; color: ${PRIMARY_COLOR}; font-size: 16px; font-weight: bold; text-align: right;">
                      ${formatHoursAsHrsMin(agent.total_hours)}
                    </td>
                  </tr>
                  `).join('')}
                </table>
              </div>
              ` : ''}

              ${report.hours_by_activity.length > 0 ? `
              <!-- Hours by Day -->
              <div style="margin-bottom: 30px;">
                <h2 style="margin: 0 0 15px 0; color: ${PRIMARY_COLOR}; font-size: 18px; font-weight: bold; border-bottom: 2px solid ${SECONDARY_COLOR}; padding-bottom: 10px;">Hours by Day</h2>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  ${report.hours_by_activity.map(activity => `
                  <tr style="border-bottom: 1px solid #e5e5e5;">
                    <td style="padding: 12px 0; color: #333; font-size: 14px;">
                      <strong>${activity.activity_name || 'Unspecified Activity'}</strong>
                      <br>
                      <span style="color: #666; font-size: 12px;">${activity.session_count} session(s)</span>
                    </td>
                    <td style="padding: 12px 0; color: ${PRIMARY_COLOR}; font-size: 16px; font-weight: bold; text-align: right;">
                      ${formatHoursAsHrsMin(activity.total_hours)}
                    </td>
                  </tr>
                  `).join('')}
                </table>
              </div>
              ` : ''}

              ${report.incomplete_sessions_detail.length > 0 ? `
              <!-- Incomplete Sessions Notes -->
              <div style="background-color: #fef3c7; border-left: 4px solid #d97706; padding: 20px; border-radius: 6px; margin-bottom: 30px;">
                <h2 style="margin: 0 0 15px 0; color: #d97706; font-size: 18px; font-weight: bold;">⚠️ Incomplete Sessions (Notes)</h2>
                <ul style="margin: 0; padding-left: 20px; color: #78350f;">
                  ${report.incomplete_sessions_detail.map(session => {
                    const startDate = new Date(session.start_time_utc);
                    const formattedDate = startDate.toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    });
                    return `<li style="margin-bottom: 8px; font-size: 14px;">
                      <strong>${session.agent_name}</strong> (${session.group_name}) - Started: ${formattedDate}
                    </li>`;
                  }).join('')}
                </ul>
              </div>
              ` : ''}

              <!-- Footer -->
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; color: #666; font-size: 12px;">
                <p style="margin: 0;">This is an automated weekly report from FlexTime</p>
                <p style="margin: 10px 0 0 0;">Flexscale Time Tracking Analytics</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email for weekly report
 */
function generateWeeklyReportText(report: WeeklyReport): string {
  const lines: string[] = [];

  lines.push(`Weekly Time Tracking Report`);
  lines.push(`Period: ${report.period_start} to ${report.period_end}`);
  lines.push(``);

  // Summary
  lines.push(`Summary:`);
  lines.push(`  Total Hours: ${formatHoursAsHrsMin(report.summary.total_hours)}`);
  lines.push(`  Total Sessions: ${report.summary.total_sessions}`);
  lines.push(`  Agents: ${report.summary.unique_agents}`);
  if (report.summary.incomplete_sessions > 0) {
    lines.push(`  ⚠️  Incomplete Sessions: ${report.summary.incomplete_sessions}`);
  }
  lines.push(``);

  // Hours by Agent
  if (report.hours_by_agent.length > 0) {
    lines.push(`Hours by Agent:`);
    for (const agent of report.hours_by_agent) {
      lines.push(`  ${agent.agent_name}: ${formatHoursAsHrsMin(agent.total_hours)} (${agent.session_count} sessions)`);
      if (agent.incomplete_sessions > 0) {
        lines.push(`    ⚠️  ${agent.incomplete_sessions} incomplete session(s)`);
      }
    }
    lines.push(``);
  }

  // Hours by Day
  if (report.hours_by_activity.length > 0) {
    lines.push(`Hours by Day:`);
    for (const activity of report.hours_by_activity) {
      const activityName = activity.activity_name || 'Unspecified';
      lines.push(`  ${activityName}: ${formatHoursAsHrsMin(activity.total_hours)} (${activity.session_count} sessions)`);
    }
    lines.push(``);
  }

  // Incomplete Sessions
  if (report.incomplete_sessions_detail.length > 0) {
    lines.push(`⚠️  Incomplete Sessions (Notes):`);
    for (const session of report.incomplete_sessions_detail) {
      lines.push(`  ${session.agent_name} (${session.group_name}) - Started: ${session.start_time_utc}`);
    }
    lines.push(``);
  }

  return lines.join('\n');
}

/**
 * Send weekly report email to a client
 */
export async function sendWeeklyReportEmail(
  report: WeeklyReport,
  options: {
    from?: string;
    replyTo?: string;
  } = {}
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set in environment variables');
    }

    const fromEmail = options.from || process.env.RESEND_FROM_EMAIL || 'noreply@flexscale.com';
    const replyTo = options.replyTo || fromEmail;

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: report.client_email,
      replyTo: replyTo,
      subject: `Weekly Time Tracking Report - ${report.period_start} to ${report.period_end}`,
      html: generateWeeklyReportHTML(report),
      text: generateWeeklyReportText(report),
    });

    if (error) {
      throw new Error(`Resend API error: ${error.message}`);
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error: any) {
    console.error(`❌ Failed to send email to ${report.client_email}:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send weekly report emails to all clients
 */
export async function sendWeeklyReportEmailsToAllClients(
  reports: WeeklyReport[],
  options: {
    from?: string;
    replyTo?: string;
    batchSize?: number;
  } = {}
): Promise<{
  sent: number;
  failed: number;
  results: Array<{ email: string; success: boolean; messageId?: string; error?: string }>;
}> {
  const batchSize = options.batchSize || 10;
  const results: Array<{ email: string; success: boolean; messageId?: string; error?: string }> = [];
  let sent = 0;
  let failed = 0;

  console.log(`📧 Sending ${reports.length} weekly report emails...`);

  // Send emails in batches to avoid rate limits
  for (let i = 0; i < reports.length; i += batchSize) {
    const batch = reports.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (report) => {
      const result = await sendWeeklyReportEmail(report, options);
      return {
        email: report.client_email,
        ...result,
      };
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    for (const result of batchResults) {
      if (result.success) {
        sent++;
        console.log(`   ✅ Sent to ${result.email} (ID: ${result.messageId})`);
      } else {
        failed++;
        console.error(`   ❌ Failed to send to ${result.email}: ${result.error}`);
      }
    }

    // Small delay between batches to avoid rate limits
    if (i + batchSize < reports.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`   ✅ Sent ${sent} emails, ❌ ${failed} failed`);

  return {
    sent,
    failed,
    results,
  };
}


