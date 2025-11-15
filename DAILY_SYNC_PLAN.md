# Daily Sync Plan for Jibble Data

## Overview
Implement daily automated sync of Jibble time tracking data to ensure fresh data is available in the app and for weekly email digests.

## Requirements

### Schedule
- **Daily Sync**: Every day at **5:00 AM US Pacific Time**
- **Sync Period**: Previous day's data (midnight to 11:59:59 PM)
- **Email Digest**: Monday at **6:00 AM US Pacific Time** (data must be synced by then)
- **Historical Data Cutoff**: November 1, 2025 forward (no older data needed)

### Data to Sync
1. **Agents** (members) - Sync all to ensure new agents are available
2. **Groups** (client groups) - Sync all to ensure new groups are available
3. **Time Entries** - Sync previous day's entries only (incremental)
4. **Activity Sessions** - Derive sessions from time entries

## Implementation Plan

### Phase 1: Daily Sync Cron Job

#### 1.1 Create Daily Sync API Route
**File**: `app/api/cron/daily-sync/route.ts`

- Authenticate using `CRON_SECRET` (similar to existing cron routes)
- Call daily sync service
- Log results and handle errors

#### 1.2 Create Daily Sync Service
**File**: `app/lib/services/daily-sync.service.ts`

**Function**: `runDailySync(targetDate?: string)`

**Logic**:
1. **Determine Date to Sync**
   - If `targetDate` provided, use it
   - Otherwise, calculate previous day in Pacific Time:
     - Get current time in Pacific Timezone
     - Subtract 1 day
     - Use date range: `YYYY-MM-DD 00:00:00` to `YYYY-MM-DD 23:59:59` Pacific

2. **Sync Agents** (full sync)
   - Call `syncAgents()` to ensure all agents are up-to-date

3. **Sync Groups** (full sync)
   - Call `syncGroups()` to ensure all groups are up-to-date

4. **Sync Time Entries** (incremental - previous day only)
   - Call `ingestTimeEntries(startDate, endDate)` with previous day's date range
   - This should handle deduplication automatically

5. **Derive Sessions** (from new time entries)
   - Call `deriveSessionsForDateRange(startDate, endDate)` for previous day
   - Insert sessions with duplicate handling

6. **Return Results**
   - Success/failure status
   - Counts: agents synced, groups synced, time entries inserted, sessions derived
   - Any errors encountered

#### 1.3 Update Vercel Cron Configuration
**File**: `vercel.json`

Add new cron job:
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-sync",
      "schedule": "0 13 * * *"
    }
  ]
}
```

**Note**: Vercel cron schedules use UTC. We use 1:00 PM UTC which equals:
- 5:00 AM PST (Pacific Standard Time, UTC-8)
- 6:00 AM PDT (Pacific Daylight Time, UTC-7)
- This ensures the sync always runs after 5 AM Pacific regardless of DST

### Phase 2: Historical Data Backfill

#### 2.1 Backfill Script
**File**: `scripts/backfill-daily-sync.ts`

**Purpose**: Backfill data from November 1, 2025 to yesterday

**Logic**:
- Loop through each day from Nov 1, 2025 to yesterday
- For each day, call `runDailySync(targetDate)`
- Add delays between days to avoid rate limiting
- Log progress and handle errors

**Usage**:
```bash
npx tsx scripts/backfill-daily-sync.ts
```

#### 2.2 Validation
- Ensure no duplicate time entries are inserted
- Verify sessions are derived correctly
- Check data consistency

### Phase 3: Integration with Email Digest

#### 3.1 Update Weekly Email Job
**File**: `app/lib/services/weekly-email-job.ts`

**Current Behavior**: Email digest runs Monday at 9 AM UTC

**Update Required**:
- Change cron schedule to **Monday at 6:00 AM Pacific Time**
- Ensure daily sync completes before email digest runs (1 hour buffer)
- No code changes needed - data will already be synced

**File**: `vercel.json`

Update weekly email cron:
```json
{
  "path": "/api/cron/weekly-email",
  "schedule": "0 14 * * 1"
}
```

**Note**: 2:00 PM UTC on Monday equals:
- 6:00 AM PST (Pacific Standard Time, UTC-8)
- 7:00 AM PDT (Pacific Daylight Time, UTC-7)
- This ensures the email always runs after 6 AM Pacific (and after daily sync at 5 AM) regardless of DST

### Phase 4: Timezone Handling

#### 4.1 Pacific Timezone Utilities
**File**: `app/lib/utils/timezone.ts` (may already exist)

**Functions Needed**:
- `getPacificDate()` - Get current date in Pacific timezone
- `getPreviousDayPacific()` - Get previous day's date in Pacific
- `getDateRangePacific(date)` - Get start/end of day in Pacific, convert to UTC for API calls

**Key Points**:
- Jibble API uses UTC timestamps
- Store data in UTC in database
- Convert Pacific time to UTC for API queries
- App displays in appropriate timezone

### Phase 5: Error Handling & Monitoring

#### 5.1 Error Handling
- Retry logic for transient failures
- Log errors for monitoring
- Alert on critical failures (optional)

#### 5.2 Logging
- Log sync start/end times
- Log counts: agents, groups, time entries, sessions
- Log any errors or warnings
- Log date range being synced

#### 5.3 Idempotency
- Ensure sync can be run multiple times safely
- Deduplication handled by existing `ingestTimeEntries` service
- Session derivation handles duplicates

### Phase 6: Testing

#### 6.1 Test Daily Sync Service
**File**: `scripts/test-daily-sync.ts`

- Test with a specific date
- Verify data is ingested correctly
- Verify sessions are derived
- Test error handling

#### 6.2 Test Cron Job Locally
- Use Vercel CLI to simulate cron jobs
- Verify authentication works
- Verify date calculation is correct

#### 6.3 Test Timezone Handling
- Test with different current times
- Verify previous day calculation in Pacific time
- Verify UTC conversion for API calls

## Implementation Steps

1. ✅ Create daily sync service (`app/lib/services/daily-sync.service.ts`)
2. ✅ Create daily sync API route (`app/api/cron/daily-sync/route.ts`)
3. ✅ Update `vercel.json` with daily sync cron job
4. ✅ Update weekly email cron schedule
5. ✅ Create backfill script for historical data
6. ✅ Add timezone utilities for Pacific time handling
7. ✅ Test daily sync with sample date
8. ✅ Run backfill for Nov 1, 2025 to today
9. ✅ Deploy and monitor first few days

## Database Considerations

### Existing Schema
- No schema changes needed
- Existing unique constraints handle duplicates
- Sessions table has composite unique constraint

### Data Integrity
- Daily sync only adds new data (incremental)
- Deduplication ensures no duplicates
- Sessions are derived from time entries

## Monitoring & Maintenance

### Metrics to Track
- Daily sync success/failure rate
- Number of records synced per day
- Sync duration
- Error rates

### Alerts (Optional)
- Email on sync failure
- Alert if sync takes too long
- Alert if zero records synced (might indicate issue)

## Edge Cases

1. **DST Changes**: Pacific timezone observes DST
   - Solution: Use `timezone: "America/Los_Angeles"` in Vercel cron
   - Or calculate UTC times manually accounting for DST

2. **Missing Data**: If sync fails, data for that day is missing
   - Solution: Backfill script can re-run for specific dates
   - Manual re-sync capability

3. **Large Data Volumes**: Some days might have many time entries
   - Solution: Existing pagination and batch processing handles this

4. **Weekend Syncs**: Daily sync runs on weekends too
   - Expected behavior: Sync all days including weekends

## Future Enhancements

- Retry failed syncs automatically
- Sync multiple days if previous syncs failed
- Dashboard to view sync status
- Manual trigger for specific date ranges

