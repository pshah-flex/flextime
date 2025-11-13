1) Overview
1.1 Problem Statement
Flexscale has around 40 offshore agents who keep track of their work in Jibble, a time tracking tool that logs daily activity records. Each record indicates a start and stop point: the first one acts as the “clock-in” and the last one as the “clock-out.” Switching activities means the previous one has ended. Our clients want the ability to see insights on how much their agents are working and where they are spending their time so we are trying to provide them this data and analysis.

1.2 Objectives (What the system must do)
Direct Ingestion of Activities: Regularly pull activity events from the Jibble API and save them completely for auditing and reprocessing.
Durable Storage: Keep activity histories for each agent throughout their time with us, allowing for backfills and replays.
Reporting Foundation: Make it easy to aggregate hours by agent, by client group, and by activity to support weekly reports now and a client portal later.

1.3 Key Concepts & Definitions
Agent: A worker tracked in Jibble, equivalent to a “member” in Jibble. Each member in Jibble has a unique Member ID. 
Client Group (“Group”): A client account in Jibble identified by a Group Name and Group ID; some groups have one agent, others have three or more.
Activity: A labeled work block in Jibble with a start time (and an implied end when the next activity starts or the day ends).
Session (derived): A continuous period for a single activity; used to calculate hours.
Clock-in / Clock-out (derived): The first and last activity of the day for an agent, respectively, in their working timezone.

1.4 Scope In
Ingesting and storing Jibble activities
Normalizing time (UTC) and safely managing source timezones
Activity deduplication
Aggregations needed for weekly reports
Internal facing UI to see data per client and per agent

1.5 Scope Out (for now)
Payroll, billing, or cost calculations

1.6 Constraints & Assumptions
Jibble is the authoritative source for work logs.
Having multiple activities per agent per day is normal.
Timestamps will be stored in UTC, with source/local timezone tracked for display.
We expect historical data to reach hundreds of thousands to millions of rows, necessitating indexes and pagination.


1.7 Crucial Data
Agent/Person ID (connected to the Agent entity)
Activity Name & ID
Group Name, Group ID, Group Code
Timestamp (UTC)
Raw type (the “type” from Jibble event)
Raw payload for auditing



2) Goals & Success Metrics
Reliable Ingestion:
Scheduled pulling from Jibble API (like every 5–10 minutes) or use webhooks if they're available.
Ensure no duplicates by using the unique ID from Jibble activities along with a unique constraint in the database.
Store the raw source payload for audits and reprocessing in the future.


Durable, Query-Friendly Storage:
Normalize key entities: agents, client groups, and activities.
Keep timestamps in UTC along with the source/local timezone if it’s provided.
Create indexes on (agent_id, start_time_utc) and (jibble_activity_id) for quick queries and deduplication.


Aggregation for Reporting & Digest Emails:
Calculate hours per agent, per activity, per client group over a specified time (weekly).
Determine session boundaries (where one activity ends and the next begins or the day ends).
Identify incomplete sessions (those lacking an end) and include them in the digest “Notes.”

Technical implementation that we will use:
- Vercel for deployment
- Supabase for the database
- I'm not sure what we will use for Chron jobs, we will need to figure this out
- Airtable to get the client emails
- Jibble API to get client data for each client email
- For sending emails, we will either use Resend, Loops, or Mailgun