/**
 * Weekly Report Generation Service
 * 
 * Generates weekly summaries for clients, aggregating across all associated groups
 */

import { getSupabaseAdmin } from '../supabase';
import { 
  getHoursByAgent, 
  getHoursByActivity, 
  getHoursByClientGroup,
  getSummaryStats,
  type AggregationOptions,
  type HoursByAgent,
  type HoursByActivity,
  type HoursByClientGroup,
} from './aggregations';
import { getGroupsForClient } from '../airtable';
import type { Client, ClientGroupMapping } from '../../types';

const supabase = getSupabaseAdmin();

// ============================================================================
// Type Definitions
// ============================================================================

export interface WeeklyReport {
  client_email: string;
  client_id?: string;
  period_start: string; // ISO date (YYYY-MM-DD)
  period_end: string; // ISO date (YYYY-MM-DD)
  summary: {
    total_hours: number;
    total_minutes: number;
    total_sessions: number;
    incomplete_sessions: number;
    unique_agents: number;
    unique_groups: number;
    unique_activities: number;
  };
  hours_by_agent: HoursByAgent[];
  hours_by_activity: HoursByActivity[];
  hours_by_group: HoursByClientGroup[];
  incomplete_sessions_detail: IncompleteSessionDetail[];
}

export interface IncompleteSessionDetail {
  agent_id: string;
  agent_name: string;
  client_group_id: string;
  group_name: string;
  start_time_utc: string;
  start_time_local?: string;
  belongs_to_date: string;
}

export interface WeeklyReportOptions {
  startDate: string; // ISO date (YYYY-MM-DD)
  endDate: string; // ISO date (YYYY-MM-DD)
  clientEmail?: string; // Generate for specific client
  includeIncomplete?: boolean; // Default: true
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all client group IDs for a client email
 * This aggregates across all groups associated with the client via client_group_mappings
 */
async function getClientGroupIds(clientEmail: string): Promise<string[]> {
  // First, try to get from database
  const { data: clientData, error: clientError } = await supabase
    .from('clients')
    .select(`
      id,
      client_group_mappings!inner (
        client_group_id
      )
    `)
    .eq('email', clientEmail)
    .single();

  if (!clientError && clientData) {
    const mappings = clientData.client_group_mappings as any[];
    return mappings.map(m => m.client_group_id);
  }

  // Fallback to Airtable
  try {
    const jibbleGroupIds = await getGroupsForClient(clientEmail);
    if (jibbleGroupIds && jibbleGroupIds.length > 0) {
      // Get client group IDs from Jibble group IDs
      const { data: groupData } = await supabase
        .from('client_groups')
        .select('id')
        .in('jibble_group_id', jibbleGroupIds);

      return groupData?.map(g => g.id) || [];
    }
  } catch (error) {
    console.warn(`Failed to get groups from Airtable for ${clientEmail}:`, error);
  }

  return [];
}

/**
 * Get incomplete sessions for a client
 */
async function getIncompleteSessionsForClient(
  clientGroupIds: string[],
  startDate: string,
  endDate: string
): Promise<IncompleteSessionDetail[]> {
  if (clientGroupIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('activity_sessions')
    .select(`
      agent_id,
      client_group_id,
      start_time_utc,
      activities!inner (
        belongs_to_date
      ),
      agents!inner (
        name
      ),
      client_groups!inner (
        group_name
      )
    `)
    .in('client_group_id', clientGroupIds)
    .eq('is_complete', false)
    .gte('start_time_utc', `${startDate}T00:00:00Z`)
    .lte('start_time_utc', `${endDate}T23:59:59Z`);

  if (error) {
    throw new Error(`Failed to get incomplete sessions: ${error.message}`);
  }

  // Note: The belongs_to_date join might need adjustment based on actual schema
  // For now, we'll extract it from the activity if available
  return (data || []).map((session: any) => ({
    agent_id: session.agent_id,
    agent_name: session.agents?.name || 'Unknown',
    client_group_id: session.client_group_id,
    group_name: session.client_groups?.group_name || 'Unknown',
    start_time_utc: session.start_time_utc,
    belongs_to_date: session.activities?.belongs_to_date || session.start_time_utc.split('T')[0],
  }));
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Generate weekly report for a specific client
 * Aggregates data across ALL groups associated with the client
 */
export async function generateWeeklyReportForClient(
  options: WeeklyReportOptions & { clientEmail: string }
): Promise<WeeklyReport> {
  const { clientEmail, ...reportOptions } = options;
  // Get all group IDs for this client
  const clientGroupIds = await getClientGroupIds(clientEmail);

  if (clientGroupIds.length === 0) {
    throw new Error(`No groups found for client: ${clientEmail}`);
  }

  // Get client ID from database
  const { data: clientData } = await supabase
    .from('clients')
    .select('id')
    .eq('email', clientEmail)
    .single();

  // Build aggregation options
  const aggOptions: AggregationOptions = {
    startDate: reportOptions.startDate,
    endDate: reportOptions.endDate,
    clientGroupIds,
    includeIncomplete: reportOptions.includeIncomplete !== false,
  };

  // Get all aggregations
  const [summary, hoursByAgent, hoursByActivity, hoursByGroup, incompleteSessions] = await Promise.all([
    getSummaryStats(aggOptions),
    getHoursByAgent(aggOptions),
    getHoursByActivity(aggOptions),
    getHoursByClientGroup(aggOptions),
    getIncompleteSessionsForClient(clientGroupIds, reportOptions.startDate, reportOptions.endDate),
  ]);

  return {
    client_email: clientEmail,
    client_id: clientData?.id,
    period_start: reportOptions.startDate,
    period_end: reportOptions.endDate,
    summary,
    hours_by_agent: hoursByAgent,
    hours_by_activity: hoursByActivity,
    hours_by_group: hoursByGroup,
    incomplete_sessions_detail: incompleteSessions,
  };
}

/**
 * Generate weekly reports for all clients
 */
export async function generateWeeklyReportsForAllClients(
  options: WeeklyReportOptions
): Promise<WeeklyReport[]> {
  // Get all client emails from Airtable
  const { getAllClientEmails } = await import('../airtable');
  const clientEmails = await getAllClientEmails();

  // Generate reports for each client
  const reports: WeeklyReport[] = [];
  const errors: Array<{ email: string; error: string }> = [];

  for (const email of clientEmails) {
    try {
      const report = await generateWeeklyReportForClient({
        ...options,
        clientEmail: email,
      });
      reports.push(report);
    } catch (error: any) {
      console.error(`Failed to generate report for ${email}:`, error.message);
      errors.push({ email, error: error.message });
    }
  }

  if (errors.length > 0) {
    console.warn(`Failed to generate reports for ${errors.length} clients:`, errors);
  }

  return reports;
}

/**
 * Generate weekly report for previous week (Sunday to Saturday)
 * Week runs from Sunday 00:00:00 to Saturday 23:59:59
 */
export async function generatePreviousWeekReport(
  clientEmail?: string
): Promise<WeeklyReport | WeeklyReport[]> {
  // Get today's date
  const today = new Date();
  
  // Get last Saturday (most recent Saturday)
  // If today is Sunday (day 0), get last Saturday (7 days ago)
  // Otherwise, get the Saturday from the previous week
  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
  const endDate = new Date(today);
  
  if (dayOfWeek === 0) {
    // Today is Sunday, so last Saturday is yesterday (1 day ago)
    endDate.setDate(endDate.getDate() - 1);
  } else {
    // Go back to the most recent Saturday
    endDate.setDate(endDate.getDate() - (dayOfWeek + 1));
  }
  
  // Set to Saturday 23:59:59
  endDate.setHours(23, 59, 59, 999);
  
  // Get previous Sunday (start of the week)
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 6); // 6 days before Saturday = Sunday
  startDate.setHours(0, 0, 0, 0); // Sunday 00:00:00

  const options: WeeklyReportOptions = {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };

  if (clientEmail) {
    return generateWeeklyReportForClient({
      ...options,
      clientEmail,
    });
  } else {
    return generateWeeklyReportsForAllClients(options);
  }
}

/**
 * Format weekly report for email digest
 */
export function formatWeeklyReportForEmail(report: WeeklyReport): string {
  const { formatHoursAsHrsMin } = require('../utils/format-hours');
  const lines: string[] = [];

  lines.push(`Weekly Time Tracking Report`);
  lines.push(`Period: ${report.period_start} to ${report.period_end}`);
  lines.push(``);

  // Summary
  lines.push(`Summary:`);
  lines.push(`  Total Hours: ${formatHoursAsHrsMin(report.summary.total_hours)}`);
  lines.push(`  Total Sessions: ${report.summary.total_sessions}`);
  lines.push(`  Unique Agents: ${report.summary.unique_agents}`);
  lines.push(`  Unique Groups: ${report.summary.unique_groups}`);
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

  // Hours by Activity
  if (report.hours_by_activity.length > 0) {
    lines.push(`Hours by Activity:`);
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

