/**
 * Jibble API Client
 * 
 * Handles authentication and API requests to Jibble
 */

import type { 
  JibbleTimeEntry, 
  JibbleMember, 
  JibbleGroup, 
  JibbleActivityType,
  JibbleOrganization,
  ODataResponse 
} from '../types';

interface JibbleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

class JibbleClient {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;
  private timeTrackingUrl: string;
  private identityUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.clientId = process.env.JIBBLE_CLIENT_ID || '';
    this.clientSecret = process.env.JIBBLE_CLIENT_SECRET || '';
    // Workspace API is on workspace.prod.jibble.io
    this.baseUrl = process.env.JIBBLE_API_URL || 'https://workspace.prod.jibble.io';
    // Time Tracking API is on a different domain
    this.timeTrackingUrl = process.env.JIBBLE_TIME_TRACKING_URL || 'https://time-tracking.prod.jibble.io';
    // Identity server is on a different domain
    this.identityUrl = process.env.JIBBLE_IDENTITY_URL || 'https://identity.prod.jibble.io';

    if (!this.clientId || !this.clientSecret) {
      throw new Error('JIBBLE_CLIENT_ID and JIBBLE_CLIENT_SECRET must be set in environment variables');
    }
  }

  /**
   * Get OAuth access token
   * Based on Jibble API docs: https://docs.api.jibble.io/#1a15bb81-b2a0-41d3-bfee-bf52382d6988
   * Token endpoint is on identity.prod.jibble.io/connect/token
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Exchange Client ID and Secret for access token
    const tokenUrl = `${this.identityUrl}/connect/token`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials',
        scope: 'api1',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to get Jibble access token: ${response.status} ${response.statusText}\n` +
        `URL: ${tokenUrl}\nResponse: ${errorText.substring(0, 200)}`
      );
    }

    const data: JibbleTokenResponse = await response.json();
    this.accessToken = data.access_token;
    
    // Set expiry (subtract 60 seconds for safety)
    // expires_in is in seconds
    const expiresInMs = (data.expires_in - 60) * 1000;
    this.tokenExpiry = Date.now() + expiresInMs;

    return this.accessToken;
  }

  /**
   * Make authenticated API request with retry logic
   * Based on Jibble API docs: https://docs.api.jibble.io/
   * Jibble API uses OData format, so responses are wrapped in { value: [...] }
   */
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}, 
    useTimeTrackingApi = false,
    retryCount = 0,
    maxRetries = 3
  ): Promise<T> {
    try {
      const token = await this.getAccessToken();
      const apiBaseUrl = useTimeTrackingApi ? this.timeTrackingUrl : this.baseUrl;

      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      // Handle rate limiting (429)
      if (response.status === 429 && retryCount < maxRetries) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.request<T>(endpoint, options, useTimeTrackingApi, retryCount + 1, maxRetries);
      }

      // Retry on server errors (5xx)
      if (response.status >= 500 && response.status < 600 && retryCount < maxRetries) {
        const waitTime = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.request<T>(endpoint, options, useTimeTrackingApi, retryCount + 1, maxRetries);
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Jibble API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error: any) {
      // Retry on network errors
      if (retryCount < maxRetries && (error.message?.includes('fetch') || error.message?.includes('network'))) {
        const waitTime = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.request<T>(endpoint, options, useTimeTrackingApi, retryCount + 1, maxRetries);
      }
      throw error;
    }
  }

  /**
   * Extract value array from OData response
   */
  private extractODataValue<T>(response: ODataResponse<T> | T[]): T[] {
    if (Array.isArray(response)) {
      return response;
    }
    if (response && typeof response === 'object' && 'value' in response) {
      return (response as ODataResponse<T>).value;
    }
    return [];
  }

  /**
   * Fetch activity types (templates, not time entries)
   * Based on Jibble API docs: https://docs.api.jibble.io/#e8724177-6ded-47b6-a7b3-1ec1b30b93e6
   * Endpoint: https://workspace.prod.jibble.io/v1/Activities
   * 
   * Note: This returns activity types/templates, not actual time entries
   * Use getTimeEntries() for actual clock in/out records
   * 
   * @param startDate Start date for filtering (ISO string)
   * @param endDate End date for filtering (ISO string)
   * @param memberId Optional member ID to filter by
   */
  async getActivityTypes(
    startDate?: string,
    endDate?: string,
    memberId?: string
  ): Promise<JibbleActivityType[]> {
    // Build OData query parameters
    const params = new URLSearchParams();
    if (startDate) params.append('$filter', `startTime ge ${startDate}`);
    if (endDate) {
      const filter = params.get('$filter') || '';
      params.set('$filter', filter ? `${filter} and endTime le ${endDate}` : `endTime le ${endDate}`);
    }
    if (memberId) {
      const filter = params.get('$filter') || '';
      params.set('$filter', filter ? `${filter} and personId eq '${memberId}'` : `personId eq '${memberId}'`);
    }

    const queryString = params.toString();
    const endpoint = `/v1/Activities${queryString ? `?${queryString}` : ''}`;
    
    const response: ODataResponse<JibbleActivityType> = await this.request<ODataResponse<JibbleActivityType>>(endpoint);
    return this.extractODataValue(response);
  }

  /**
   * Fetch activities/time entries (legacy method name)
   * @deprecated Use getActivityTypes() for activity types or getTimeEntries() for time entries
   */
  async getActivities(
    startDate?: string,
    endDate?: string,
    memberId?: string
  ): Promise<JibbleActivityType[]> {
    return this.getActivityTypes(startDate, endDate, memberId);
  }

  /**
   * Fetch all members/agents (People) with pagination support
   * Based on Jibble API docs: https://docs.api.jibble.io/#db777356-4da5-48ad-8f3a-c30ef1ee82a1
   * Endpoint: https://workspace.prod.jibble.io/v1/People
   */
  async getMembers(): Promise<JibbleMember[]> {
    const allMembers: JibbleMember[] = [];
    let nextLink: string | undefined = '/v1/People';
    let page = 0;
    const maxPages = 1000; // Safety limit

    while (nextLink && page < maxPages) {
      const response: ODataResponse<JibbleMember> = await this.request<ODataResponse<JibbleMember>>(nextLink);
      const members = this.extractODataValue(response);
      allMembers.push(...members);

      // Check for next page
      if (response && '@odata.nextLink' in response && response['@odata.nextLink']) {
        const fullUrl = response['@odata.nextLink'];
        const url = new URL(fullUrl);
        nextLink = url.pathname + url.search;
      } else {
        nextLink = undefined;
      }

      page++;
    }

    return allMembers;
  }

  /**
   * Fetch all groups (from /v1/Groups endpoint)
   * Note: Organizations and Groups are different in Jibble
   */
  async getGroups(): Promise<JibbleGroup[]> {
    const allGroups: JibbleGroup[] = [];
    let nextLink: string | undefined = '/v1/Groups';
    let page = 0;
    const maxPages = 1000;

    while (nextLink && page < maxPages) {
      const response: ODataResponse<JibbleGroup> = await this.request<ODataResponse<JibbleGroup>>(nextLink);
      const groups = this.extractODataValue(response);
      allGroups.push(...groups);

      if (response && '@odata.nextLink' in response && response['@odata.nextLink']) {
        const fullUrl = response['@odata.nextLink'];
        const url = new URL(fullUrl);
        nextLink = url.pathname + url.search;
      } else {
        nextLink = undefined;
      }

      page++;
    }

    return allGroups;
  }

  /**
   * Fetch activity types for a specific date range (for backfills)
   */
  async getActivityTypesByDateRange(startDate: string, endDate: string): Promise<JibbleActivityType[]> {
    return this.getActivityTypes(startDate, endDate);
  }

  /**
   * Fetch organizations
   * Based on Jibble API docs: https://docs.api.jibble.io/#ab6daceb-b629-48e6-9225-8151106863d7
   * Endpoint: https://workspace.prod.jibble.io/v1/Organizations
   */
  async getOrganizations(): Promise<JibbleOrganization[]> {
    const response: ODataResponse<JibbleOrganization> = await this.request<ODataResponse<JibbleOrganization>>('/v1/Organizations');
    return this.extractODataValue(response);
  }

  /**
   * Fetch time entries (actual clock in/out records) with pagination
   * Based on Jibble API docs: https://docs.api.jibble.io/#6fdcad3f-c904-4dcf-b10f-c453a6ee4dbd
   * Endpoint: https://time-tracking.prod.jibble.io/v1/TimeEntries
   * 
   * Note: Time entries have a `time` field (not startTime/endTime) and `type` field ("In" or "Out")
   * 
   * @param startDate Start date for filtering (ISO string)
   * @param endDate End date for filtering (ISO string)
   * @param personId Optional person ID to filter by
   * @param personIds Optional array of person IDs to filter by (for group filtering)
   */
  async getTimeEntries(
    startDate?: string,
    endDate?: string,
    personId?: string,
    personIds?: string[]
  ): Promise<JibbleTimeEntry[]> {
    // Build OData query parameters
    const params = new URLSearchParams();
    const filters: string[] = [];
    
    // Use 'time' field for date filtering (not startTime/endTime)
    // Format dates properly for OData (ISO 8601 with time component)
    if (startDate) {
      const startDateTime = startDate.includes('T') ? startDate : `${startDate}T00:00:00Z`;
      filters.push(`time ge ${startDateTime}`);
    }
    if (endDate) {
      const endDateTime = endDate.includes('T') ? endDate : `${endDate}T23:59:59Z`;
      filters.push(`time le ${endDateTime}`);
    }
    if (personId) {
      // personId is a GUID, format without quotes
      filters.push(`personId eq ${personId}`);
    }
    if (personIds && personIds.length > 0) {
      // Filter by multiple person IDs (for group filtering)
      // personId is a GUID, format without quotes
      const personIdFilters = personIds.map(id => `personId eq ${id}`);
      filters.push(`(${personIdFilters.join(' or ')})`);
    }
    
    if (filters.length > 0) {
      params.append('$filter', filters.join(' and '));
    }

    const queryString = params.toString();
    const endpoint = `/v1/TimeEntries${queryString ? `?${queryString}` : ''}`;
    
    // Fetch all pages
    const allEntries: JibbleTimeEntry[] = [];
    let nextLink: string | undefined = endpoint;
    let page = 0;
    const maxPages = 1000; // Safety limit

    while (nextLink && page < maxPages) {
      const response: ODataResponse<JibbleTimeEntry> = await this.request<ODataResponse<JibbleTimeEntry>>(
        nextLink.startsWith('http') ? nextLink.replace(/^https?:\/\/[^/]+/, '') : nextLink,
        {},
        true
      );
      const entries = this.extractODataValue(response);
      allEntries.push(...entries);

      // Check for next page
      if (response && '@odata.nextLink' in response && response['@odata.nextLink']) {
        const fullUrl = response['@odata.nextLink'];
        const url = new URL(fullUrl);
        nextLink = url.pathname + url.search;
      } else {
        nextLink = undefined;
      }

      page++;
    }

    return allEntries;
  }

  /**
   * Fetch time entries for a specific group
   * Helper method that gets members in group first, then fetches their time entries
   */
  async getTimeEntriesForGroup(
    groupId: string,
    startDate?: string,
    endDate?: string
  ): Promise<JibbleTimeEntry[]> {
    // First, get all members in the group
    const members = await this.getMembers();
    const groupMembers = members.filter(m => m.groupId === groupId);
    const personIds = groupMembers.map(m => m.id);

    if (personIds.length === 0) {
      return [];
    }

    return this.getTimeEntries(startDate, endDate, undefined, personIds);
  }
}

// Export singleton instance
export const jibbleClient = new JibbleClient();

// Re-export types for convenience
export type { 
  JibbleTimeEntry, 
  JibbleMember, 
  JibbleGroup, 
  JibbleActivityType,
  JibbleOrganization 
} from '../types';

