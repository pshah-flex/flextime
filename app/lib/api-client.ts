/**
 * API Client for Frontend
 * 
 * Client-side functions to fetch data from API routes
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.result || data.reports || data.records || data;
}

export async function getSummaryStats(startDate: string, endDate: string) {
  return fetchAPI(`/api/aggregations?type=summary&startDate=${startDate}&endDate=${endDate}`);
}

export async function getHoursByAgent(startDate: string, endDate: string, clientGroupIds?: string[]) {
  const params = new URLSearchParams({
    type: 'hoursByAgent',
    startDate,
    endDate,
  });
  if (clientGroupIds && clientGroupIds.length > 0) {
    params.append('clientGroupIds', clientGroupIds.join(','));
  }
  return fetchAPI(`/api/aggregations?${params.toString()}`);
}

export async function getHoursByActivity(startDate: string, endDate: string, clientGroupIds?: string[]) {
  const params = new URLSearchParams({
    type: 'hoursByActivity',
    startDate,
    endDate,
  });
  if (clientGroupIds && clientGroupIds.length > 0) {
    params.append('clientGroupIds', clientGroupIds.join(','));
  }
  return fetchAPI(`/api/aggregations?${params.toString()}`);
}

export async function getHoursByClientGroup(startDate: string, endDate: string) {
  return fetchAPI(`/api/aggregations?type=hoursByClientGroup&startDate=${startDate}&endDate=${endDate}`);
}

export async function getClockInOut(startDate: string, endDate: string, agentId?: string) {
  const params = new URLSearchParams({
    startDate,
    endDate,
  });
  if (agentId) {
    params.append('agentId', agentId);
  }
  return fetchAPI(`/api/clock-in-out?${params.toString()}`);
}

export async function getWeeklyReport(startDate: string, endDate: string, clientEmail?: string) {
  const params = new URLSearchParams({
    startDate,
    endDate,
  });
  if (clientEmail) {
    params.append('clientEmail', clientEmail);
  }
  return fetchAPI(`/api/reports/weekly?${params.toString()}`);
}

