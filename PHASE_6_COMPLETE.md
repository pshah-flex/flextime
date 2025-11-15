# Phase 6: Aggregation & Reporting Logic - Complete ✅

## Overview

Phase 6 implements comprehensive aggregation and reporting functionality, including hours calculations, weekly report generation, clock-in/clock-out detection, and query optimization.

## Components Created

### 1. Aggregation Service

#### `app/lib/services/aggregations.ts`
Provides functions to calculate hours and statistics:

**Functions:**
- `getHoursByAgent()` - Hours per agent over time period
- `getHoursByActivity()` - Hours per activity over time period
- `getHoursByClientGroup()` - Hours per client group over time period
- `getHoursByAgentAndActivity()` - Combined agent + activity aggregation
- `getHoursByGroupAndActivity()` - Combined group + activity aggregation
- `getSummaryStats()` - Overall summary statistics

**Features:**
- Filters by date range, agent IDs, group IDs, activity IDs
- Option to include/exclude incomplete sessions
- Returns hours (rounded to 2 decimals) and minutes
- Includes session counts and incomplete session counts

### 2. Weekly Report Service

#### `app/lib/services/weekly-report.ts`
Generates weekly summaries for clients, aggregating across all associated groups.

**Functions:**
- `generateWeeklyReportForClient()` - Generate report for a specific client
- `generateWeeklyReportsForAllClients()` - Generate reports for all clients
- `generatePreviousWeekReport()` - Generate report for previous week
- `formatWeeklyReportForEmail()` - Format report as text for email

**Key Features:**
- **Multi-group aggregation**: Aggregates data across ALL groups associated with a client via `client_group_mappings`
- **Summary statistics**: Total hours, sessions, agents, groups, activities
- **Hours breakdown**: By agent, by activity, by group
- **Incomplete sessions**: Identifies and lists incomplete sessions with details
- **Email formatting**: Formats report as plain text for email digest

**Report Structure:**
```typescript
{
  client_email: string;
  period_start: string;
  period_end: string;
  summary: {
    total_hours: number;
    total_sessions: number;
    incomplete_sessions: number;
    unique_agents: number;
    unique_groups: number;
    unique_activities: number;
  };
  hours_by_agent: HoursByAgent[];
  hours_by_activity: HoursByActivity[];
  hours_by_group: HoursByClientGroup[];
  incomplete_sessions_detail: IncompleteSessionDetail[];
}
```

### 3. Clock-in/Clock-out Detection

#### `app/lib/services/clock-in-out.ts`
Identifies first and last activity per day per agent.

**Functions:**
- `getClockInOutRecords()` - Get clock-in/out records for date range
- `getClockInOutForAgent()` - Get records for specific agent
- `getClockInOutForDate()` - Get records for specific date
- `getFirstActivityOfDay()` - Get first activity (clock-in) for a day
- `getLastActivityOfDay()` - Get last activity (clock-out) for a day

**Features:**
- Identifies earliest "In" entry as clock-in
- Identifies latest "Out" entry as clock-out
- Calculates total hours for complete days
- Supports timezone conversion for local time display
- Handles incomplete days (missing clock-in or clock-out)

**Record Structure:**
```typescript
{
  agent_id: string;
  agent_name: string;
  date: string;
  clock_in_time_utc: string | null;
  clock_in_time_local?: string | null;
  clock_out_time_utc: string | null;
  clock_out_time_local?: string | null;
  total_hours?: number | null;
  is_complete: boolean;
}
```

### 4. Query Optimization

#### `app/lib/services/query-optimization.ts`
Provides optimized queries and database views.

**Functions:**
- `createActivitySessionsView()` - Create enriched view with joined data
- `createDailyAggregationsView()` - Create materialized view for daily aggregations
- `refreshMaterializedViews()` - Refresh materialized views
- `getPaginatedResults()` - Cursor-based pagination helper

**Note**: Database views should be created via Supabase MCP or direct SQL. The functions provide the SQL structure.

### 5. API Endpoints

#### `app/api/aggregations/route.ts`
GET endpoint for various aggregations.

**Usage:**
```
GET /api/aggregations?type=hoursByAgent&startDate=2024-01-01&endDate=2024-01-31
GET /api/aggregations?type=summary&startDate=2024-01-01&endDate=2024-01-31&clientGroupIds=group-id-1,group-id-2
```

**Types:**
- `summary` - Overall summary statistics
- `hoursByAgent` - Hours per agent
- `hoursByActivity` - Hours per activity
- `hoursByClientGroup` - Hours per client group
- `hoursByAgentAndActivity` - Combined agent + activity
- `hoursByGroupAndActivity` - Combined group + activity

#### `app/api/reports/weekly/route.ts`
GET endpoint for weekly report generation.

**Usage:**
```
GET /api/reports/weekly?startDate=2024-01-01&endDate=2024-01-07&clientEmail=client@example.com
GET /api/reports/weekly?previousWeek=true
GET /api/reports/weekly?startDate=2024-01-01&endDate=2024-01-07
```

**Features:**
- Generate report for specific client
- Generate reports for all clients
- Generate previous week report automatically

#### `app/api/clock-in-out/route.ts`
GET endpoint for clock-in/clock-out records.

**Usage:**
```
GET /api/clock-in-out?startDate=2024-01-01&endDate=2024-01-31&agentId=agent-id
GET /api/clock-in-out?date=2024-01-15&timezone=America/Los_Angeles
```

### 6. Services Index

#### `app/lib/services/index.ts`
Central export for all service modules.

## Key Features

### ✅ Multi-Group Aggregation
- Weekly reports aggregate data across ALL groups associated with a client
- Uses `client_group_mappings` to find all groups for a client
- Falls back to Airtable if client not in database

### ✅ Incomplete Session Detection
- Identifies sessions without matching "Out" entry
- Includes in summary statistics
- Provides detailed list in weekly reports
- Can be filtered out of aggregations if needed

### ✅ Timezone Support
- Clock-in/out detection supports timezone conversion
- Uses agent timezone when available
- Falls back to UTC if timezone not specified

### ✅ Performance Optimization
- Efficient queries using indexes
- Batch processing for large datasets
- Cursor-based pagination for large result sets
- Database views for common aggregations (SQL provided)

### ✅ Flexible Filtering
- Filter by date range, agent, group, activity
- Include/exclude incomplete sessions
- Support for single date or date range queries

## Testing

### Manual Testing

**Aggregations:**
```bash
# Get summary stats
curl "http://localhost:3000/api/aggregations?type=summary&startDate=2024-01-01&endDate=2024-01-31"

# Get hours by agent
curl "http://localhost:3000/api/aggregations?type=hoursByAgent&startDate=2024-01-01&endDate=2024-01-31"
```

**Weekly Reports:**
```bash
# Generate report for specific client
curl "http://localhost:3000/api/reports/weekly?startDate=2024-01-01&endDate=2024-01-07&clientEmail=client@example.com"

# Generate previous week report
curl "http://localhost:3000/api/reports/weekly?previousWeek=true"
```

**Clock-in/out:**
```bash
# Get records for date range
curl "http://localhost:3000/api/clock-in-out?startDate=2024-01-01&endDate=2024-01-31"

# Get records for specific date
curl "http://localhost:3000/api/clock-in-out?date=2024-01-15"
```

## Next Steps

Phase 6 is complete! The aggregation and reporting system is ready for:

1. **Phase 7**: Internal UI Development - Use these services to build dashboard views
2. **Phase 8**: Email Digest System - Use `formatWeeklyReportForEmail()` to send reports
3. **Production**: Create database views via Supabase MCP for performance optimization

## Notes

- All aggregations use `activity_sessions` table (derived from time entries)
- Hours are calculated from `duration_minutes` (rounded to 2 decimals)
- Incomplete sessions are included by default but can be excluded
- Weekly reports automatically aggregate across all client groups
- Database views should be created via Supabase MCP or direct SQL for production

