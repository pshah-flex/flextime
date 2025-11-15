/**
 * Jibble API Client Example
 * 
 * This is a template file. Once you have your Jibble API credentials:
 * 1. Copy this file to lib/jibble.ts
 * 2. Fill in your actual Client ID and Client Secret
 * 3. The credentials will come from environment variables
 */

interface JibbleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

interface JibbleActivity {
  id: string;
  memberId: string;
  groupId?: string;
  activityName?: string;
  startTime: string;
  endTime?: string;
  type: string;
  // Add other fields based on Jibble API response
  [key: string]: any;
}

interface JibbleMember {
  id: string;
  name: string;
  email?: string;
  timezone?: string;
  // Add other fields based on Jibble API response
  [key: string]: any;
}

interface JibbleGroup {
  id: string;
  name: string;
  code?: string;
  // Add other fields based on Jibble API response
  [key: string]: any;
}

class JibbleClient {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.clientId = process.env.JIBBLE_CLIENT_ID || '';
    this.clientSecret = process.env.JIBBLE_CLIENT_SECRET || '';
    this.baseUrl = process.env.JIBBLE_API_URL || 'https://api.jibble.io';

    if (!this.clientId || !this.clientSecret) {
      throw new Error('JIBBLE_CLIENT_ID and JIBBLE_CLIENT_SECRET must be set');
    }
  }

  /**
   * Get OAuth access token
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Request new token
    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials',
        // Add other OAuth parameters as required by Jibble
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get Jibble access token: ${response.statusText}`);
    }

    const data: JibbleTokenResponse = await response.json();
    this.accessToken = data.access_token;
    // Set expiry (subtract 60 seconds for safety)
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

    return this.accessToken;
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Jibble API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetch activities/time entries
   * 
   * @param startDate Start date for filtering (ISO string)
   * @param endDate End date for filtering (ISO string)
   * @param memberId Optional member ID to filter by
   */
  async getActivities(
    startDate?: string,
    endDate?: string,
    memberId?: string
  ): Promise<JibbleActivity[]> {
    // Build query parameters
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (memberId) params.append('memberId', memberId);

    const queryString = params.toString();
    const endpoint = `/activities${queryString ? `?${queryString}` : ''}`;

    // Note: Adjust endpoint path based on actual Jibble API documentation
    return this.request<JibbleActivity[]>(endpoint);
  }

  /**
   * Fetch all members/agents
   */
  async getMembers(): Promise<JibbleMember[]> {
    // Note: Adjust endpoint path based on actual Jibble API documentation
    return this.request<JibbleMember[]>('/members');
  }

  /**
   * Fetch all groups
   */
  async getGroups(): Promise<JibbleGroup[]> {
    // Note: Adjust endpoint path based on actual Jibble API documentation
    return this.request<JibbleGroup[]>('/groups');
  }

  /**
   * Fetch activities for a specific date range (for backfills)
   */
  async getActivitiesByDateRange(startDate: string, endDate: string): Promise<JibbleActivity[]> {
    return this.getActivities(startDate, endDate);
  }
}

// Export singleton instance
export const jibbleClient = new JibbleClient();

/**
 * Example usage:
 * 
 * const activities = await jibbleClient.getActivities('2024-01-01', '2024-01-31');
 * const members = await jibbleClient.getMembers();
 * const groups = await jibbleClient.getGroups();
 */

