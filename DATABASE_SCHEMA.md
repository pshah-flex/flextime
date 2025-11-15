# Database Schema

## Overview
Database schema created successfully in Supabase project `xegtayaaifuxepntloct`.

## Tables Created

### 1. `agents`
Stores agent/member information from Jibble.
- **Primary Key**: `id` (UUID)
- **Unique**: `jibble_member_id`
- **Indexes**: `jibble_member_id`

### 2. `client_groups`
Stores Jibble group information.
- **Primary Key**: `id` (UUID)
- **Unique**: `jibble_group_id`
- **Indexes**: `jibble_group_id`

### 3. `clients`
Stores client information from Airtable.
- **Primary Key**: `id` (UUID)
- **Unique**: `email`, `airtable_record_id`
- **Indexes**: `email`, `airtable_record_id`

### 4. `client_group_mappings`
Junction table for many-to-many relationship between clients and groups.
- **Primary Key**: `id` (UUID)
- **Unique**: `(client_id, client_group_id)`
- **Foreign Keys**: `client_id` → `clients.id`, `client_group_id` → `client_groups.id`
- **Indexes**: `client_id`, `client_group_id`, composite `(client_id, client_group_id)`

### 5. `activities`
Stores time entries from Jibble API.
- **Primary Key**: `id` (UUID)
- **Unique**: `jibble_time_entry_id` (for deduplication)
- **Foreign Keys**: `agent_id` → `agents.id`, `client_group_id` → `client_groups.id`
- **Check Constraint**: `entry_type` must be 'In' or 'Out'
- **Indexes**: 
  - `jibble_time_entry_id`
  - `(agent_id, time_utc)`
  - `(client_group_id, time_utc)`
  - `time_utc`
  - `belongs_to_date`

### 6. `activity_sessions`
Stores derived/computed session data from activities.
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `activity_id` → `activities.id`, `agent_id` → `agents.id`, `client_group_id` → `client_groups.id`
- **Indexes**: `agent_id`, `client_group_id`, `start_time_utc`

## Features

### Auto-update Timestamps
All tables with `updated_at` columns have triggers that automatically update the timestamp on row updates.

### Foreign Key Constraints
All foreign keys have `ON DELETE CASCADE` to maintain referential integrity.

## Security Notes

⚠️ **Row Level Security (RLS) is currently disabled** on all tables. This is acceptable for an internal application using service role keys, but should be enabled for production with appropriate policies.

### Recommended Next Steps:
1. Enable RLS on all tables
2. Create policies that allow service role full access
3. Add policies for any public-facing endpoints (if needed)

## Migration Details

- **Migration Name**: `create_initial_schema`
- **Applied**: ✅ Successfully
- **Tables Created**: 6
- **Indexes Created**: 15
- **Constraints**: All unique, foreign key, and check constraints applied

