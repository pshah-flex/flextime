/**
 * Clock-in/Clock-out Detection Service
 * 
 * Identifies first and last activity per day per agent
 */

import { getSupabaseAdmin } from '../supabase';
import { activitiesRepository } from '../repositories';
import type { Activity, Agent } from '../../types';

const supabase = getSupabaseAdmin();

// ============================================================================
// Type Definitions
// ============================================================================

export interface ClockInOutRecord {
  agent_id: string;
  agent_name: string;
  date: string; // ISO date (YYYY-MM-DD)
  clock_in_time_utc: string | null;
  clock_in_time_local?: string | null;
  clock_out_time_utc: string | null;
  clock_out_time_local?: string | null;
  total_hours?: number | null;
  is_complete: boolean; // Has both clock-in and clock-out
}

export interface ClockInOutOptions {
  startDate: string; // ISO date (YYYY-MM-DD)
  endDate: string; // ISO date (YYYY-MM-DD)
  agentId?: string;
  clientGroupId?: string;
  timezone?: string; // For local time conversion (e.g., 'America/Los_Angeles')
}

// ============================================================================
// Helper Functions
// ============================================================================

function minutesToHours(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100;
}

/**
 * Convert UTC timestamp to local time string
 */
function toLocalTime(utcTime: string, timezone?: string): string {
  if (!timezone) {
    return utcTime;
  }

  try {
    const date = new Date(utcTime);
    return date.toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (error) {
    return utcTime; // Fallback to UTC
  }
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Get clock-in/clock-out records for a date range
 */
export async function getClockInOutRecords(
  options: ClockInOutOptions
): Promise<ClockInOutRecord[]> {
  // Get activities for the date range
  const activities = await activitiesRepository.findMany({
    startDate: `${options.startDate}T00:00:00Z`,
    endDate: `${options.endDate}T23:59:59Z`,
    agentId: options.agentId,
    clientGroupId: options.clientGroupId,
  });

  // Group by agent and date
  const recordsMap = new Map<string, ClockInOutRecord>();

  for (const activity of activities) {
    const key = `${activity.agent_id}:${activity.belongs_to_date}`;

    if (!recordsMap.has(key)) {
      // Get agent name
      const { data: agentData } = await supabase
        .from('agents')
        .select('name')
        .eq('id', activity.agent_id)
        .single();

      recordsMap.set(key, {
        agent_id: activity.agent_id,
        agent_name: agentData?.name || 'Unknown',
        date: activity.belongs_to_date,
        clock_in_time_utc: null,
        clock_in_time_local: null,
        clock_out_time_utc: null,
        clock_out_time_local: null,
        is_complete: false,
      });
    }

    const record = recordsMap.get(key)!;

    if (activity.entry_type === 'In') {
      if (!record.clock_in_time_utc || activity.time_utc < record.clock_in_time_utc) {
        record.clock_in_time_utc = activity.time_utc;
        record.clock_in_time_local = activity.local_time || toLocalTime(activity.time_utc, options.timezone);
      }
    } else if (activity.entry_type === 'Out') {
      if (!record.clock_out_time_utc || activity.time_utc > record.clock_out_time_utc) {
        record.clock_out_time_utc = activity.time_utc;
        record.clock_out_time_local = activity.local_time || toLocalTime(activity.time_utc, options.timezone);
      }
    }
  }

  // Calculate totals and completeness
  const records = Array.from(recordsMap.values());

  for (const record of records) {
    record.is_complete = !!(record.clock_in_time_utc && record.clock_out_time_utc);

    if (record.clock_in_time_utc && record.clock_out_time_utc) {
      const start = new Date(record.clock_in_time_utc);
      const end = new Date(record.clock_out_time_utc);
      const minutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      record.total_hours = minutesToHours(minutes);
    }
  }

  // Sort by date and agent name
  records.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return a.agent_name.localeCompare(b.agent_name);
  });

  return records;
}

/**
 * Get clock-in/clock-out records for a specific agent
 */
export async function getClockInOutForAgent(
  agentId: string,
  options: Omit<ClockInOutOptions, 'agentId'>
): Promise<ClockInOutRecord[]> {
  return getClockInOutRecords({
    ...options,
    agentId,
  });
}

/**
 * Get clock-in/clock-out records for a specific date
 */
export async function getClockInOutForDate(
  date: string, // ISO date (YYYY-MM-DD)
  options: Omit<ClockInOutOptions, 'startDate' | 'endDate'>
): Promise<ClockInOutRecord[]> {
  return getClockInOutRecords({
    ...options,
    startDate: date,
    endDate: date,
  });
}

/**
 * Get first activity (clock-in) for a day
 */
export async function getFirstActivityOfDay(
  agentId: string,
  date: string // ISO date (YYYY-MM-DD)
): Promise<Activity | null> {
  const activities = await activitiesRepository.findByAgentId(
    agentId,
    `${date}T00:00:00Z`,
    `${date}T23:59:59Z`
  );

  const inActivities = activities
    .filter(a => a.entry_type === 'In')
    .sort((a, b) => new Date(a.time_utc).getTime() - new Date(b.time_utc).getTime());

  return inActivities[0] || null;
}

/**
 * Get last activity (clock-out) for a day
 */
export async function getLastActivityOfDay(
  agentId: string,
  date: string // ISO date (YYYY-MM-DD)
): Promise<Activity | null> {
  const activities = await activitiesRepository.findByAgentId(
    agentId,
    `${date}T00:00:00Z`,
    `${date}T23:59:59Z`
  );

  const outActivities = activities
    .filter(a => a.entry_type === 'Out')
    .sort((a, b) => new Date(b.time_utc).getTime() - new Date(a.time_utc).getTime());

  return outActivities[0] || null;
}

