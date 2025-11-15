# Database Schema Updates - Multiple Groups per Client

## Overview
Updated the database schema to support **many-to-many relationship** between clients and Jibble groups, since a single client can be represented in multiple groups in Jibble.

## Schema Changes

### New Table: `clients`
Stores client information from Airtable:
- `id` (UUID, primary key)
- `airtable_record_id` (string, unique) - Airtable record ID for syncing
- `email` (string, unique) - Client email address
- `created_at` (timestamp)
- `updated_at` (timestamp)

### New Table: `client_group_mappings`
Junction table for many-to-many relationship:
- `id` (UUID, primary key)
- `client_id` (UUID, foreign key → clients)
- `client_group_id` (UUID, foreign key → client_groups)
- `created_at` (timestamp)
- Unique constraint on `(client_id, client_group_id)` to prevent duplicates

### Updated: `activities` table
Renamed fields to match Jibble Time Entries API:
- `jibble_activity_id` → `jibble_time_entry_id` (from TimeEntry.id)
- `start_time_utc` → `time_utc` (from TimeEntry.time)
- `activity_type` → `entry_type` ("In" or "Out")
- Added `belongs_to_date` (from TimeEntry.belongsToDate)
- Added `local_time` (from TimeEntry.localTime)
- Added `activity_id` (from TimeEntry.activityId - the activity type)

## Airtable Integration Updates

### Field Format Support
The `'Jibble Group ID'` field in Airtable can now be:
1. **Array** (multi-select field) - `["group-id-1", "group-id-2"]`
2. **Comma-separated string** - `"group-id-1, group-id-2"`
3. **Single value** - `"group-id-1"`

### Updated Functions
- `fetchClientEmails()` - Now returns `jibbleGroupIds: string[]` instead of single `jibbleGroupId`
- `getEmailToGroupsMap()` - New function returning `Map<string, string[]>` (one-to-many)
- `getEmailToGroupMap()` - Deprecated, kept for backward compatibility (returns first group only)
- `getClientsByGroup()` - Updated to handle multiple groups per client
- `getGroupsForClient(email)` - New function to get all groups for a specific client

## Data Flow

1. **Airtable Sync**: 
   - Read client records with `'Jibble Group ID'` field (supports multiple formats)
   - Parse into array of group IDs
   - Store in `clients` table
   - Create entries in `client_group_mappings` for each group

2. **Jibble Data Ingestion**:
   - Fetch time entries from Jibble (already linked to groups via members)
   - Store in `activities` table with `client_group_id`
   - When generating reports, aggregate across all groups for a client

3. **Report Generation**:
   - For a client email, look up all associated groups via `client_group_mappings`
   - Aggregate time entries from all those groups
   - Generate combined weekly report

## Migration Notes

When implementing:
1. Create `clients` table
2. Create `client_group_mappings` table
3. Migrate existing data (if any) from single-group to many-to-many
4. Update Airtable sync logic to handle multiple groups
5. Update report generation to aggregate across all groups

