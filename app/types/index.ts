/**
 * TypeScript type definitions for FlexTime application
 */

// ============================================================================
// Database Entity Types (matching Supabase schema)
// ============================================================================

export interface Agent {
  id: string;
  jibble_member_id: string;
  name: string;
  email?: string | null;
  timezone?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientGroup {
  id: string;
  jibble_group_id: string;
  group_name: string;
  group_code?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  airtable_record_id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface ClientGroupMapping {
  id: string;
  client_id: string;
  client_group_id: string;
  created_at: string;
}

export interface Activity {
  id: string;
  jibble_time_entry_id: string;
  agent_id: string;
  client_group_id: string;
  activity_id?: string | null;
  entry_type: 'In' | 'Out';
  time_utc: string;
  local_time?: string | null;
  belongs_to_date: string; // ISO date string (YYYY-MM-DD)
  raw_payload: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ActivitySession {
  id: string;
  activity_id?: string | null;
  agent_id: string;
  client_group_id: string;
  start_time_utc: string;
  end_time_utc?: string | null;
  duration_minutes?: number | null;
  is_complete: boolean;
  created_at: string;
}

// ============================================================================
// Jibble API Response Types
// ============================================================================

/**
 * Jibble Time Entry (from /v1/TimeEntries endpoint)
 * This is the actual clock in/out record
 */
export interface JibbleTimeEntry {
  id: string;
  localTime: string;
  personId: string;
  organizationId: string;
  projectId?: string | null;
  activityId?: string | null;
  locationId?: string | null;
  kioskId?: string | null;
  breakId?: string | null;
  clientType: string;
  type: 'In' | 'Out';
  address?: string | null;
  time: string; // ISO timestamp
  offset: string; // Timezone offset (e.g., "PT8H")
  belongsToDate: string; // ISO date (YYYY-MM-DD)
  autoClockOutTime?: string | null;
  clockInOutReminderTime?: string | null;
  isOffline: boolean;
  isFaceRecognized?: boolean | null;
  faceSimilarity?: number | null;
  isAutomatic: boolean;
  isManual: boolean;
  isOutsideGeofence: boolean;
  isManualLocation: boolean;
  isUnusual: boolean;
  isEndOfDay: boolean;
  note?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  isFromSpeedKiosk: boolean;
  isLocked: boolean;
  previousTimeEntryId?: string | null;
  nextTimeEntryId?: string | null;
  coordinates?: { lat: number; lng: number } | null;
  picture?: string | null;
  platform?: {
    clientVersion?: string;
    os?: string;
    deviceModel?: string | null;
    deviceId?: string | null;
    deviceName?: string;
    eventId?: string | null;
  };
  [key: string]: any; // Allow additional fields
}

/**
 * Jibble Member/Person (from /v1/People endpoint)
 */
export interface JibbleMember {
  id: string;
  organizationId: string;
  groupId?: string;
  positionId?: string | null;
  employmentTypeId?: string | null;
  userId?: string | null;
  joinDate?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  countryCode?: string | null;
  fullName?: string | null;
  preferredName?: string | null;
  role?: string | null;
  status?: string | null;
  code?: string | null;
  pinCode?: string | null;
  invitedAt?: string | null;
  removedAt?: string | null;
  workStartDate?: string | null;
  latestTimeEntryTime?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any; // Allow additional fields
}

/**
 * Jibble Group (from /v1/Groups endpoint)
 */
export interface JibbleGroup {
  id: string;
  organizationId: string;
  name: string;
  status?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any; // Allow additional fields
}

/**
 * Jibble Activity Type (from /v1/Activities endpoint)
 * Note: This is an activity type/template, not a time entry
 */
export interface JibbleActivityType {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  color?: string | null;
  organizationId: string;
  status?: string | null;
  assignedGroups?: string[] | any[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any; // Allow additional fields
}

/**
 * Jibble Organization (from /v1/Organizations endpoint)
 */
export interface JibbleOrganization {
  id: string;
  name: string;
  code?: string | null;
  status?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any; // Allow additional fields
}

// ============================================================================
// OData Response Wrapper
// ============================================================================

export interface ODataResponse<T> {
  '@odata.context'?: string;
  value: T[];
  '@odata.count'?: number;
  '@odata.nextLink'?: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface DateRangeParams {
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}

export interface ActivityQueryParams extends DateRangeParams, PaginationParams {
  agentId?: string;
  clientGroupId?: string;
  personId?: string;
  groupId?: string;
}

export interface AgentQueryParams extends PaginationParams {
  groupId?: string;
  search?: string;
}

export interface ClientGroupQueryParams extends PaginationParams {
  search?: string;
}

// ============================================================================
// Aggregation & Reporting Types
// ============================================================================

export interface HoursAggregation {
  agent_id: string;
  agent_name: string;
  total_hours: number;
  total_minutes: number;
  entry_count: number;
}

export interface ActivityHoursAggregation {
  activity_id: string;
  activity_name?: string;
  total_hours: number;
  total_minutes: number;
  entry_count: number;
}

export interface GroupHoursAggregation {
  client_group_id: string;
  group_name: string;
  total_hours: number;
  total_minutes: number;
  entry_count: number;
}

export interface WeeklyReport {
  client_email: string;
  client_groups: string[];
  period_start: string;
  period_end: string;
  total_hours: number;
  agents: Array<{
    agent_id: string;
    agent_name: string;
    hours: number;
    activities: Array<{
      activity_id: string;
      activity_name?: string;
      hours: number;
    }>;
  }>;
  incomplete_sessions: Array<{
    agent_id: string;
    agent_name: string;
    start_time: string;
    group_name: string;
  }>;
}

// ============================================================================
// Utility Types
// ============================================================================

export type DatabaseInsert<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;
export type DatabaseUpdate<T> = Partial<Omit<T, 'id' | 'created_at'>>;

// ============================================================================
// Error Types
// ============================================================================

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class JibbleAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'JibbleAPIError';
  }
}
