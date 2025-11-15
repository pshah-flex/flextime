# Vercel Environment Variables - Quick Reference

## Setup Instructions

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your FlexTime project
3. Go to **Settings** → **Environment Variables**
4. Add each variable below (click "Add New" for each)
5. Select **Production**, **Preview**, and **Development** environments
6. Click "Save" after each variable

## Required Environment Variables (10)

### Supabase
1. **Key**: `NEXT_PUBLIC_SUPABASE_URL`  
   **Value**: `https://xegtayaaifuxepntloct.supabase.co`

2. **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
   **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlZ3RheWFhaWZ1eGVwbnRsb2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzk5NzQsImV4cCI6MjA3ODY1NTk3NH0.CE5bGrgKwChYMbyG6GqCi77Rp3P8uH43kyHS0_TXumo`

3. **Key**: `SUPABASE_SERVICE_ROLE_KEY`  
   **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlZ3RheWFhaWZ1eGVwbnRsb2N0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3OTk3NCwiZXhwIjoyMDc4NjU1OTc0fQ.FsfvIvpIBegOPmBR7yggHOYbda4-DeGDZm6mskpGjkk`

### Jibble API
4. **Key**: `JIBBLE_CLIENT_ID`  
   **Value**: `f650b933-9a8b-49f0-8be3-3656230264df`

5. **Key**: `JIBBLE_CLIENT_SECRET`  
   **Value**: `7QI5ylOE5fNIvRl1fAeLbVLptnAHmAZxCseYoxnf701ruCVT`

6. **Key**: `JIBBLE_API_URL`  
   **Value**: `https://workspace.prod.jibble.io`

7. **Key**: `JIBBLE_IDENTITY_URL`  
   **Value**: `https://identity.prod.jibble.io/connect/token`

8. **Key**: `JIBBLE_TIME_TRACKING_URL`  
   **Value**: `https://time-tracking.prod.jibble.io`

### Airtable
9. **Key**: `AIRTABLE_PERSONAL_ACCESS_TOKEN`  
   **Value**: (Get from Airtable Dashboard → Settings → Developer → Personal Access Tokens)

10. **Key**: `AIRTABLE_BASE_ID`  
    **Value**: `appvhgZiUha2A1OQg`

## Optional Environment Variables (for Phase 8)

11. **Key**: `RESEND_API_KEY`  
    **Value**: `re_i7s2UZLP_L6LLe2Zx6oyUEeB1qXB2ZVD8`

12. **Key**: `CRON_SECRET`  
    **Value**: `+ZNSzfxczVba69V8vnz4QMfMgvqyLD7x9tnci3MZ0fg=`  
    **Note**: You can generate your own with `openssl rand -base64 32`

## After Adding Variables

1. Vercel will automatically trigger a new deployment
2. Check the deployment logs to ensure all variables are loaded
3. Test your application to verify everything works

## Troubleshooting

- **Build fails with "Missing environment variable"**: Double-check all required variables are added
- **API endpoints fail**: Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- **Database connection errors**: Ensure both Supabase URLs and keys are correct
- **Jibble API errors**: Verify all Jibble credentials are correct

