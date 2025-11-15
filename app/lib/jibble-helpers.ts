/**
 * Jibble API Helper Functions
 * 
 * High-level functions for common data fetching patterns
 */

import { jibbleClient } from './jibble';
import type { JibbleTimeEntry, JibbleMember, JibbleGroup } from '../types';
import { getDateRangeUTC } from './utils/timezone';

/**
 * Fetch all time entries for a date range
 */
export async function fetchTimeEntriesForDateRange(
  startDate: string,
  endDate: string
): Promise<JibbleTimeEntry[]> {
  const { startUTC, endUTC } = getDateRangeUTC(startDate, endDate);
  return jibbleClient.getTimeEntries(startUTC, endUTC);
}

/**
 * Fetch time entries for a specific group and date range
 */
export async function fetchTimeEntriesForGroup(
  groupId: string,
  startDate: string,
  endDate: string
): Promise<JibbleTimeEntry[]> {
  const { startUTC, endUTC } = getDateRangeUTC(startDate, endDate);
  return jibbleClient.getTimeEntriesForGroup(groupId, startUTC, endUTC);
}

/**
 * Fetch time entries for multiple groups
 */
export async function fetchTimeEntriesForGroups(
  groupIds: string[],
  startDate: string,
  endDate: string
): Promise<JibbleTimeEntry[]> {
  const { startUTC, endUTC } = getDateRangeUTC(startDate, endDate);
  
  // Get all members from all groups
  const members = await jibbleClient.getMembers();
  const groupMembers = members.filter(m => m.groupId && groupIds.includes(m.groupId));
  const personIds = groupMembers.map(m => m.id);

  if (personIds.length === 0) {
    return [];
  }

  return jibbleClient.getTimeEntries(startUTC, endUTC, undefined, personIds);
}

/**
 * Fetch time entries for a specific agent
 */
export async function fetchTimeEntriesForAgent(
  personId: string,
  startDate: string,
  endDate: string
): Promise<JibbleTimeEntry[]> {
  const { startUTC, endUTC } = getDateRangeUTC(startDate, endDate);
  return jibbleClient.getTimeEntries(startUTC, endUTC, personId);
}

/**
 * Fetch incremental time entries (only new entries since last fetch)
 * Uses the `createdAt` field to determine new entries
 */
export async function fetchIncrementalTimeEntries(
  since: string, // ISO timestamp
  groupIds?: string[]
): Promise<JibbleTimeEntry[]> {
  // Note: Jibble API may not support filtering by createdAt
  // This is a placeholder for when we implement incremental fetching
  // For now, we'll fetch all entries and filter client-side
  const allEntries = groupIds 
    ? await fetchTimeEntriesForGroups(groupIds, since, new Date().toISOString())
    : await jibbleClient.getTimeEntries(since);

  // Filter by createdAt if available
  return allEntries.filter(entry => {
    const entryCreatedAt = entry.createdAt || entry.time;
    return new Date(entryCreatedAt) >= new Date(since);
  });
}

/**
 * Get all groups with their member counts
 */
export async function getGroupsWithMemberCounts(): Promise<Array<JibbleGroup & { memberCount: number }>> {
  const [groups, members] = await Promise.all([
    jibbleClient.getGroups(),
    jibbleClient.getMembers(),
  ]);

  return groups.map(group => ({
    ...group,
    memberCount: members.filter(m => m.groupId === group.id).length,
  }));
}

/**
 * Get all members with their group information
 */
export async function getMembersWithGroups(): Promise<Array<JibbleMember & { group?: JibbleGroup }>> {
  const [members, groups] = await Promise.all([
    jibbleClient.getMembers(),
    jibbleClient.getGroups(),
  ]);

  const groupMap = new Map(groups.map(g => [g.id, g]));

  return members.map(member => ({
    ...member,
    group: member.groupId ? groupMap.get(member.groupId) : undefined,
  }));
}

