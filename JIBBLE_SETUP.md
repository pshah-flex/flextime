# Jibble API Setup Guide

## Step 1: Get API Credentials

1. **Log in to Jibble**
   - Go to https://app.jibble.io and log in
   - You must be a Jibble **owner or admin** to access API credentials

2. **Navigate to Organization Settings**
   - Click on "Organization" at the bottom left corner of the dashboard
   - Or go to your organization settings

3. **Access API Credentials**
   - Select the "API Credentials" tab
   - If you don't see this tab, you may not have admin/owner permissions

4. **Create a New API Secret**
   - Click on "Create New Secret" button
   - Provide a descriptive name (e.g., "FlexTime Integration")
   - Click "Save" to generate the credentials

5. **Copy Your Credentials**
   - A pop-up window will display:
     - **Client ID** (also called API Key ID)
     - **Client Secret** (also called API Secret)
   - ⚠️ **IMPORTANT**: Copy both values immediately - you won't be able to see the secret again!
   - Store them securely

## Step 2: Understand Jibble API Authentication

Jibble API uses OAuth 2.0 authentication. You'll need to:
1. Use your Client ID and Client Secret to get an access token
2. Use the access token to make API requests
3. Refresh the token when it expires

## Step 3: API Endpoints You'll Need

Based on your requirements, you'll likely need these endpoints:

- **Get Activities/Time Entries**: Fetch activity records for agents
- **Get Members/Agents**: Get list of team members
- **Get Groups**: Get client group information
- **Authentication**: Get access tokens

## Step 4: Store Credentials

Once you have your credentials, add them to your environment variables:

### Local Development (.env.local)
Add these variables:
```
JIBBLE_CLIENT_ID=your_client_id_here
JIBBLE_CLIENT_SECRET=your_client_secret_here
JIBBLE_API_URL=https://api.jibble.io
```

### Production (Vercel Dashboard)
Add the same variables in your Vercel project settings → Environment Variables

## Next Steps

After you have the credentials:
1. Share them with me (or add to `.env.local`)
2. We'll create the Jibble API client
3. Test the connection
4. Implement data fetching functions

## Resources

- Jibble API Documentation: Check your Jibble dashboard for API docs
- Support: https://www.jibble.io/support (if you need help accessing API credentials)

## Security Notes

- Never commit API credentials to git
- Store them in environment variables only
- Use different credentials for development and production if possible
- Rotate credentials periodically

