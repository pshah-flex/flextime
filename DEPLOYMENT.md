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

**Steps to add environment variables:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your FlexTime project
3. Go to **Settings** → **Environment Variables**
4. Add each variable below (click "Add New" for each)
5. Select **Production**, **Preview**, and **Development** environments (or as needed)
6. Click "Save" after each variable

#### Supabase (Required)

| Variable Name | Value |
|--------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xegtayaaifuxepntloct.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlZ3RheWFhaWZ1eGVwbnRsb2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzk5NzQsImV4cCI6MjA3ODY1NTk3NH0.CE5bGrgKwChYMbyG6GqCi77Rp3P8uH43kyHS0_TXumo` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlZ3RheWFhaWZ1eGVwbnRsb2N0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3OTk3NCwiZXhwIjoyMDc4NjU1OTc0fQ.FsfvIvpIBegOPmBR7yggHOYbda4-DeGDZm6mskpGjkk` |

#### Jibble API (Required)

| Variable Name | Value |
|--------------|-------|
| `JIBBLE_CLIENT_ID` | `f650b933-9a8b-49f0-8be3-3656230264df` |
| `JIBBLE_CLIENT_SECRET` | `7QI5ylOE5fNIvRl1fAeLbVLptnAHmAZxCseYoxnf701ruCVT` |
| `JIBBLE_API_URL` | `https://workspace.prod.jibble.io` |
| `JIBBLE_IDENTITY_URL` | `https://identity.prod.jibble.io/connect/token` |
| `JIBBLE_TIME_TRACKING_URL` | `https://time-tracking.prod.jibble.io` |

#### Airtable (Required)

| Variable Name | Value |
|--------------|-------|
| `AIRTABLE_PERSONAL_ACCESS_TOKEN` | `YOUR_AIRTABLE_PERSONAL_ACCESS_TOKEN` (see Airtable Dashboard) |
| `AIRTABLE_BASE_ID` | `appvhgZiUha2A1OQg` |

#### Resend (Required for Phase 8 - Email Digest)

| Variable Name | Value |
|--------------|-------|
| `RESEND_API_KEY` | `re_i7s2UZLP_L6LLe2Zx6oyUEeB1qXB2ZVD8` |
| `RESEND_FROM_EMAIL` | `noreply@flexscale.com` (Optional - defaults to `noreply@flexscale.com`) |

#### Vercel Cron (Optional - for authentication)

Generate a secure random string (you can use: `openssl rand -base64 32` or any password generator):

| Variable Name | Value |
|--------------|-------|
| `CRON_SECRET` | `+ZNSzfxczVba69V8vnz4QMfMgvqyLD7x9tnci3MZ0fg=` (or generate your own) |

**Quick Copy-Paste Checklist:**

✅ Add these 10 required variables:
- `NEXT_PUBLIC_SUPABASE_URL` = `https://xegtayaaifuxepntloct.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlZ3RheWFhaWZ1eGVwbnRsb2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzk5NzQsImV4cCI6MjA3ODY1NTk3NH0.CE5bGrgKwChYMbyG6GqCi77Rp3P8uH43kyHS0_TXumo`
- `SUPABASE_SERVICE_ROLE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlZ3RheWFhaWZ1eGVwbnRsb2N0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3OTk3NCwiZXhwIjoyMDc4NjU1OTc0fQ.FsfvIvpIBegOPmBR7yggHOYbda4-DeGDZm6mskpGjkk`
- `JIBBLE_CLIENT_ID` = `f650b933-9a8b-49f0-8be3-3656230264df`
- `JIBBLE_CLIENT_SECRET` = `7QI5ylOE5fNIvRl1fAeLbVLptnAHmAZxCseYoxnf701ruCVT`
- `JIBBLE_API_URL` = `https://workspace.prod.jibble.io`
- `JIBBLE_IDENTITY_URL` = `https://identity.prod.jibble.io/connect/token`
- `JIBBLE_TIME_TRACKING_URL` = `https://time-tracking.prod.jibble.io`
- `AIRTABLE_PERSONAL_ACCESS_TOKEN` = (Get from Airtable Dashboard → Settings → Developer → Personal Access Tokens)
- `AIRTABLE_BASE_ID` = `appvhgZiUha2A1OQg`

✅ Required for Phase 8 (Email Digest):
- `RESEND_API_KEY` = `re_i7s2UZLP_L6LLe2Zx6oyUEeB1qXB2ZVD8`
- `RESEND_FROM_EMAIL` = `noreply@flexscale.com` (Optional - defaults to `noreply@flexscale.com`)

✅ Optional (for Cron authentication):
- `CRON_SECRET` = `+ZNSzfxczVba69V8vnz4QMfMgvqyLD7x9tnci3MZ0fg=` (or generate your own with `openssl rand -base64 32`)

**⚠️ Important**: The `SUPABASE_SERVICE_ROLE_KEY` is required for database write operations (ingestion). It's included in the list above.

### 3. Deploy

1. After adding environment variables, Vercel will automatically trigger a deployment
2. Or manually trigger: Go to project → Deployments → Redeploy

### 4. Verify Deployment

After deployment completes:

1. **Check Build Logs**: Ensure build succeeded
2. **Test Homepage**: Visit your Vercel URL (e.g., `https://flextime.vercel.app`)
3. **Test API Endpoints**:
   - `/api/aggregations?type=summary&startDate=2024-01-01&endDate=2024-01-31`
   - `/api/reports/weekly?previousWeek=true`
   - `/api/clock-in-out?startDate=2024-01-01&endDate=2024-01-31`

### 5. Cron Jobs

Cron jobs are configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/ingest",
      "schedule": "*/10 * * * *"
    },
    {
      "path": "/api/cron/weekly-email",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

- **Data Ingestion**: Runs every 10 minutes to sync new time entries from Jibble
- **Weekly Email Digest**: Runs every Monday at 9 AM UTC to send weekly reports to clients

**Note**: Cron jobs only work on Vercel Pro plan or higher. For free tier, you'll need to:
- Use Vercel Cron (available on Pro plan)
- Or use an external cron service (cron-job.org, EasyCron, etc.) that hits your endpoint

### 6. Post-Deployment Checklist

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

