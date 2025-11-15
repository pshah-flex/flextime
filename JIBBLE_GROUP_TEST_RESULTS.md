# Jibble Group Test Results - 111 Hospitality

## Test Date
2025-01-XX

## Group Information
- **Name**: 111 Hospitality
- **Group ID**: `0c04e7ff-ec5b-4bba-8951-a7b2b99c4af3`
- **Organization ID**: `de5931f7-fb15-4538-a298-712989fe3c00` (Flexscale.com)
- **Status**: Active

## Findings

### ✅ Groups Endpoint
- **Endpoint**: `GET /v1/Groups`
- **Status**: Working
- **Total Groups**: 26 groups found
- **Target Group**: Found successfully

### ✅ Members
- **Endpoint**: `GET /v1/People`
- **Status**: Working
- **Total Members**: 76 members
- **Members in Group**: 1 member found
  - Member ID: `d9fbac9d-9285-45c5-8c8e-4954205165ed`
  - Members have `groupId` field that can be used to filter

### ⚠️ Activities Endpoint
- **Endpoint**: `GET /v1/Activities`
- **Status**: Working, but returns **activity types** (templates), not time entries
- **Total Activity Types**: 139 activity types
- **Note**: These are activity definitions/templates, not actual time tracking records

### ✅ Time Entries Endpoint
- **Endpoint**: `GET /v1/TimeEntries`
- **Base URL**: `https://time-tracking.prod.jibble.io` (different from workspace API)
- **Documentation**: https://docs.api.jibble.io/#6fdcad3f-c904-4dcf-b10f-c453a6ee4dbd
- **Status**: ✅ Working
- **Response Format**: OData (`{ value: [...] }`)

**Test Results:**
- ✅ Successfully fetched 39 time entries for group "111 Hospitality" in last 30 days
- ✅ Total hours tracked: 176.95 hours
- ✅ Filtering works with `personId` (GUID format, no quotes) and `time` field (for date range)

**Key Field Names:**
- `time` - The timestamp of the clock in/out (not `startTime`/`endTime`)
- `type` - "In" or "Out" to indicate clock in or clock out
- `personId` - GUID of the person (not a string, format without quotes in OData filters)
- `groupId` - Not directly available, filter by `personId` instead
- `belongsToDate` - The date this entry belongs to
- `activityId` - The activity type ID

## Data Structure Notes

### Group Structure
```json
{
  "id": "0c04e7ff-ec5b-4bba-8951-a7b2b99c4af3",
  "name": "111 Hospitality",
  "organizationId": "de5931f7-fb15-4538-a298-712989fe3c00",
  "status": "Active"
}
```

### Member Structure
- Members have a `groupId` field that links them to groups
- Sample member fields include: `id`, `groupId`, `fullName`, `email`, `organizationId`, `latestTimeEntryTime`, etc.

### Activity Type Structure
- Activity types are templates/definitions
- They have `assignedGroups` array (currently empty for most)
- Fields include: `id`, `name`, `code`, `description`, `organizationId`, `status`

