# Daily Sync Deployment Summary ✅

## Deployment Status

### ✅ Completed Steps

1. **Testing Setup**
   - Test script created: `scripts/test-daily-sync.ts`
   - Backfill script created: `scripts/backfill-daily-sync.ts`
   - Both scripts are ready for use

2. **Historical Backfill Script**
   - Script available: `scripts/backfill-daily-sync.ts`
   - Will backfill from November 1, 2025 to yesterday
   - Includes rate limiting delays (2 seconds between days)
   - Ready to run when needed

3. **Merge to Main**
   - ✅ Merged `daily-sync` branch to `main`
   - ✅ All changes committed and pushed to GitHub
   - Branch is now integrated into main codebase

4. **Deployment Configuration**
   - ✅ `vercel.json` updated with cron job schedules
   - ✅ Vercel will automatically deploy on push to main
   - ✅ Cron jobs will be configured automatically

## Vercel Cron Jobs Configuration

The following cron jobs are now configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/ingest",
      "schedule": "*/10 * * * *"
    },
    {
      "path": "/api/cron/daily-sync",
      "schedule": "0 13 * * *"
    },
    {
      "path": "/api/cron/weekly-email",
      "schedule": "0 14 * * 1"
    }
  ]
}
```

### Schedule Details

1. **Incremental Ingestion** (`/api/cron/ingest`)
   - Runs every 10 minutes
   - Ingests recent time entries (last hour)

2. **Daily Sync** (`/api/cron/daily-sync`)
   - Runs daily at 1:00 PM UTC
   - Pacific Time: 5:00 AM PST / 6:00 AM PDT
   - Syncs previous day's data

3. **Weekly Email** (`/api/cron/weekly-email`)
   - Runs Monday at 2:00 PM UTC
   - Pacific Time: 6:00 AM PST / 7:00 AM PDT
   - Sends weekly reports to clients

## Next Steps After Deployment

### 1. Verify Cron Jobs in Vercel

After Vercel deploys:
1. Go to Vercel Dashboard → Your Project → Settings → Cron Jobs
2. Verify all three cron jobs are listed:
   - `/api/cron/ingest` - Every 10 minutes
   - `/api/cron/daily-sync` - Daily at 13:00 UTC
   - `/api/cron/weekly-email` - Monday at 14:00 UTC

### 2. Monitor First Executions

Watch the Vercel logs for:
- First daily sync execution (should run at 1 PM UTC next day)
- Verify it syncs the previous day's data correctly
- Check for any errors in the logs

### 3. Run Historical Backfill (Optional)

If you need historical data from Nov 1, 2025 forward:

```bash
# From your local machine with .env.local configured:
npx tsx scripts/backfill-daily-sync.ts
```

Or trigger it manually via API:
```bash
curl -X POST https://your-app.vercel.app/api/cron/daily-sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"targetDate": "2025-11-01"}'
```

### 4. Test Daily Sync Manually

You can test the daily sync manually:
```bash
# Test with a specific date
curl -X POST https://your-app.vercel.app/api/cron/daily-sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"targetDate": "2025-11-14"}'
```

Or test for previous day:
```bash
curl -X GET https://your-app.vercel.app/api/cron/daily-sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Environment Variables Required

Ensure these are set in Vercel:

- ✅ `CRON_SECRET` - For cron job authentication
- ✅ `JIBBLE_CLIENT_ID` - For Jibble API access
- ✅ `JIBBLE_CLIENT_SECRET` - For Jibble API access
- ✅ `SUPABASE_URL` - For database access
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - For database access
- ✅ `RESEND_API_KEY` - For email sending (weekly digest)
- ✅ `RESEND_FROM_EMAIL` - Email sender address
- ✅ `AIRTABLE_PERSONAL_ACCESS_TOKEN` - For client sync (weekly email)

## Monitoring

### Daily Sync Monitoring

- Check Vercel logs after 1 PM UTC daily
- Verify data is being synced:
  - Agents count
  - Groups count
  - Time entries inserted
  - Sessions derived

### Weekly Email Monitoring

- Check Vercel logs Monday after 2 PM UTC
- Verify emails are sent:
  - Check Resend dashboard
  - Verify client reports are generated
  - Check for any errors

## Troubleshooting

### Cron Job Not Running

1. Check Vercel Cron Jobs page
2. Verify schedule format is correct
3. Check function logs for errors
4. Verify `CRON_SECRET` is set correctly

### Daily Sync Failing

1. Check Vercel logs for errors
2. Verify Jibble API credentials
3. Verify Supabase credentials
4. Check for rate limiting issues

### Data Not Syncing

1. Verify timezone calculations (should use Pacific time)
2. Check if previous day calculation is correct
3. Verify Jibble API is returning data
4. Check database for any constraint violations

## Files Deployed

- ✅ `app/lib/services/daily-sync.service.ts`
- ✅ `app/api/cron/daily-sync/route.ts`
- ✅ `app/lib/utils/timezone.ts` (updated)
- ✅ `vercel.json` (updated)
- ✅ `scripts/test-daily-sync.ts`
- ✅ `scripts/backfill-daily-sync.ts`

## Success Criteria

- ✅ Code merged to main
- ✅ Pushed to GitHub
- ✅ Vercel will auto-deploy
- ✅ Cron jobs configured in vercel.json
- ⏳ Wait for Vercel deployment to complete
- ⏳ Verify cron jobs appear in Vercel dashboard
- ⏳ Monitor first execution

---

**Deployment Date**: $(date)
**Branch**: `daily-sync` → `main`
**Status**: ✅ Ready for Vercel auto-deployment

