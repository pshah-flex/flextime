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

export async function getSummaryStats(startDate: string, endDate: string): Promise<any> {
  return fetchAPI<any>(`/api/aggregations?type=summary&startDate=${startDate}&endDate=${endDate}`);
}

export async function getHoursByAgent(startDate: string, endDate: string, clientGroupIds?: string[]): Promise<any[]> {
  const params = new URLSearchParams({
    type: 'hoursByAgent',
    startDate,
    endDate,
  });
  if (clientGroupIds && clientGroupIds.length > 0) {
    params.append('clientGroupIds', clientGroupIds.join(','));
  }
  const result = await fetchAPI<any>(`/api/aggregations?${params.toString()}`);
  return Array.isArray(result) ? result : [];
}

export async function getHoursByActivity(startDate: string, endDate: string, clientGroupIds?: string[]): Promise<any[]> {
  const params = new URLSearchParams({
    type: 'hoursByActivity',
    startDate,
    endDate,
  });
  if (clientGroupIds && clientGroupIds.length > 0) {
    params.append('clientGroupIds', clientGroupIds.join(','));
  }
  const result = await fetchAPI<any>(`/api/aggregations?${params.toString()}`);
  return Array.isArray(result) ? result : [];
}

export async function getHoursByClientGroup(startDate: string, endDate: string): Promise<any[]> {
  const result = await fetchAPI<any>(`/api/aggregations?type=hoursByClientGroup&startDate=${startDate}&endDate=${endDate}`);
  return Array.isArray(result) ? result : [];
}

export async function getClockInOut(startDate: string, endDate: string, agentId?: string): Promise<any[]> {
  const params = new URLSearchParams({
    startDate,
    endDate,
  });
  if (agentId) {
    params.append('agentId', agentId);
  }
  const result = await fetchAPI<any>(`/api/clock-in-out?${params.toString()}`);
  return result?.records || [];
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

