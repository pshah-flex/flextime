# Jibble API Endpoints - CONFIRMED ✅

## Base URLs
- **Workspace API**: `https://workspace.prod.jibble.io`
- **Time Tracking API**: `https://time-tracking.prod.jibble.io`
- **Identity Server**: `https://identity.prod.jibble.io`

## Endpoints

### Organizations
- **Endpoint**: `GET /v1/Organizations`
- **Full URL**: `https://workspace.prod.jibble.io/v1/Organizations`
- **Documentation**: https://docs.api.jibble.io/#ab6daceb-b629-48e6-9225-8151106863d7
- **Status**: ✅ Working
- **Response Format**: OData (`{ value: [...] }`)

### People (Members)
- **Endpoint**: `GET /v1/People`
- **Full URL**: `https://workspace.prod.jibble.io/v1/People`
- **Documentation**: https://docs.api.jibble.io/#db777356-4da5-48ad-8f3a-c30ef1ee82a1
- **Status**: ✅ Working
- **Response Format**: OData (`{ value: [...] }`)

### Activities (Activity Types)
- **Endpoint**: `GET /v1/Activities`
- **Full URL**: `https://workspace.prod.jibble.io/v1/Activities`
- **Documentation**: https://docs.api.jibble.io/#e8724177-6ded-47b6-a7b3-1ec1b30b93e6
- **Status**: ✅ Working
- **Response Format**: OData (`{ value: [...] }`)
- **Note**: This endpoint returns activity types/templates, not actual time entries
- **Filtering**: Supports OData `$filter` queries

### Time Entries (Actual Clock Records)
- **Endpoint**: `GET /v1/TimeEntries`
- **Full URL**: `https://time-tracking.prod.jibble.io/v1/TimeEntries`
- **Documentation**: https://docs.api.jibble.io/#6fdcad3f-c904-4dcf-b10f-c453a6ee4dbd
- **Status**: ✅ Working
- **Response Format**: OData (`{ value: [...] }`)
- **Filtering**: Supports OData `$filter` queries
  - Example: `?$filter=startTime ge '2024-01-01' and endTime le '2024-01-31' and groupId eq 'group-id'`
  - Filter by `personId`, `groupId`, `startTime`, `endTime`

## Authentication
- **Token Endpoint**: `POST https://identity.prod.jibble.io/connect/token`
- **Method**: OAuth 2.0 Client Credentials
- **Request Body**: `application/x-www-form-urlencoded`
  - `client_id`: Your Client ID
  - `client_secret`: Your Client Secret
  - `grant_type`: `client_credentials`
  - `scope`: `api1`
- **Response**: 
  ```json
  {
    "access_token": "...",
    "expires_in": 3600,
    "token_type": "Bearer",
    "scope": "api1",
    "organizationId": "...",
    "personId": "..."
  }
  ```
- **Usage**: Include `Authorization: Bearer {access_token}` header in API requests

## OData Format
Jibble API uses OData format. Responses are wrapped:
```json
{
  "@odata.context": "https://workspace.prod.jibble.io/v1/$metadata#Organizations",
  "value": [
    { /* item 1 */ },
    { /* item 2 */ }
  ],
  "@odata.count": 2
}
```

The `value` array contains the actual data.
