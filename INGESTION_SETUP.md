# Ingestion Service Setup

## Environment Variables Required

To run the ingestion service, you need the following environment variables:

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - **Required for ingestion** - Your Supabase service role key

### Jibble
- `JIBBLE_CLIENT_ID` - Your Jibble Client ID
- `JIBBLE_CLIENT_SECRET` - Your Jibble Client Secret

## Getting Supabase Service Role Key

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/xegtayaaifuxepntloct
2. Navigate to **Settings** → **API**
3. Find the **service_role** key (not the anon key)
4. Copy it and add to your `.env.local` file as `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Important**: The service role key bypasses Row Level Security (RLS) and has full database access. Keep it secure and never commit it to version control.

## Testing the Ingestion Service

Once you have the service role key set up:

```bash
# Test with dry run
npx tsx scripts/test-ingestion.ts

# Run actual ingestion for last 7 days
npx tsx scripts/backfill.ts --startDate=2024-11-07 --endDate=2024-11-14 --dryRun=false
```

## API Endpoints

### Manual Ingestion
- `POST /api/ingest` - Manually trigger ingestion
- `GET /api/ingest?startDate=2024-01-01&endDate=2024-01-31` - Trigger with query params

### Cron Job
- `GET /api/cron/ingest` - Vercel cron job endpoint (runs every 10 minutes)

## Cron Job Configuration

The cron job is configured in `vercel.json` to run every 10 minutes. To change the schedule, update the `schedule` field:

```json
{
  "crons": [{
    "path": "/api/cron/ingest",
    "schedule": "*/5 * * * *"  // Every 5 minutes
  }]
}
```

Schedule format: `minute hour day month weekday`
- `*/5 * * * *` = Every 5 minutes
- `*/10 * * * *` = Every 10 minutes
- `0 * * * *` = Every hour

