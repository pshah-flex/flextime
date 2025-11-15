# Phase 5: Data Ingestion Pipeline - Complete ✅

## Overview

Phase 5 implements the complete data ingestion pipeline that syncs data from Jibble API to Supabase, including agents, groups, time entries, and session derivation.

## Components Created

### 1. Sync Services

#### `app/lib/services/sync-agents.ts`
- Syncs agents/members from Jibble to Supabase
- Handles create/update operations (upsert)
- Maps Jibble member data to our Agent schema

#### `app/lib/services/sync-groups.ts`
- Syncs client groups from Jibble to Supabase
- Handles create/update operations (upsert)
- Maps Jibble group data to our ClientGroup schema

### 2. Ingestion Service

#### `app/lib/services/ingest-time-entries.ts`
- Fetches time entries from Jibble API
- Normalizes timestamps to UTC
- Checks for duplicates using `jibble_time_entry_id`
- Stores raw payload in `raw_payload` field
- Links activities to agents and client groups
- Batch processing for efficiency (100 entries per batch)
- Handles missing agents/groups gracefully

**Key Features:**
- Incremental ingestion (last N hours)
- Full date range ingestion
- Group-specific ingestion
- Dry run mode for testing

### 3. Session Derivation

#### `app/lib/services/derive-sessions.ts`
- Derives activity sessions from time entries
- Pairs "In" and "Out" entries
- Groups by agent and date
- Calculates duration
- Marks incomplete sessions (no matching "Out" entry)

**Session Logic:**
- Sorts activities by time
- Pairs consecutive "In"/"Out" entries
- Handles incomplete sessions at end of day
- Calculates duration in minutes

### 4. Main Ingestion Service

#### `app/lib/services/ingestion.service.ts`
- Orchestrates the full ingestion pipeline
- Coordinates all sync and ingestion steps
- Provides comprehensive logging
- Returns detailed results

**Pipeline Steps:**
1. Sync agents from Jibble
2. Sync groups from Jibble
3. Ingest time entries
4. Derive sessions (optional)

### 5. API Endpoints

#### `app/api/ingest/route.ts`
- Manual ingestion endpoint
- Supports GET and POST
- Configurable via query params or body
- Returns detailed results

**Usage:**
```bash
# GET request
GET /api/ingest?startDate=2024-01-01&endDate=2024-01-31&groupIds=group-id-1,group-id-2

# POST request
POST /api/ingest
{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "groupIds": ["group-id-1"],
  "syncAgents": true,
  "syncGroups": true,
  "deriveSessions": false,
  "dryRun": false
}
```

#### `app/api/cron/ingest/route.ts`
- Vercel cron job endpoint
- Runs incremental ingestion (last 1 hour)
- Protected by `CRON_SECRET` (optional)
- Designed for scheduled execution

### 6. Cron Configuration

#### `vercel.json`
- Configured to run every 10 minutes
- Can be adjusted for different schedules

**Current Schedule:**
```json
{
  "crons": [{
    "path": "/api/cron/ingest",
    "schedule": "*/10 * * * *"
  }]
}
```

### 7. Backfill Script

#### `scripts/backfill.ts`
- Command-line tool for historical data backfill
- Supports date range parameters
- Batch processing for large datasets
- Progress tracking via console logs

**Usage:**
```bash
npx tsx scripts/backfill.ts --startDate=2024-01-01 --endDate=2024-01-31
npx tsx scripts/backfill.ts --startDate=2024-01-01 --endDate=2024-01-31 --groupIds=group-id-1,group-id-2
npx tsx scripts/backfill.ts --startDate=2024-01-01 --endDate=2024-01-31 --dryRun=true
```

## Testing

### Test Scripts

#### `scripts/test-ingestion.ts`
- Full integration test
- Tests agent sync, group sync, and time entry ingestion
- Supports dry run mode

#### `scripts/test-ingestion-simple.ts`
- Simplified test using Supabase MCP
- Tests Jibble API connectivity
- Validates data structure

## Setup Requirements

### Environment Variables

See `INGESTION_SETUP.md` for complete setup instructions.

**Required:**
- `SUPABASE_SERVICE_ROLE_KEY` - For database write operations
- `JIBBLE_CLIENT_ID` - Jibble API credentials
- `JIBBLE_CLIENT_SECRET` - Jibble API credentials

### Getting Service Role Key

1. Go to Supabase dashboard: https://supabase.com/dashboard/project/xegtayaaifuxepntloct
2. Navigate to **Settings** → **API**
3. Copy the **service_role** key
4. Add to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Security Note**: Service role key bypasses RLS. Keep it secure!

## Features

### ✅ Deduplication
- Uses `jibble_time_entry_id` unique constraint
- Checks for existing entries before insert
- Logs duplicate attempts

### ✅ Error Handling
- Graceful handling of missing agents/groups
- Retry logic for API calls (handled by Jibble client)
- Comprehensive error logging

### ✅ Performance
- Batch processing (100 entries per batch)
- Parallel fetching of agents/groups/members
- Efficient duplicate checking

### ✅ Idempotency
- Safe to run multiple times
- Duplicate entries are skipped
- Updates existing records when needed

### ✅ Logging
- Detailed console logs for each step
- Progress tracking
- Error reporting with context

## Next Steps

Phase 5 is complete! The ingestion pipeline is ready for:

1. **Production Deployment**: Deploy to Vercel and configure cron job
2. **Historical Backfill**: Run backfill script for historical data
3. **Phase 6**: Aggregation & Reporting Logic

## Notes

- The ingestion service requires `SUPABASE_SERVICE_ROLE_KEY` for write operations
- For testing without service role key, use `test-ingestion-simple.ts`
- Cron job runs every 10 minutes by default (configurable in `vercel.json`)
- Session derivation is optional and can be run separately

