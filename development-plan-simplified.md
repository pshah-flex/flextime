# FlexTime Development Plan - Simplified MVP

## Project Overview
Build a time tracking analytics system that ingests data from Jibble API, stores it durably, and provides reporting capabilities for Flexscale's ~40 offshore agents.

**MVP Goal**: Get the core functionality working - ingestion, storage, basic aggregations, simple UI, and weekly email reports.

## Progress Summary

### ✅ Completed Setup Tasks
- **Git Repository**: Connected to `git@github.com:pshah-flex/flextime.git`
- **Supabase Project**: Created and active ("pshah-flex's Project", ID: `xegtayaaifuxepntloct`)
- **Resend Email Service**: Chosen and MCP server configured with API key
- **Cron Job Solution**: Decision made - Using Vercel Cron Jobs
- **Project Documentation**: Requirements documented in `documentation.md`

### 🔄 In Progress
- None currently

### 📋 Next Up
- Set up Next.js/React project structure
- Configure Supabase connection strings and environment variables
- Connect repository to Vercel

---

## What Was Removed/Simplified for MVP

### Removed:
1. **`activity_sessions` table** - Compute sessions on-the-fly instead of storing them
2. **Clock-in/Clock-out detection** - Not essential for weekly reports
3. **Activity List View** - Raw payload viewing is debugging-focused, can defer
4. **Data Visualization/Charts** - Start with simple tables, add charts later
5. **Advanced Agent View** - Simplify to just show hours per agent
6. **Performance Testing** - Optimize later when needed
7. **Advanced Monitoring** - Start with basic logging, add Sentry later
8. **Unsubscribe handling** - Not in requirements
9. **Training/Handoff** - Can be done later

### Simplified:
1. **Query Optimization** - Basic indexes only, defer advanced caching/views
2. **Testing** - Basic testing of critical functions, comprehensive tests later
3. **Error Monitoring** - Basic logging first, advanced alerting later

---

## Phase 1: Project Setup & Infrastructure (Week 1)

### 1.1 Initialize Project Structure
- [ ] Set up Next.js/React project (Vercel-compatible)
- [ ] Configure TypeScript
- [ ] Set up environment variables structure
- [x] Initialize Git repository (Already connected to `git@github.com:pshah-flex/flextime.git`)
- [ ] Create project folder structure:
  ```
  /app
    /api (API routes)
    /components (UI components)
    /lib (utilities, helpers)
    /types (TypeScript definitions)
  /supabase (database schema/migrations)
  ```

### 1.2 Supabase Setup
- [x] Create Supabase project (Project: "pshah-flex's Project", ID: `xegtayaaifuxepntloct`, Status: ACTIVE_HEALTHY)
- [ ] Configure connection strings (will be done when Next.js project is set up)
- [ ] Set up environment variables for Supabase (will be done when Next.js project is set up)
- [ ] Test database connectivity (will be done when Next.js project is set up)

### 1.3 Vercel Configuration
- [ ] Connect repository to Vercel
- [ ] Configure build settings
- [ ] Set up environment variables in Vercel dashboard
- [ ] Test deployment pipeline

### 1.4 External Service Setup
- [ ] Obtain Jibble API credentials and documentation
- [ ] Set up Airtable base/API access
- [x] Choose email service: **Resend (chosen)** - MCP server configured
- [x] Obtain API keys: Resend API key obtained and configured in MCP
- [ ] Test API connections

### 1.5 Cron Job Solution Research & Setup
- [x] Research options: **Decision made - Using Vercel Cron Jobs**
  - ✅ Vercel Cron Jobs (chosen - native integration with Vercel)
- [ ] Implement Vercel Cron Jobs configuration (`vercel.json`)
- [ ] Test scheduled job execution

---

## Phase 2: Database Schema Design (Week 1-2)

### 2.1 Design Database Schema
Create tables in Supabase:

**agents**
- `id` (UUID, primary key)
- `jibble_member_id` (string, unique, indexed)
- `name` (string)
- `email` (string, optional)
- `timezone` (string, for display purposes)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**client_groups**
- `id` (UUID, primary key)
- `jibble_group_id` (string, unique, indexed)
- `group_name` (string)
- `group_code` (string, optional)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**activities**
- `id` (UUID, primary key)
- `jibble_activity_id` (string, unique, indexed) - for deduplication
- `agent_id` (UUID, foreign key → agents)
- `client_group_id` (UUID, foreign key → client_groups)
- `activity_name` (string)
- `activity_type` (string, from Jibble "type" field)
- `start_time_utc` (timestamp, indexed)
- `end_time_utc` (timestamp, nullable - derived when next activity starts)
- `source_timezone` (string, optional)
- `raw_payload` (JSONB) - full Jibble event for auditing
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Note**: Sessions will be computed on-the-fly from activities when needed for aggregations. No separate `activity_sessions` table.

### 2.2 Create Essential Indexes
- [ ] Index on `activities(agent_id, start_time_utc)` for agent queries
- [ ] Index on `activities(jibble_activity_id)` for deduplication
- [ ] Index on `activities(client_group_id, start_time_utc)` for group queries
- [ ] Index on `activities(start_time_utc)` for time-range queries
- [ ] Index on `agents(jibble_member_id)` for lookups
- [ ] Index on `client_groups(jibble_group_id)` for lookups

### 2.3 Set Up Database Constraints
- [ ] Unique constraint on `activities(jibble_activity_id)`
- [ ] Foreign key constraints
- [ ] Not null constraints where appropriate

### 2.4 Create Database Migration Scripts
- [ ] Write migration files (Supabase migrations)
- [ ] Test migrations on local/dev database
- [ ] Document schema decisions

---

## Phase 3: Core Data Models & Types (Week 2)

### 3.1 Define TypeScript Types
- [ ] Create types for:
  - Jibble API response structures
  - Agent entity
  - ClientGroup entity
  - Activity entity
  - API request/response types

### 3.2 Create Data Access Layer
- [ ] Build repository/service layer for database operations
- [ ] Implement CRUD operations for agents, groups, activities
- [ ] Add basic error handling and logging
- [ ] Create helper functions for timezone conversions

---

## Phase 4: Jibble API Integration (Week 2-3)

### 4.1 Jibble API Client
- [ ] Research Jibble API documentation
- [ ] Create API client wrapper
- [ ] Implement authentication
- [ ] Add basic retry logic and error handling

### 4.2 Data Fetching Functions
- [ ] Create function to fetch activities from Jibble
- [ ] Handle pagination if API supports it
- [ ] Implement incremental fetching (fetch only new/updated records)
- [ ] Add filtering by date range for backfills

### 4.3 Testing API Integration
- [ ] Test API calls with sample data
- [ ] Verify data structure matches expectations
- [ ] Test basic error scenarios

---

## Phase 5: Data Ingestion Pipeline (Week 3-4)

### 5.1 Ingestion Service
- [ ] Create ingestion service that:
  - Fetches data from Jibble API
  - Normalizes timestamps to UTC
  - Checks for duplicates using `jibble_activity_id`
  - Stores raw payload in `raw_payload` field
  - Links activities to agents and client groups

### 5.2 Agent & Group Sync
- [ ] Create function to sync agents from Jibble (create/update)
- [ ] Create function to sync client groups from Jibble
- [ ] Handle agent/group updates

### 5.3 Deduplication Logic
- [ ] Implement duplicate detection using `jibble_activity_id`
- [ ] Log duplicate attempts for monitoring

### 5.4 Session Derivation (On-the-fly)
- [ ] Create function to compute sessions from activities when needed:
  - Group activities by agent and day
  - Calculate end_time_utc (next activity start or day end)
  - Mark incomplete sessions (no end time)
  - Calculate duration
- **Note**: This will be computed in SQL queries, not stored in a separate table

### 5.5 Scheduled Ingestion Job
- [ ] Create API route or serverless function for ingestion
- [ ] Set up Vercel cron job to run every 5-10 minutes
- [ ] Add basic logging
- [ ] Implement idempotency (safe to run multiple times)

### 5.6 Backfill Capability
- [ ] Create script/endpoint to backfill historical data
- [ ] Support date range parameters
- [ ] Add basic progress tracking

---

## Phase 6: Aggregation & Reporting Logic (Week 4-5)

### 6.1 Aggregation Functions
Create functions to calculate:
- [ ] Hours per agent over time period
- [ ] Hours per activity over time period
- [ ] Hours per client group over time period
- [ ] Combined aggregations (agent + activity, group + activity, etc.)

### 6.2 Weekly Report Generation
- [ ] Create function to generate weekly summaries
- [ ] Aggregate by agent, activity, and client group
- [ ] Identify incomplete sessions (computed on-the-fly)
- [ ] Format data for email digest

### 6.3 Basic Query Optimization
- [ ] Ensure indexes are being used effectively
- [ ] Add basic pagination for large result sets

---

## Phase 7: Internal UI Development (Week 5-6) - Simplified

### 7.1 UI Framework Setup
- [ ] Set up basic UI (Tailwind CSS, simple components)
- [ ] Create basic layout components
- [ ] Set up routing (Next.js App Router)

### 7.2 Dashboard Page
- [ ] Create main dashboard view
- [ ] Display summary statistics:
  - Total agents
  - Total hours this week
  - Active client groups
  - Recent activities (simple list)

### 7.3 Client Group View
- [ ] Create page to view data by client group
- [ ] Show agents in group
- [ ] Display hours per agent (simple table)
- [ ] Display activity breakdown (simple table)
- [ ] Add basic date range filter

### 7.4 Simplified Agent View
- [ ] Create page to view individual agent data
- [ ] Display hours per activity (simple table)
- [ ] Show incomplete sessions (simple list)
- [ ] Add basic date range filter

**Removed**: Daily activity timeline, clock-in/clock-out times (can add later if needed)

---

## Phase 8: Email Digest System (Week 6-7)

### 8.1 Airtable Integration
- [ ] Create function to fetch client emails from Airtable
- [ ] Map client emails to Jibble groups
- [ ] Handle basic updates to client list

### 8.2 Email Template Design
- [ ] Design simple weekly digest email template
- [ ] Include:
  - Summary statistics
  - Hours per agent
  - Hours per activity
  - Incomplete sessions (Notes section)
  - Time period covered

### 8.3 Email Service Integration
- [x] Choose email service: **Resend (already chosen in Phase 1.4)**
- [ ] Integrate Resend API/SDK into application
- [ ] Create email sending function
- [ ] Add basic error handling and retry logic

**Removed**: Unsubscribe handling (not in requirements)

### 8.4 Weekly Email Job
- [ ] Create scheduled job to generate and send weekly emails
- [ ] Run on specified day/time (e.g., Monday morning)
- [ ] Generate report for previous week
- [ ] Send to all clients from Airtable
- [ ] Log email sends and failures

---

## Phase 9: Testing & Quality Assurance (Week 7-8) - Simplified

### 9.1 Basic Testing
- [ ] Test critical functions:
  - Data normalization
  - Deduplication logic
  - Aggregation calculations
  - Timezone conversions

### 9.2 Integration Testing
- [ ] Test API integrations (Jibble, Airtable, Email)
- [ ] Test database operations
- [ ] Test cron job execution

### 9.3 Basic Error Handling
- [ ] Add basic error logging
- [ ] Add health check endpoint

**Removed**: 
- Comprehensive unit tests (can add later)
- Advanced error monitoring (Sentry, etc.) - add later
- Performance testing - optimize later

---

## Phase 10: Deployment & Documentation (Week 8)

### 10.1 Production Deployment
- [ ] Deploy to Vercel production
- [ ] Use existing Supabase project (or set up production instance)
- [ ] Configure production environment variables
- [ ] Test production deployment

### 10.2 Database Migration to Production
- [ ] Run migrations on production database
- [ ] Verify schema is correct
- [ ] Set up basic database backups

### 10.3 Basic Monitoring
- [ ] Add basic application logging
- [ ] Monitor cron job execution (Vercel logs)

**Removed**: 
- Advanced monitoring services
- Complex alerting system
- Training/Handoff (can be done later)

### 10.4 Basic Documentation
- [ ] Document environment variables
- [ ] Document deployment process
- [ ] Create basic troubleshooting guide

**Removed**: 
- Comprehensive API documentation (can add later)
- User guide (can add later)
- Runbook (can add later)

---

## Technical Decisions

### Cron Jobs
**✅ Decision: Vercel Cron Jobs (Chosen)**
- Native integration with Vercel
- Free tier available
- Easy configuration via `vercel.json`

### Email Service
**✅ Decision: Resend (Chosen & Configured)**
- Developer-friendly API
- Good free tier
- MCP server configured and ready to use

### Database ORM/Query Builder
- Use Supabase client directly (simpler for MVP)

### UI Framework
- Next.js with App Router (recommended for Vercel)
- Basic Tailwind CSS for styling
- Simple components (no complex UI library needed for MVP)

---

## Success Criteria (MVP)

- [ ] Successfully ingests data from Jibble every 5-10 minutes
- [ ] Zero duplicate activities in database
- [ ] All raw payloads stored for auditing
- [ ] Aggregations calculate correctly
- [ ] Incomplete sessions identified and reported
- [ ] Basic internal UI displays data accurately
- [ ] Weekly emails sent successfully to all clients
- [ ] All timezone conversions accurate

---

## Timeline Summary (Simplified MVP)

- **Week 1**: Setup, Infrastructure, Database Schema
- **Week 2**: Data Models, Jibble Integration
- **Week 3**: Ingestion Pipeline
- **Week 4**: Aggregation & Reporting
- **Week 5**: Basic Internal UI
- **Week 6**: Email Digest System
- **Week 7**: Basic Testing & Deployment
- **Week 8**: Polish & Documentation

**Total Estimated Time: 6-8 weeks** (reduced from original 8 weeks due to simplifications)

---

## Next Steps

1. ✅ Project repository set up and connected
2. ✅ Supabase project created
3. ✅ Resend MCP server configured
4. ✅ Technical decisions made (Vercel Cron Jobs, Resend)
5. **Next**: Set up Next.js/React project structure (Phase 1.1)
6. **Next**: Configure Supabase connection and environment variables (Phase 1.2)
7. **Next**: Connect repository to Vercel (Phase 1.3)

