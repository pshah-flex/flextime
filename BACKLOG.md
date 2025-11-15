# Backlog

## Date Calculation Issue

### Issue
The weekly report period calculation is currently returning `Nov 2-9` instead of the expected `Nov 2-8` for the previous week (Sunday to Saturday).

### Current Behavior
- When calculating the previous week ending Saturday, the calculation returns Saturday Nov 9 instead of Saturday Nov 8
- This affects:
  - `generatePreviousWeekReport()` in `app/lib/services/weekly-report.ts`
  - `runWeeklyEmailJob()` in `app/lib/services/weekly-email-job.ts`
  - `test-all-clients.ts` script

### Expected Behavior
- The period should always be Sunday to Saturday of the previous complete week
- For example, if today is Friday Nov 15, the previous week should be Nov 2 (Sunday) to Nov 8 (Saturday)

### Root Cause
The date calculation logic attempts to find the previous week's Saturday by:
1. Finding the current week's Saturday
2. Going back 8 days
3. Finding the Saturday of that week

However, this logic still returns Nov 9 instead of Nov 8, possibly due to timezone handling or edge cases in the date arithmetic.

### Files Affected
- `app/lib/services/weekly-report.ts` (lines 257-336)
- `app/lib/services/weekly-email-job.ts` (lines 72-112, 158-209)
- `scripts/test-all-clients.ts` (lines 94-124)

### Notes
- The email date formatting has been fixed to use UTC parsing (see `app/lib/services/email.service.ts`)
- The actual data and reports are correct; only the period calculation needs adjustment
- May need to verify timezone handling and ensure consistent UTC usage throughout

### Priority
Low - The system is functional, but the date range displayed may be off by one day. This can be addressed when time permits.

