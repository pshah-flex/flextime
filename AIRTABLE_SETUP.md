# Airtable Setup Guide

## Step 1: Create a Personal Access Token (PAT)

1. **Log in to Airtable**
   - Go to https://airtable.com and log in

2. **Access Developer Hub**
   - Click your profile icon (top-right corner)
   - Select "Developer hub" from the dropdown

3. **Create Personal Access Token**
   - Click "Personal access tokens" in the left sidebar
   - Click "Create new token"
   - Give it a name (e.g., "FlexTime Integration")
   - Select the required scopes:
     - `data.records:read` - To read client emails
     - `schema.bases:read` - To read base schema (optional but helpful)
   - Select the base(s) or workspace(s) that contain your client email data
   - Click "Create token"

4. **Copy and Store the Token**
   - ⚠️ **IMPORTANT**: Copy the token immediately - you won't be able to see it again!
   - Store it securely (we'll add it to environment variables)

## Step 2: Get Your Base ID

1. **Find Your Base**
   - Go to your Airtable base that contains client emails
   - The Base ID is in the URL: `https://airtable.com/BASE_ID/...`
   - Or go to: https://airtable.com/api and select your base to see the Base ID

2. **Identify the Table Name**
   - Note the table name that contains client emails
   - Note the field name that contains email addresses
   - Note the field name that maps to Jibble groups (if applicable)

## Step 3: Set Up Environment Variables

Once you have:
- Personal Access Token
- Base ID
- Table name
- Field names

We'll add these to your `.env.local` file (to be created when we set up the Next.js project).

## Example Airtable Base Structure

Your Airtable base should have a table with client information. Example structure:

| Email | Client Name | Jibble Group ID | Notes |
|-------|-------------|-----------------|-------|
| client1@example.com | Client 1 | group_123 | ... |
| client2@example.com | Client 2 | group_456 | ... |

## Next Steps

After you have the PAT and Base ID, we'll:
1. Install the Airtable JavaScript SDK
2. Create a helper function to fetch client emails
3. Map emails to Jibble groups
4. Integrate it into the weekly email job

