/**
 * Aggregation Service
 * 
 * Calculates hours and statistics from activity sessions
 */

import { getSupabaseAdmin } from '../supabase';
import type { Agent, ClientGroup, ActivitySession } from '../../types';

const supabase = getSupabaseAdmin();

// ============================================================================
// Type Definitions
// ============================================================================

export interface HoursByAgent {
  agent_id: string;
  agent_name: string;
  agent_email?: string | null;
  total_hours: number;
  total_minutes: number;
  session_count: number;
  incomplete_sessions: number;
}

export interface HoursByActivity {
  activity_id: string | null;
  activity_name?: string | null;
  total_hours: number;
  total_minutes: number;
  session_count: number;
}

export interface HoursByDay {
  date: string; // YYYY-MM-DD
  date_formatted: string; // e.g., "Nov 2"
  total_hours: number;
  total_minutes: number;
  session_count: number;
}

export interface HoursByClientGroup {
  client_group_id: string;
  group_name: string;
  total_hours: number;
  total_minutes: number;
  session_count: number;
  agent_count: number;
  incomplete_sessions: number;
}

export interface HoursByAgentAndActivity {
  agent_id: string;
  agent_name: string;
  activity_id: string | null;
  activity_name?: string | null;
  total_hours: number;
  total_minutes: number;
  session_count: number;
}

export interface HoursByGroupAndActivity {
  client_group_id: string;
  group_name: string;
  activity_id: string | null;
  activity_name?: string | null;
  total_hours: number;
  total_minutes: number;
  session_count: number;
}

export interface AggregationOptions {
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string; // ISO date string (YYYY-MM-DD)
  agentIds?: string[];
  clientGroupIds?: string[];
  activityIds?: string[];
  includeIncomplete?: boolean; // Default: true
}

// ============================================================================
// Helper Functions
// ============================================================================

function minutesToHours(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100; // Round to 2 decimal places
}

// ============================================================================
// Aggregation Functions
// ============================================================================

/**
 * Calculate hours per agent over time period
 */
export async function getHoursByAgent(
  options: AggregationOptions
): Promise<HoursByAgent[]> {
  let query = supabase
    .from('activity_sessions')
    .select(`
      agent_id,
      duration_minutes,
      is_complete,
      agents!inner (
        id,
        name,
        email
      )
    `)
    .gte('start_time_utc', `${options.startDate}T00:00:00Z`)
    .lte('start_time_utc', `${options.endDate}T23:59:59Z`);

  if (options.agentIds && options.agentIds.length > 0) {
    query = query.in('agent_id', options.agentIds);
  }

  if (options.clientGroupIds && options.clientGroupIds.length > 0) {
    query = query.in('client_group_id', options.clientGroupIds);
  }

  if (options.includeIncomplete === false) {
    query = query.eq('is_complete', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get hours by agent: ${error.message}`);
  }

  // Aggregate by agent
  const agentMap = new Map<string, HoursByAgent>();

  for (const session of data || []) {
    const agentId = session.agent_id;
    const agent = session.agents as any;

    if (!agentMap.has(agentId)) {
      agentMap.set(agentId, {
        agent_id: agentId,
        agent_name: agent.name,
        agent_email: agent.email,
        total_hours: 0,
        total_minutes: 0,
        session_count: 0,
        incomplete_sessions: 0,
      });
    }

    const stats = agentMap.get(agentId)!;
    stats.session_count++;

    if (!session.is_complete) {
      stats.incomplete_sessions++;
    }

    if (session.duration_minutes) {
      stats.total_minutes += session.duration_minutes;
      stats.total_hours = minutesToHours(stats.total_minutes);
    }
  }

  return Array.from(agentMap.values()).sort((a, b) => b.total_hours - a.total_hours);
}

/**
 * Calculate hours per activity over time period
 */
export async function getHoursByActivity(
  options: AggregationOptions
): Promise<HoursByActivity[]> {
  let query = supabase
    .from('activity_sessions')
    .select(`
      activity_id,
      duration_minutes,
      activities!left (
        id,
        activity_id
      )
    `)
    .gte('start_time_utc', `${options.startDate}T00:00:00Z`)
    .lte('start_time_utc', `${options.endDate}T23:59:59Z`);

  if (options.agentIds && options.agentIds.length > 0) {
    query = query.in('agent_id', options.agentIds);
  }

  if (options.clientGroupIds && options.clientGroupIds.length > 0) {
    query = query.in('client_group_id', options.clientGroupIds);
  }

  if (options.activityIds && options.activityIds.length > 0) {
    query = query.in('activity_id', options.activityIds);
  }

  if (options.includeIncomplete === false) {
    query = query.eq('is_complete', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get hours by activity: ${error.message}`);
  }

  // Aggregate by activity
  const activityMap = new Map<string | null, HoursByActivity>();

  for (const session of data || []) {
    const activityId = session.activity_id;
    const activity = session.activities as any;

    if (!activityMap.has(activityId)) {
      activityMap.set(activityId, {
        activity_id: activityId,
        activity_name: activity?.activity_id || null,
        total_hours: 0,
        total_minutes: 0,
        session_count: 0,
      });
    }

    const stats = activityMap.get(activityId)!;
    stats.session_count++;

    if (session.duration_minutes) {
      stats.total_minutes += session.duration_minutes;
      stats.total_hours = minutesToHours(stats.total_minutes);
    }
  }

  return Array.from(activityMap.values()).sort((a, b) => b.total_hours - a.total_hours);
}

/**
 * Calculate hours per day over time period
 */
export async function getHoursByDay(
  options: AggregationOptions
): Promise<HoursByDay[]> {
  let query = supabase
    .from('activity_sessions')
    .select(`
      start_time_utc,
      duration_minutes
    `)
    .gte('start_time_utc', `${options.startDate}T00:00:00Z`)
    .lte('start_time_utc', `${options.endDate}T23:59:59Z`);

  if (options.agentIds && options.agentIds.length > 0) {
    query = query.in('agent_id', options.agentIds);
  }

  if (options.clientGroupIds && options.clientGroupIds.length > 0) {
    query = query.in('client_group_id', options.clientGroupIds);
  }

  if (options.includeIncomplete === false) {
    query = query.eq('is_complete', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get hours by day: ${error.message}`);
  }

  // Aggregate by date
  const dayMap = new Map<string, HoursByDay>();

  for (const session of data || []) {
    // Extract date from start_time_utc (YYYY-MM-DD)
    const dateStr = session.start_time_utc.split('T')[0];
    
    if (!dayMap.has(dateStr)) {
      // Format date as "Nov 2"
      const date = new Date(dateStr + 'T00:00:00Z');
      const dateFormatted = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      dayMap.set(dateStr, {
        date: dateStr,
        date_formatted: dateFormatted,
        total_hours: 0,
        total_minutes: 0,
        session_count: 0,
      });
    }

    const stats = dayMap.get(dateStr)!;
    stats.session_count++;

    if (session.duration_minutes) {
      stats.total_minutes += session.duration_minutes;
      stats.total_hours = minutesToHours(stats.total_minutes);
    }
  }

  // Sort by date (ascending)
  return Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate hours per client group over time period
 */
export async function getHoursByClientGroup(
  options: AggregationOptions
): Promise<HoursByClientGroup[]> {
  let query = supabase
    .from('activity_sessions')
    .select(`
      client_group_id,
      agent_id,
      duration_minutes,
      is_complete,
      client_groups!inner (
        id,
        group_name
      )
    `)
    .gte('start_time_utc', `${options.startDate}T00:00:00Z`)
    .lte('start_time_utc', `${options.endDate}T23:59:59Z`);

  if (options.agentIds && options.agentIds.length > 0) {
    query = query.in('agent_id', options.agentIds);
  }

  if (options.clientGroupIds && options.clientGroupIds.length > 0) {
    query = query.in('client_group_id', options.clientGroupIds);
  }

  if (options.includeIncomplete === false) {
    query = query.eq('is_complete', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get hours by client group: ${error.message}`);
  }

  // Aggregate by client group
  const groupMap = new Map<string, HoursByClientGroup>();
  const groupAgentSet = new Map<string, Set<string>>();

  for (const session of data || []) {
    const groupId = session.client_group_id;
    const group = session.client_groups as any;

    if (!groupMap.has(groupId)) {
      groupMap.set(groupId, {
        client_group_id: groupId,
        group_name: group.group_name,
        total_hours: 0,
        total_minutes: 0,
        session_count: 0,
        agent_count: 0,
        incomplete_sessions: 0,
      });
      groupAgentSet.set(groupId, new Set());
    }

    const stats = groupMap.get(groupId)!;
    const agentSet = groupAgentSet.get(groupId)!;
    
    stats.session_count++;
    agentSet.add(session.agent_id);

    if (!session.is_complete) {
      stats.incomplete_sessions++;
    }

    if (session.duration_minutes) {
      stats.total_minutes += session.duration_minutes;
      stats.total_hours = minutesToHours(stats.total_minutes);
    }
  }

  // Set agent counts
  for (const [groupId, stats] of groupMap.entries()) {
    stats.agent_count = groupAgentSet.get(groupId)!.size;
  }

  return Array.from(groupMap.values()).sort((a, b) => b.total_hours - a.total_hours);
}

/**
 * Calculate hours by agent and activity (combined aggregation)
 */
export async function getHoursByAgentAndActivity(
  options: AggregationOptions
): Promise<HoursByAgentAndActivity[]> {
  let query = supabase
    .from('activity_sessions')
    .select(`
      agent_id,
      activity_id,
      duration_minutes,
      agents!inner (
        id,
        name
      ),
      activities!left (
        id,
        activity_id
      )
    `)
    .gte('start_time_utc', `${options.startDate}T00:00:00Z`)
    .lte('start_time_utc', `${options.endDate}T23:59:59Z`);

  if (options.agentIds && options.agentIds.length > 0) {
    query = query.in('agent_id', options.agentIds);
  }

  if (options.clientGroupIds && options.clientGroupIds.length > 0) {
    query = query.in('client_group_id', options.clientGroupIds);
  }

  if (options.activityIds && options.activityIds.length > 0) {
    query = query.in('activity_id', options.activityIds);
  }

  if (options.includeIncomplete === false) {
    query = query.eq('is_complete', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get hours by agent and activity: ${error.message}`);
  }

  // Aggregate by agent and activity
  const keyMap = new Map<string, HoursByAgentAndActivity>();

  for (const session of data || []) {
    const agent = session.agents as any;
    const activity = session.activities as any;
    const key = `${session.agent_id}:${session.activity_id || 'null'}`;

    if (!keyMap.has(key)) {
      keyMap.set(key, {
        agent_id: session.agent_id,
        agent_name: agent.name,
        activity_id: session.activity_id,
        activity_name: activity?.activity_id || null,
        total_hours: 0,
        total_minutes: 0,
        session_count: 0,
      });
    }

    const stats = keyMap.get(key)!;
    stats.session_count++;

    if (session.duration_minutes) {
      stats.total_minutes += session.duration_minutes;
      stats.total_hours = minutesToHours(stats.total_minutes);
    }
  }

  return Array.from(keyMap.values()).sort((a, b) => b.total_hours - a.total_hours);
}

/**
 * Calculate hours by group and activity (combined aggregation)
 */
export async function getHoursByGroupAndActivity(
  options: AggregationOptions
): Promise<HoursByGroupAndActivity[]> {
  let query = supabase
    .from('activity_sessions')
    .select(`
      client_group_id,
      activity_id,
      duration_minutes,
      client_groups!inner (
        id,
        group_name
      ),
      activities!left (
        id,
        activity_id
      )
    `)
    .gte('start_time_utc', `${options.startDate}T00:00:00Z`)
    .lte('start_time_utc', `${options.endDate}T23:59:59Z`);

  if (options.agentIds && options.agentIds.length > 0) {
    query = query.in('agent_id', options.agentIds);
  }

  if (options.clientGroupIds && options.clientGroupIds.length > 0) {
    query = query.in('client_group_id', options.clientGroupIds);
  }

  if (options.activityIds && options.activityIds.length > 0) {
    query = query.in('activity_id', options.activityIds);
  }

  if (options.includeIncomplete === false) {
    query = query.eq('is_complete', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get hours by group and activity: ${error.message}`);
  }

  // Aggregate by group and activity
  const keyMap = new Map<string, HoursByGroupAndActivity>();

  for (const session of data || []) {
    const group = session.client_groups as any;
    const activity = session.activities as any;
    const key = `${session.client_group_id}:${session.activity_id || 'null'}`;

    if (!keyMap.has(key)) {
      keyMap.set(key, {
        client_group_id: session.client_group_id,
        group_name: group.group_name,
        activity_id: session.activity_id,
        activity_name: activity?.activity_id || null,
        total_hours: 0,
        total_minutes: 0,
        session_count: 0,
      });
    }

    const stats = keyMap.get(key)!;
    stats.session_count++;

    if (session.duration_minutes) {
      stats.total_minutes += session.duration_minutes;
      stats.total_hours = minutesToHours(stats.total_minutes);
    }
  }

  return Array.from(keyMap.values()).sort((a, b) => b.total_hours - a.total_hours);
}

/**
 * Get summary statistics for a time period
 */
export async function getSummaryStats(
  options: AggregationOptions
): Promise<{
  total_hours: number;
  total_minutes: number;
  total_sessions: number;
  incomplete_sessions: number;
  unique_agents: number;
  unique_groups: number;
  unique_activities: number;
}> {
  let query = supabase
    .from('activity_sessions')
    .select(`
      agent_id,
      client_group_id,
      activity_id,
      duration_minutes,
      is_complete
    `)
    .gte('start_time_utc', `${options.startDate}T00:00:00Z`)
    .lte('start_time_utc', `${options.endDate}T23:59:59Z`);

  if (options.agentIds && options.agentIds.length > 0) {
    query = query.in('agent_id', options.agentIds);
  }

  if (options.clientGroupIds && options.clientGroupIds.length > 0) {
    query = query.in('client_group_id', options.clientGroupIds);
  }

  if (options.includeIncomplete === false) {
    query = query.eq('is_complete', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get summary stats: ${error.message}`);
  }

  let total_minutes = 0;
  let total_sessions = 0;
  let incomplete_sessions = 0;
  const uniqueAgents = new Set<string>();
  const uniqueGroups = new Set<string>();
  const uniqueActivities = new Set<string | null>();

  for (const session of data || []) {
    total_sessions++;
    uniqueAgents.add(session.agent_id);
    uniqueGroups.add(session.client_group_id);
    uniqueActivities.add(session.activity_id);

    if (!session.is_complete) {
      incomplete_sessions++;
    }

    if (session.duration_minutes) {
      total_minutes += session.duration_minutes;
    }
  }

  return {
    total_hours: minutesToHours(total_minutes),
    total_minutes,
    total_sessions,
    incomplete_sessions,
    unique_agents: uniqueAgents.size,
    unique_groups: uniqueGroups.size,
    unique_activities: uniqueActivities.size,
  };
}

