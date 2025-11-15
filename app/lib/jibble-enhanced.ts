/**
 * Enhanced Jibble API Client
 * 
 * Handles authentication, retry logic, rate limiting, and pagination
 */

import type { 
  JibbleTimeEntry, 
  JibbleMember, 
  JibbleGroup, 
  JibbleActivityType,
  JibbleOrganization,
  ODataResponse,
  JibbleAPIError
} from '../types';

interface JibbleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  retryableStatusCodes?: number[];
}

interface RateLimitConfig {
  requestsPerSecond?: number;
  requestsPerMinute?: number;
}

class JibbleClientEnhanced {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;
  private timeTrackingUrl: string;
  private identityUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  
  // Rate limiting
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;
  private requestsInMinute = 0;
  private minuteStartTime = Date.now();
  
  // Default retry options
  private defaultRetryOptions: RetryOptions = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    retryableStatusCodes: [429, 500, 502, 503, 504],
  };
  
  // Default rate limit config
  private rateLimitConfig: RateLimitConfig = {
    requestsPerSecond: 10,
    requestsPerMinute: 100,
  };

  constructor() {
    this.clientId = process.env.JIBBLE_CLIENT_ID || '';
    this.clientSecret = process.env.JIBBLE_CLIENT_SECRET || '';
    this.baseUrl = process.env.JIBBLE_API_URL || 'https://workspace.prod.jibble.io';
    this.timeTrackingUrl = process.env.JIBBLE_TIME_TRACKING_URL || 'https://time-tracking.prod.jibble.io';
    this.identityUrl = process.env.JIBBLE_IDENTITY_URL || 'https://identity.prod.jibble.io';

    if (!this.clientId || !this.clientSecret) {
      throw new Error('JIBBLE_CLIENT_ID and JIBBLE_CLIENT_SECRET must be set in environment variables');
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(attempt: number, initialDelay: number, maxDelay: number): number {
    const delay = initialDelay * Math.pow(2, attempt);
    return Math.min(delay, maxDelay);
  }

  /**
   * Rate limiting: ensure we don't exceed rate limits
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    
    // Reset minute counter if a minute has passed
    if (now - this.minuteStartTime >= 60000) {
      this.requestsInMinute = 0;
      this.minuteStartTime = now;
    }
    
    // Check per-minute limit
    if (this.requestsInMinute >= (this.rateLimitConfig.requestsPerMinute || 100)) {
      const waitTime = 60000 - (now - this.minuteStartTime);
      if (waitTime > 0) {
        await this.sleep(waitTime);
        this.requestsInMinute = 0;
        this.minuteStartTime = Date.now();
      }
    }
    
    // Check per-second limit
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 1000 / (this.rateLimitConfig.requestsPerSecond || 10);
    
    if (timeSinceLastRequest < minInterval) {
      await this.sleep(minInterval - timeSinceLastRequest);
    }
    
    this.lastRequestTime = Date.now();
    this.requestsInMinute++;
  }

  /**
   * Get OAuth access token with retry logic
   */
  private async getAccessToken(retryOptions?: RetryOptions): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const options = { ...this.defaultRetryOptions, ...retryOptions };
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= (options.maxRetries || 3); attempt++) {
      try {
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
        const expiresInMs = (data.expires_in - 60) * 1000;
        this.tokenExpiry = Date.now() + expiresInMs;

        return this.accessToken;
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on authentication errors
        if (error.message?.includes('401') || error.message?.includes('403')) {
          throw error;
        }
        
        // Retry with exponential backoff
        if (attempt < (options.maxRetries || 3)) {
          const delay = this.calculateBackoffDelay(
            attempt,
            options.initialDelayMs || 1000,
            options.maxDelayMs || 10000
          );
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Failed to get access token after retries');
  }

  /**
   * Make authenticated API request with retry logic and rate limiting
   */
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}, 
    useTimeTrackingApi = false,
    retryOptions?: RetryOptions
  ): Promise<T> {
    // Apply rate limiting
    await this.rateLimit();

    const opts = { ...this.defaultRetryOptions, ...retryOptions };
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= (opts.maxRetries || 3); attempt++) {
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
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : this.calculateBackoffDelay(
            attempt,
            opts.initialDelayMs || 1000,
            opts.maxDelayMs || 10000
          );
          
          if (attempt < (opts.maxRetries || 3)) {
            await this.sleep(waitTime);
            continue;
          }
        }

        if (!response.ok) {
          const errorText = await response.text();
          const error = new Error(`Jibble API error: ${response.status} ${response.statusText} - ${errorText}`) as JibbleAPIError;
          error.statusCode = response.status;
          error.response = errorText;
          
          // Check if status code is retryable
          const isRetryable = (opts.retryableStatusCodes || []).includes(response.status);
          
          if (isRetryable && attempt < (opts.maxRetries || 3)) {
            const delay = this.calculateBackoffDelay(
              attempt,
              opts.initialDelayMs || 1000,
              opts.maxDelayMs || 10000
            );
            await this.sleep(delay);
            lastError = error;
            continue;
          }
          
          throw error;
        }

        return response.json();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on client errors (4xx) except 429
        if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 429) {
          throw error;
        }
        
        // Retry with exponential backoff
        if (attempt < (opts.maxRetries || 3)) {
          const delay = this.calculateBackoffDelay(
            attempt,
            opts.initialDelayMs || 1000,
            opts.maxDelayMs || 10000
          );
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
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
   * Fetch all pages from OData endpoint (handles pagination)
   */
  private async fetchAllPages<T>(
    endpoint: string,
    useTimeTrackingApi = false,
    retryOptions?: RetryOptions
  ): Promise<T[]> {
    const allItems: T[] = [];
    let nextLink: string | undefined = endpoint;
    let page = 0;
    const maxPages = 1000; // Safety limit

    while (nextLink && page < maxPages) {
      const response = await this.request<ODataResponse<T>>(
        nextLink.startsWith('http') ? nextLink.replace(/^https?:\/\/[^/]+/, '') : nextLink,
        {},
        useTimeTrackingApi,
        retryOptions
      );

      const items = this.extractODataValue(response);
      allItems.push(...items);

      // Check for next page
      if (response && typeof response === 'object' && '@odata.nextLink' in response) {
        nextLink = (response as ODataResponse<T>)['@odata.nextLink'];
        // Extract path from full URL if needed
        if (nextLink && nextLink.startsWith('http')) {
          const url = new URL(nextLink);
          nextLink = url.pathname + url.search;
        }
      } else {
        nextLink = undefined;
      }

      page++;
    }

    return allItems;
  }

  /**
   * Fetch all members/agents (People) with pagination
   */
  async getMembers(): Promise<JibbleMember[]> {
    return this.fetchAllPages<JibbleMember>('/v1/People');
  }

  /**
   * Fetch all groups (from /v1/Groups endpoint)
   */
  async getGroups(): Promise<JibbleGroup[]> {
    return this.fetchAllPages<JibbleGroup>('/v1/Groups');
  }

  /**
   * Fetch all organizations with pagination
   */
  async getOrganizations(): Promise<JibbleOrganization[]> {
    return this.fetchAllPages<JibbleOrganization>('/v1/Organizations');
  }

  /**
   * Fetch activity types with pagination
   */
  async getActivityTypes(): Promise<JibbleActivityType[]> {
    return this.fetchAllPages<JibbleActivityType>('/v1/Activities');
  }

  /**
   * Fetch time entries with pagination and filtering
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
    
    if (startDate) {
      filters.push(`time ge ${startDate}`);
    }
    if (endDate) {
      filters.push(`time le ${endDate}`);
    }
    if (personId) {
      filters.push(`personId eq ${personId}`);
    }
    if (personIds && personIds.length > 0) {
      const personIdFilters = personIds.map(id => `personId eq ${id}`);
      filters.push(`(${personIdFilters.join(' or ')})`);
    }
    
    if (filters.length > 0) {
      params.append('$filter', filters.join(' and '));
    }

    const queryString = params.toString();
    const endpoint = `/v1/TimeEntries${queryString ? `?${queryString}` : ''}`;
    
    return this.fetchAllPages<JibbleTimeEntry>(endpoint, true);
  }

  /**
   * Fetch time entries for a specific group
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
export const jibbleClientEnhanced = new JibbleClientEnhanced();

