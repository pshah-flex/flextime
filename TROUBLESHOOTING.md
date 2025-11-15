# FlexTime Troubleshooting Guide

## Overview

This guide covers common issues, error messages, and solutions for the FlexTime application.

---

## Table of Contents

1. [Deployment Issues](#deployment-issues)
2. [Data Ingestion Problems](#data-ingestion-problems)
3. [Database Issues](#database-issues)
4. [API Errors](#api-errors)
5. [Email Issues](#email-issues)
6. [UI Issues](#ui-issues)
7. [Cron Job Problems](#cron-job-problems)
8. [Performance Issues](#performance-issues)

---

## Deployment Issues

### Build Fails on Vercel

**Symptoms**:
- Vercel build fails with errors
- Deployment status shows "Build Error"

**Solutions**:

1. **TypeScript Errors**:
   ```bash
   # Run locally to check for errors
   npm run build
   
   # Fix all TypeScript errors
   # Ensure all imports are correct
   ```

2. **Missing Dependencies**:
   ```bash
   # Ensure package-lock.json is committed
   git add package-lock.json
   git commit -m "Update package-lock.json"
   git push
   ```

3. **Environment Variables Missing**:
   - Check Vercel Dashboard → Settings → Environment Variables
   - Ensure all required variables are set (see `DEPLOYMENT.md`)
   - Redeploy after adding variables

### Environment Variables Not Loading

**Symptoms**:
- API endpoints return errors about missing variables
- Functions fail with "undefined" errors

**Solutions**:

1. **Verify in Vercel Dashboard**:
   - Go to Project → Settings → Environment Variables
   - Ensure variables are set for Production, Preview, and Development
   - Check variable names match exactly (case-sensitive)

2. **Redeploy After Changes**:
   - After adding/updating environment variables, trigger a redeploy
   - Vercel → Deployments → Redeploy

3. **Check Variable Names**:
   - Ensure no typos in variable names
   - Check for extra spaces or special characters
   - Verify prefixes (e.g., `NEXT_PUBLIC_` for client-side variables)

---

## Data Ingestion Problems

### No Data Being Ingested

**Symptoms**:
- Database remains empty after ingestion runs
- No new time entries appear

**Solutions**:

1. **Check Jibble API Credentials**:
   ```bash
   # Test credentials
   curl -X POST https://identity.prod.jibble.io/connect/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&grant_type=client_credentials&scope=api1"
   ```

2. **Verify Date Range**:
   - Ensure date range has data in Jibble
   - Check if dates are in correct format (YYYY-MM-DD)
   - Verify timezone handling

3. **Check Function Logs**:
   - Vercel Dashboard → Functions → View logs
   - Look for errors or warnings
   - Check for rate limiting errors

4. **Manual Ingestion Test**:
   ```bash
   # Trigger manual ingestion
   curl -X POST https://your-app.vercel.app/api/ingest \
     -H "Content-Type: application/json" \
     -d '{"startDate": "2024-01-01", "endDate": "2024-01-31"}'
   ```

### Duplicate Data Being Created

**Symptoms**:
- Same time entries appear multiple times
- Database constraint violations

**Solutions**:

1. **Check Unique Constraints**:
   - Verify `jibble_time_entry_id` unique constraint exists
   - Check `activity_sessions` unique constraint on `(agent_id, client_group_id, start_time_utc)`

2. **Review Ingestion Logic**:
   - Ensure deduplication is working
   - Check if `ON CONFLICT` clauses are correct

3. **Clean Duplicates**:
   ```sql
   -- Find duplicates
   SELECT jibble_time_entry_id, COUNT(*)
   FROM activities
   GROUP BY jibble_time_entry_id
   HAVING COUNT(*) > 1;
   
   -- Remove duplicates (keep earliest)
   DELETE FROM activities a1
   WHERE EXISTS (
     SELECT 1 FROM activities a2
     WHERE a2.jibble_time_entry_id = a1.jibble_time_entry_id
     AND a2.id < a1.id
   );
   ```

### Slow Ingestion

**Symptoms**:
- Ingestion takes a very long time
- Function timeout errors

**Solutions**:

1. **Reduce Date Range**:
   - Break large date ranges into smaller chunks
   - Process one month at a time

2. **Check Function Timeout**:
   - Default timeout is 10 seconds on free tier
   - Upgrade to Pro for longer timeouts (up to 300 seconds)

3. **Optimize Database Queries**:
   - Ensure indexes exist on frequently queried columns
   - Review query performance in Supabase dashboard

4. **Batch Processing**:
   - Ingestion already uses batch processing (100 records at a time)
   - Consider reducing batch size if memory issues occur

---

## Database Issues

### Connection Errors

**Symptoms**:
- "Connection refused" errors
- "Invalid API key" errors
- "Database not found" errors

**Solutions**:

1. **Verify Supabase Credentials**:
   - Check `NEXT_PUBLIC_SUPABASE_URL` is correct
   - Verify `SUPABASE_SERVICE_ROLE_KEY` is set (not anon key)
   - Ensure keys are not expired

2. **Check Supabase Status**:
   - Visit Supabase dashboard
   - Verify project is active and not paused
   - Check for any service outages

3. **Test Connection**:
   ```typescript
   // Test connection with simple query
   const { data, error } = await supabase
     .from('agents')
     .select('count')
     .limit(1);
   ```

### Schema Mismatch Errors

**Symptoms**:
- "Column does not exist" errors
- "Table does not exist" errors
- Migration errors

**Solutions**:

1. **Run Migrations**:
   - Check `supabase/migrations/` directory
   - Ensure all migrations have been applied
   - Apply missing migrations manually in Supabase SQL editor

2. **Verify Schema**:
   ```sql
   -- Check table exists
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'activities';
   
   -- Check columns
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'activities';
   ```

3. **Review DATABASE_SCHEMA.md**:
   - Compare expected schema with actual schema
   - Update schema if needed

### Data Integrity Issues

**Symptoms**:
- Foreign key constraint violations
- Null constraint violations
- Data inconsistencies

**Solutions**:

1. **Check Foreign Keys**:
   - Ensure referenced records exist
   - Verify `agent_id` references existing agents
   - Verify `client_group_id` references existing groups

2. **Sync Agents and Groups First**:
   - Always sync agents and groups before ingesting time entries
   - Use `/api/ingest` with `syncAgents: true, syncGroups: true`

3. **Review Data**:
   ```sql
   -- Check for orphaned records
   SELECT a.* FROM activities a
   LEFT JOIN agents ag ON a.agent_id = ag.id
   WHERE ag.id IS NULL;
   ```

---

## API Errors

### 401 Unauthorized

**Symptoms**:
- Cron job endpoints return 401
- "Unauthorized" error messages

**Solutions**:

1. **Check CRON_SECRET**:
   - Verify `CRON_SECRET` is set in Vercel
   - Ensure Authorization header matches exactly
   - Header format: `Bearer YOUR_CRON_SECRET`

2. **Test Authentication**:
   ```bash
   curl -X GET https://your-app.vercel.app/api/cron/daily-sync \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

### 400 Bad Request

**Symptoms**:
- Missing required parameters
- Invalid parameter format

**Solutions**:

1. **Check Required Parameters**:
   - Review API documentation for required parameters
   - Ensure all required query parameters are provided
   - Verify parameter formats (dates in YYYY-MM-DD format)

2. **Example Fix**:
   ```bash
   # Wrong
   curl "/api/aggregations?type=summary"
   
   # Correct
   curl "/api/aggregations?type=summary&startDate=2024-01-01&endDate=2024-01-31"
   ```

### 500 Internal Server Error

**Symptoms**:
- Generic server errors
- Function execution failures

**Solutions**:

1. **Check Function Logs**:
   - Vercel Dashboard → Functions → View logs
   - Look for specific error messages
   - Check stack traces

2. **Common Causes**:
   - Missing environment variables
   - Database connection issues
   - External API failures (Jibble, Resend)
   - Timeout errors

3. **Debug Steps**:
   - Check error logs in Vercel
   - Test endpoint locally with same parameters
   - Verify all dependencies are installed

---

## Email Issues

### Emails Not Sending

**Symptoms**:
- Weekly email job completes but no emails sent
- Email failures in logs

**Solutions**:

1. **Check Resend API Key**:
   - Verify `RESEND_API_KEY` is set correctly
   - Ensure key has not expired
   - Check Resend dashboard for API usage

2. **Verify Domain**:
   - Ensure `notifications.flexscale.com` is verified in Resend
   - Check domain verification status
   - Verify DNS records if needed

3. **Check Email Addresses**:
   - Verify client emails exist in Airtable
   - Check email format is valid
   - Ensure no typos in email addresses

4. **Review Email Logs**:
   ```bash
   # Check email job results
   curl "https://your-app.vercel.app/api/email/weekly"
   ```

### Email Template Issues

**Symptoms**:
- Emails sent but formatting is broken
- Missing data in emails
- Incorrect date ranges

**Solutions**:

1. **Check Report Generation**:
   - Verify weekly report is generated correctly
   - Test report generation: `/api/reports/weekly?previousWeek=true`

2. **Review Email Template**:
   - Check `app/lib/services/email.service.ts`
   - Verify HTML formatting
   - Test email rendering

3. **Date Calculation**:
   - Check previous week calculation logic
   - Verify timezone handling
   - See `BACKLOG.md` for known date calculation issues

---

## UI Issues

### No Data Displayed

**Symptoms**:
- Dashboard shows empty state
- Charts not rendering
- Tables empty

**Solutions**:

1. **Check Date Range**:
   - Verify date range has data
   - Try expanding date range
   - Check if data exists in database

2. **Verify API Endpoints**:
   - Test API endpoints directly (see API documentation)
   - Check browser console for errors
   - Verify API responses contain data

3. **Check Browser Console**:
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Review Network tab for failed requests

### Slow Loading

**Symptoms**:
- Pages take long time to load
- Spinners show indefinitely
- Timeout errors

**Solutions**:

1. **Reduce Date Range**:
   - Narrow date range for faster queries
   - Use filters to limit data

2. **Check API Performance**:
   - Review Vercel function logs
   - Check function execution time
   - Optimize database queries

3. **Database Indexes**:
   - Ensure indexes exist on frequently queried columns
   - Review slow queries in Supabase dashboard

---

## Cron Job Problems

### Cron Jobs Not Running

**Symptoms**:
- Scheduled jobs not executing
- No logs in Vercel for cron execution

**Solutions**:

1. **Verify Vercel Plan**:
   - Cron jobs require Vercel Pro plan or higher
   - Free tier does not support cron jobs
   - Use external cron service as alternative

2. **Check Cron Configuration**:
   - Verify `vercel.json` has correct cron configuration
   - Check cron schedule format
   - Ensure path is correct

3. **Verify in Vercel Dashboard**:
   - Project → Settings → Cron Jobs
   - Check if cron jobs are listed
   - Verify next execution time

### Cron Jobs Failing

**Symptoms**:
- Cron jobs execute but fail
- Error logs in Vercel

**Solutions**:

1. **Check Authentication**:
   - Verify `CRON_SECRET` is set
   - Check Authorization header is correct

2. **Review Function Logs**:
   - Check Vercel logs for specific errors
   - Review error messages
   - Fix underlying issues

3. **Test Manually**:
   ```bash
   # Test daily sync manually
   curl -X GET https://your-app.vercel.app/api/cron/daily-sync \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

---

## Performance Issues

### Slow Queries

**Symptoms**:
- API responses take long time
- Database queries timeout
- High function execution time

**Solutions**:

1. **Add Database Indexes**:
   ```sql
   -- Example indexes
   CREATE INDEX idx_activities_time_utc ON activities(time_utc);
   CREATE INDEX idx_activities_agent_id ON activities(agent_id);
   CREATE INDEX idx_activity_sessions_start_time ON activity_sessions(start_time_utc);
   ```

2. **Optimize Queries**:
   - Use appropriate date ranges
   - Add filters to limit data
   - Use pagination for large datasets

3. **Review Query Plans**:
   - Use EXPLAIN in Supabase SQL editor
   - Identify slow queries
   - Optimize based on query plans

### High Function Execution Time

**Symptoms**:
- Functions approaching timeout limits
- High costs on Vercel

**Solutions**:

1. **Optimize Code**:
   - Reduce database queries
   - Use batch operations
   - Cache where appropriate

2. **Increase Timeout** (Pro plan):
   - Set `maxDuration` in route files
   - Default: 10s (Hobby), 300s (Pro)

3. **Break Down Operations**:
   - Split large operations into smaller chunks
   - Use background jobs for heavy processing

---

## Getting Help

If you encounter issues not covered here:

1. **Check Logs**:
   - Vercel Dashboard → Functions → Logs
   - Supabase Dashboard → Logs

2. **Review Documentation**:
   - `API_DOCUMENTATION.md`
   - `DEPLOYMENT.md`
   - `README.md`

3. **Common Resources**:
   - Vercel Status: https://vercel-status.com
   - Supabase Status: https://status.supabase.com
   - Jibble API Docs: https://docs.api.jibble.io

4. **Contact Support**:
   - Check error logs first
   - Provide specific error messages
   - Include relevant code snippets

