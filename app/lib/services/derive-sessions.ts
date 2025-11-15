/**
 * Derive Sessions Service
 * 
 * Creates activity sessions from time entries by pairing In/Out entries
 */

import { activitiesRepository } from '../repositories';
import type { Activity, ActivitySession, DatabaseInsert } from '../../types';
import { calculateMinutes } from '../utils/timezone';

/**
 * Derive sessions from activities for a specific agent and date
 */
export async function deriveSessionsForAgentAndDate(
  agentId: string,
  date: string // YYYY-MM-DD
): Promise<ActivitySession[]> {
  // Get all activities for this agent on this date
  const activities = await activitiesRepository.findByAgentId(
    agentId,
    `${date}T00:00:00Z`,
    `${date}T23:59:59Z`
  );

  // Sort by time
  activities.sort((a, b) => 
    new Date(a.time_utc).getTime() - new Date(b.time_utc).getTime()
  );

  const sessions: ActivitySession[] = [];
  let currentInEntry: Activity | null = null;

  for (const activity of activities) {
    if (activity.entry_type === 'In') {
      // If we have an unclosed session, mark it as incomplete
      if (currentInEntry) {
        const session: DatabaseInsert<ActivitySession> = {
          activity_id: currentInEntry.id,
          agent_id: currentInEntry.agent_id,
          client_group_id: currentInEntry.client_group_id,
          start_time_utc: currentInEntry.time_utc,
          end_time_utc: null, // Incomplete
          duration_minutes: null,
          is_complete: false,
        };
        sessions.push(session as ActivitySession);
      }
      currentInEntry = activity;
    } else if (activity.entry_type === 'Out' && currentInEntry) {
      // Pair In with Out
      const duration = calculateMinutes(currentInEntry.time_utc, activity.time_utc);
      const session: DatabaseInsert<ActivitySession> = {
        activity_id: currentInEntry.id,
        agent_id: currentInEntry.agent_id,
        client_group_id: currentInEntry.client_group_id,
        start_time_utc: currentInEntry.time_utc,
        end_time_utc: activity.time_utc,
        duration_minutes: duration,
        is_complete: true,
      };
      sessions.push(session as ActivitySession);
      currentInEntry = null;
    }
  }

  // Handle incomplete session at end of day
  if (currentInEntry) {
    const session: DatabaseInsert<ActivitySession> = {
      activity_id: currentInEntry.id,
      agent_id: currentInEntry.agent_id,
      client_group_id: currentInEntry.client_group_id,
      start_time_utc: currentInEntry.time_utc,
      end_time_utc: null,
      duration_minutes: null,
      is_complete: false,
    };
    sessions.push(session as ActivitySession);
  }

  return sessions;
}

/**
 * Derive sessions for a date range
 */
export async function deriveSessionsForDateRange(
  startDate: string,
  endDate: string,
  options: {
    agentId?: string;
    clientGroupId?: string;
  } = {}
): Promise<ActivitySession[]> {
  // Get all activities in the date range
  const activities = await activitiesRepository.findMany({
    startDate: `${startDate}T00:00:00Z`,
    endDate: `${endDate}T23:59:59Z`,
    agentId: options.agentId,
    clientGroupId: options.clientGroupId,
  });

  // Group by agent and date
  const byAgentAndDate = new Map<string, Activity[]>();
  
  for (const activity of activities) {
    const key = `${activity.agent_id}:${activity.belongs_to_date}`;
    if (!byAgentAndDate.has(key)) {
      byAgentAndDate.set(key, []);
    }
    byAgentAndDate.get(key)!.push(activity);
  }

  // Derive sessions for each agent/date combination
  const allSessions: ActivitySession[] = [];
  
  for (const [key, agentActivities] of byAgentAndDate) {
    const [agentId, date] = key.split(':');
    
    // Sort by time
    agentActivities.sort((a, b) => 
      new Date(a.time_utc).getTime() - new Date(b.time_utc).getTime()
    );

    let currentInEntry: Activity | null = null;

    for (const activity of agentActivities) {
      if (activity.entry_type === 'In') {
        if (currentInEntry) {
          // Previous session incomplete
          allSessions.push({
            id: '', // Will be set by database
            activity_id: currentInEntry.id,
            agent_id: currentInEntry.agent_id,
            client_group_id: currentInEntry.client_group_id,
            start_time_utc: currentInEntry.time_utc,
            end_time_utc: null,
            duration_minutes: null,
            is_complete: false,
            created_at: new Date().toISOString(),
          });
        }
        currentInEntry = activity;
      } else if (activity.entry_type === 'Out' && currentInEntry) {
        const duration = calculateMinutes(currentInEntry.time_utc, activity.time_utc);
        allSessions.push({
          id: '',
          activity_id: currentInEntry.id,
          agent_id: currentInEntry.agent_id,
          client_group_id: currentInEntry.client_group_id,
          start_time_utc: currentInEntry.time_utc,
          end_time_utc: activity.time_utc,
          duration_minutes: duration,
          is_complete: true,
          created_at: new Date().toISOString(),
        });
        currentInEntry = null;
      }
    }

    // Handle incomplete session at end
    if (currentInEntry) {
      allSessions.push({
        id: '',
        activity_id: currentInEntry.id,
        agent_id: currentInEntry.agent_id,
        client_group_id: currentInEntry.client_group_id,
        start_time_utc: currentInEntry.time_utc,
        end_time_utc: null,
        duration_minutes: null,
        is_complete: false,
        created_at: new Date().toISOString(),
      });
    }
  }

  return allSessions;
}

