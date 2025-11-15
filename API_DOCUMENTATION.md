# FlexTime API Documentation

## Overview

FlexTime provides RESTful API endpoints for data ingestion, aggregation, reporting, and email functionality. All endpoints are served at `/api/*` paths.

## Base URL

- **Production**: `https://your-app.vercel.app/api`
- **Development**: `http://localhost:3000/api`

## Authentication

Most endpoints are publicly accessible. Cron job endpoints require authentication via the `Authorization` header:

```
Authorization: Bearer YOUR_CRON_SECRET
```

The `CRON_SECRET` value should match the `CRON_SECRET` environment variable.

---

## Data Ingestion Endpoints

### POST /api/ingest

Manually trigger data ingestion from Jibble.

**Request Body** (optional):
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "groupIds": ["group-id-1", "group-id-2"],
  "syncAgents": true,
  "syncGroups": true,
  "deriveSessions": false,
  "dryRun": false
}
```

**Query Parameters** (GET request):
- `startDate` - Start date (YYYY-MM-DD)
- `endDate` - End date (YYYY-MM-DD)
- `groupIds` - Comma-separated group IDs
- `syncAgents` - Sync agents (default: true)
- `syncGroups` - Sync groups (default: true)
- `deriveSessions` - Derive sessions (default: false)
- `dryRun` - Dry run mode (default: false)

**Response**:
```json
{
  "success": true,
  "timestamp": "2024-01-15T10:00:00.000Z",
  "result": {
    "agents": { "synced": 50, "errors": 0 },
    "groups": { "synced": 10, "errors": 0 },
    "timeEntries": {
      "fetched": 1000,
      "inserted": 950,
      "skipped": 50,
      "errors": 0,
      "duplicates": 0
    },
    "sessions": {
      "derived": 500,
      "errors": 0
    }
  }
}
```

**Example**:
```bash
# POST request
curl -X POST https://your-app.vercel.app/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }'

# GET request
curl "https://your-app.vercel.app/api/ingest?startDate=2024-01-01&endDate=2024-01-31"
```

---

## Cron Job Endpoints

### GET /api/cron/ingest

Automated ingestion endpoint (runs every 10 minutes). Requires `CRON_SECRET` authentication.

**Headers**:
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Response**: Same as `/api/ingest`

---

### GET /api/cron/daily-sync

Daily sync endpoint (runs daily at 5 AM Pacific Time). Syncs previous day's data.

**Headers**:
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Response**:
```json
{
  "success": true,
  "date": "2024-01-14",
  "agents": { "synced": 50, "errors": 0 },
  "groups": { "synced": 10, "errors": 0 },
  "timeEntries": {
    "fetched": 500,
    "inserted": 480,
    "skipped": 20,
    "errors": 0,
    "duplicates": 0
  },
  "sessions": {
    "derived": 240,
    "inserted": 235,
    "skipped": 5,
    "errors": 0
  }
}
```

**Manual Trigger (POST)**:
```bash
curl -X POST https://your-app.vercel.app/api/cron/daily-sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"targetDate": "2024-01-14"}'
```

---

### GET /api/cron/weekly-email

Weekly email digest endpoint (runs Monday at 6 AM Pacific Time). Sends weekly reports to clients.

**Headers**:
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Response**:
```json
{
  "success": true,
  "timestamp": "2024-01-15T10:00:00.000Z",
  "result": {
    "clientsSynced": 5,
    "reportsGenerated": 5,
    "emailsSent": 5,
    "emailsFailed": 0
  }
}
```

---

## Aggregation Endpoints

### GET /api/aggregations

Get various aggregations and statistics.

**Query Parameters**:
- `type` - Aggregation type (required):
  - `summary` - Summary statistics
  - `hoursByAgent` - Hours by agent
  - `hoursByActivity` - Hours by activity
  - `hoursByClientGroup` - Hours by client group
  - `hoursByAgentAndActivity` - Hours by agent and activity
  - `hoursByGroupAndActivity` - Hours by group and activity
- `startDate` - Start date (YYYY-MM-DD, required)
- `endDate` - End date (YYYY-MM-DD, required)
- `agentIds` - Comma-separated agent IDs (optional)
- `clientGroupIds` - Comma-separated client group IDs (optional)
- `activityIds` - Comma-separated activity IDs (optional)
- `includeIncomplete` - Include incomplete sessions (default: true)

**Example - Summary Statistics**:
```bash
curl "https://your-app.vercel.app/api/aggregations?type=summary&startDate=2024-01-01&endDate=2024-01-31"
```

**Response**:
```json
{
  "success": true,
  "type": "summary",
  "options": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "result": {
    "totalHours": 1200.5,
    "totalSessions": 500,
    "uniqueAgents": 25,
    "uniqueGroups": 5,
    "uniqueActivities": 10,
    "incompleteSessions": 5
  }
}
```

**Example - Hours by Agent**:
```bash
curl "https://your-app.vercel.app/api/aggregations?type=hoursByAgent&startDate=2024-01-01&endDate=2024-01-31"
```

**Response**:
```json
{
  "success": true,
  "type": "hoursByAgent",
  "result": [
    {
      "agentId": "agent-1",
      "agentName": "John Doe",
      "totalHours": 160.5,
      "totalSessions": 80,
      "clientGroupId": "group-1",
      "clientGroupName": "Client A"
    }
  ]
}
```

---

## Reporting Endpoints

### GET /api/reports/weekly

Generate weekly reports for clients.

**Query Parameters**:
- `clientEmail` - Client email address (optional, if omitted returns all clients)
- `startDate` - Start date (YYYY-MM-DD, required unless `previousWeek=true`)
- `endDate` - End date (YYYY-MM-DD, required unless `previousWeek=true`)
- `previousWeek` - Generate report for previous week (default: false)

**Example - Previous Week Report for All Clients**:
```bash
curl "https://your-app.vercel.app/api/reports/weekly?previousWeek=true"
```

**Example - Specific Client for Date Range**:
```bash
curl "https://your-app.vercel.app/api/reports/weekly?clientEmail=client@example.com&startDate=2024-01-01&endDate=2024-01-07"
```

**Response** (single client):
```json
{
  "success": true,
  "report": {
    "clientEmail": "client@example.com",
    "periodStart": "2024-01-01",
    "periodEnd": "2024-01-07",
    "totalHours": 500.5,
    "totalSessions": 250,
    "uniqueAgents": 10,
    "hoursByAgent": [...],
    "hoursByActivity": [...],
    "hoursByDay": [...],
    "incompleteSessions": 2
  }
}
```

**Response** (all clients):
```json
{
  "success": true,
  "reports": [
    {
      "clientEmail": "client1@example.com",
      "periodStart": "2024-01-01",
      "periodEnd": "2024-01-07",
      ...
    },
    {
      "clientEmail": "client2@example.com",
      ...
    }
  ],
  "count": 2
}
```

---

## Clock-in/Clock-out Endpoints

### GET /api/clock-in-out

Get clock-in/clock-out records for agents.

**Query Parameters**:
- `startDate` - Start date (YYYY-MM-DD, required unless `date` is provided)
- `endDate` - End date (YYYY-MM-DD, required unless `date` is provided)
- `date` - Single date (YYYY-MM-DD, alternative to date range)
- `agentId` - Agent ID (optional)
- `clientGroupId` - Client group ID (optional)
- `timezone` - Timezone for display (optional)

**Example**:
```bash
curl "https://your-app.vercel.app/api/clock-in-out?startDate=2024-01-01&endDate=2024-01-31&agentId=agent-1"
```

**Response**:
```json
{
  "success": true,
  "count": 50,
  "records": [
    {
      "agentId": "agent-1",
      "agentName": "John Doe",
      "date": "2024-01-15",
      "clockIn": "2024-01-15T09:00:00Z",
      "clockOut": "2024-01-15T17:00:00Z",
      "clientGroupId": "group-1",
      "clientGroupName": "Client A",
      "timezone": "America/Los_Angeles"
    }
  ]
}
```

---

## Email Endpoints

### POST /api/email/weekly

Manually trigger weekly email job.

**Request Body** (optional):
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-01-07",
  "previousWeek": true,
  "syncClients": true,
  "fromEmail": "notifications@flexscale.com",
  "replyTo": "support@flexscale.com"
}
```

**Query Parameters** (GET request):
- GET request triggers previous week report by default

**Example**:
```bash
# POST request
curl -X POST https://your-app.vercel.app/api/email/weekly \
  -H "Content-Type: application/json" \
  -d '{"previousWeek": true}'

# GET request (triggers previous week)
curl "https://your-app.vercel.app/api/email/weekly"
```

**Response**:
```json
{
  "success": true,
  "timestamp": "2024-01-15T10:00:00.000Z",
  "result": {
    "clientsSynced": 5,
    "reportsGenerated": 5,
    "emailsSent": 5,
    "emailsFailed": 0,
    "results": [
      {
        "clientEmail": "client@example.com",
        "success": true,
        "messageId": "msg-123"
      }
    ]
  }
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**Common HTTP Status Codes**:
- `200` - Success
- `400` - Bad Request (missing required parameters)
- `401` - Unauthorized (invalid CRON_SECRET)
- `500` - Internal Server Error

---

## Rate Limiting

Currently, no rate limiting is implemented. However, please use endpoints responsibly:
- Cron endpoints should only be called by Vercel Cron Jobs
- Manual endpoints can be called as needed but be mindful of API quotas

---

## Data Formats

### Date Format

All dates should be in `YYYY-MM-DD` format (ISO 8601 date format).

Examples:
- `2024-01-15`
- `2024-12-31`

### Timezone Handling

- All timestamps stored in database are in UTC
- All API responses include UTC timestamps
- Optional `timezone` parameter can be used for display purposes in clock-in/out endpoints

---

## Best Practices

1. **Use Date Ranges Efficiently**: Only request data for the date range you need
2. **Handle Errors Gracefully**: Always check the `success` field in responses
3. **Monitor Rate Limits**: Be aware of Jibble API rate limits when triggering manual ingestion
4. **Use Appropriate Endpoints**: 
   - Use `/api/ingest` for historical backfills
   - Use `/api/cron/daily-sync` for daily incremental syncs
   - Use aggregation endpoints for reporting queries

---

## Support

For issues or questions:
1. Check the troubleshooting guide: `TROUBLESHOOTING.md`
2. Review deployment documentation: `DEPLOYMENT.md`
3. Check error logs in Vercel dashboard

