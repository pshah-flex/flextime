# Deployment Guide

## ✅ GitHub Push Complete

All code has been pushed to GitHub:
- Repository: `git@github.com:pshah-flex/flextime.git`
- Branch: `main`
- Commit: Latest changes with Phases 1-7 complete

## Vercel Deployment Setup

### 1. Repository Connection Status

✅ **Repository is already connected to Vercel**

The repository `pshah-flex/flextime` is connected to your Vercel project. 

To verify or manage the connection:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your FlexTime project
3. Go to **Settings** → **Git** to view connection details

**If you need to reconnect:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import Git Repository → Select `pshah-flex/flextime`
4. Configure Project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

### 2. Environment Variables

Add the following environment variables in Vercel Dashboard:

#### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://xegtayaaifuxepntloct.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlZ3RheWFhaWZ1eGVwbnRsb2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzk5NzQsImV4cCI6MjA3ODY1NTk3NH0.CE5bGrgKwChYMbyG6GqCi77Rp3P8uH43kyHS0_TXumo
SUPABASE_SERVICE_ROLE_KEY=[Get from Supabase Dashboard → Settings → API → service_role key]
```

#### Jibble API
```
JIBBLE_CLIENT_ID=f650b933-9a8b-49f0-8be3-3656230264df
JIBBLE_CLIENT_SECRET=7QI5ylOE5fNIvRl1fAeLbVLptnAHmAZxCseYoxnf701ruCVT
JIBBLE_API_URL=https://workspace.prod.jibble.io
JIBBLE_IDENTITY_URL=https://identity.prod.jibble.io/connect/token
JIBBLE_TIME_TRACKING_URL=https://time-tracking.prod.jibble.io
```

#### Airtable
```
AIRTABLE_PERSONAL_ACCESS_TOKEN=YOUR_AIRTABLE_PERSONAL_ACCESS_TOKEN
AIRTABLE_BASE_ID=appvhgZiUha2A1OQg
```

#### Resend (Optional - for Phase 8)
```
RESEND_API_KEY=re_i7s2UZLP_L6LLe2Zx6oyUEeB1qXB2ZVD8
```

#### Vercel Cron (Optional)
```
CRON_SECRET=[Generate a secure random string for cron job authentication]
```

### 3. Getting Supabase Service Role Key

**⚠️ Important**: The service role key is required for database write operations (ingestion).

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/xegtayaaifuxepntloct)
2. Navigate to **Settings** → **API**
3. Find the **service_role** key (not the anon key)
4. Copy it and add to Vercel environment variables as `SUPABASE_SERVICE_ROLE_KEY`

### 4. Deploy

1. After adding environment variables, Vercel will automatically trigger a deployment
2. Or manually trigger: Go to project → Deployments → Redeploy

### 5. Verify Deployment

After deployment completes:

1. **Check Build Logs**: Ensure build succeeded
2. **Test Homepage**: Visit your Vercel URL (e.g., `https://flextime.vercel.app`)
3. **Test API Endpoints**:
   - `/api/aggregations?type=summary&startDate=2024-01-01&endDate=2024-01-31`
   - `/api/reports/weekly?previousWeek=true`
   - `/api/clock-in-out?startDate=2024-01-01&endDate=2024-01-31`

### 6. Cron Jobs

The cron job is configured in `vercel.json` to run every 10 minutes:

```json
{
  "crons": [{
    "path": "/api/cron/ingest",
    "schedule": "*/10 * * * *"
  }]
}
```

**Note**: Cron jobs only work on Vercel Pro plan or higher. For free tier, you'll need to:
- Use Vercel Cron (available on Pro plan)
- Or use an external cron service (cron-job.org, EasyCron, etc.) that hits your endpoint

### 7. Post-Deployment Checklist

- [ ] All environment variables set
- [ ] Build succeeds without errors
- [ ] Homepage loads correctly
- [ ] Dashboard displays data (if data exists)
- [ ] API endpoints return data (test with curl or browser)
- [ ] Cron job is running (if on Pro plan)
- [ ] Database connection works (test ingestion endpoint)

## Troubleshooting

### Build Errors

1. **Missing Dependencies**: Run `npm install` locally and commit `package-lock.json`
2. **TypeScript Errors**: Fix all linting errors before pushing
3. **Environment Variables**: Ensure all required variables are set in Vercel

### Runtime Errors

1. **API Routes Not Working**: Check environment variables are set correctly
2. **Database Connection Issues**: Verify Supabase credentials
3. **Cron Jobs Not Running**: Check if on Pro plan or use external cron service

### Common Issues

**Error: "Missing SUPABASE_SERVICE_ROLE_KEY"**
- Solution: Add service role key from Supabase dashboard

**Error: "Invalid API key"**
- Solution: Verify Jibble credentials are correct

**Error: "Cron job not authorized"**
- Solution: Set `CRON_SECRET` environment variable and update cron endpoint

## Security Notes

⚠️ **Never commit sensitive credentials to Git**:
- All `.env.local` files are in `.gitignore`
- Secrets are stored in Vercel environment variables
- Use environment variables for all sensitive data

## Next Steps

After successful deployment:

1. **Phase 8**: Implement Email Digest System
2. **Testing**: Run end-to-end tests
3. **Monitoring**: Set up error monitoring (Sentry, LogRocket)
4. **Optimization**: Review performance and optimize queries

