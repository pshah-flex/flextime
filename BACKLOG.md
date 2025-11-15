# Backlog

## Date Calculation Issue

### Issue
The weekly report period calculation is currently returning `Nov 2-9` instead of the expected `Nov 2-8` for the previous week (Sunday to Saturday).

### Current Behavior
- When calculating the previous week ending Saturday, the calculation returns Saturday Nov 9 instead of Saturday Nov 8
- This affects:
  - `generatePreviousWeekReport()` in `app/lib/services/weekly-report.ts`
  - `runWeeklyEmailJob()` in `app/lib/services/weekly-email-job.ts`
  - `test-all-clients.ts` script

### Expected Behavior
- The period should always be Sunday to Saturday of the previous complete week
- For example, if today is Friday Nov 15, the previous week should be Nov 2 (Sunday) to Nov 8 (Saturday)

### Root Cause
The date calculation logic attempts to find the previous week's Saturday by:
1. Finding the current week's Saturday
2. Going back 8 days
3. Finding the Saturday of that week

However, this logic still returns Nov 9 instead of Nov 8, possibly due to timezone handling or edge cases in the date arithmetic.

### Files Affected
- `app/lib/services/weekly-report.ts` (lines 257-336)
- `app/lib/services/weekly-email-job.ts` (lines 72-112, 158-209)
- `scripts/test-all-clients.ts` (lines 94-124)

### Notes
- The email date formatting has been fixed to use UTC parsing (see `app/lib/services/email.service.ts`)
- The actual data and reports are correct; only the period calculation needs adjustment
- May need to verify timezone handling and ensure consistent UTC usage throughout

### Priority
Low - The system is functional, but the date range displayed may be off by one day. This can be addressed when time permits.

---

## UI Improvements

### Search Functionality for Clients ✅ COMPLETE

**Request:** Add the ability to search for a Client (Group) on the Clients page.

**Current Behavior:**
- Clients page displays all client groups in a list
- No search or filter functionality available
- Users must scroll through entire list to find a specific client

**Expected Behavior:**
- Add a search input field on the Clients page
- Allow users to search by client group name
- Filter the list in real-time as user types
- Show "No results found" message when search returns no matches

**Implementation Notes:**
- Can be implemented as a simple client-side filter on the existing list
- Use case-insensitive search
- Consider partial matching (e.g., "111" matches "111 Hospitality")
- May want to add debouncing for performance if list grows large

**Files to Modify:**
- `app/groups/page.tsx` - Add search input and filter logic

**Priority:**
Medium - Improves user experience when managing multiple clients

**Status:** ✅ Completed - Search input added with case-insensitive partial matching, real-time filtering, and empty state handling.

---

### Search Functionality for Agents ✅ COMPLETE

**Request:** Add the ability to search for an Agent on the Agents page.

**Current Behavior:**
- Agents page displays all agents in a list
- No search or filter functionality available
- Users must scroll through entire list to find a specific agent

**Expected Behavior:**
- Add a search input field on the Agents page
- Allow users to search by agent name or email
- Filter the list in real-time as user types
- Show "No results found" message when search returns no matches

**Implementation Notes:**
- Can be implemented as a simple client-side filter on the existing list
- Use case-insensitive search
- Consider partial matching for both name and email
- Search should work on full name, first name, last name, and email
- May want to add debouncing for performance if list grows large

**Files to Modify:**
- `app/agents/page.tsx` - Add search input and filter logic

**Priority:**
Medium - Improves user experience when managing multiple agents

**Status:** ✅ Completed - Search input added with case-insensitive partial matching by name or email, real-time filtering, and empty state handling.

---

### Rename "Hours by Agent" to "Total Hours by Agent" ✅ COMPLETE

**Request:** Change the label "Hours by Agent" to "Total Hours by Agent" on the Clients page.

**Current Behavior:**
- Clients page displays a section titled "Hours by Agent"
- This shows total hours worked by each agent for the selected client group

**Expected Behavior:**
- Change the section title from "Hours by Agent" to "Total Hours by Agent"
- This better reflects that it shows aggregated/total hours per agent

**Implementation Notes:**
- Simple text change in the UI
- Update the heading in the Clients page component
- No functionality changes needed

**Files to Modify:**
- `app/groups/page.tsx` - Update section heading text (line 170)

**Priority:**
Low - Simple label change to improve clarity

**Status:** ✅ Completed - Section heading updated from "Hours by Agent" to "Total Hours by Agent" on the Clients page.

---

### Add "Hours per Agent per Day" Section

**Request:** Add a new section "Hours per Agent per Day" on the Clients page with a column chart.

**Current Behavior:**
- Clients page shows:
  - Summary statistics
  - Hours by Agent (pie chart and table)
  - Hours by Activity
  - Agents list

**Expected Behavior:**
- Add a new section titled "Hours per Agent per Day"
- Display a column chart with:
  - X-axis: Days (formatted as "11/2", "11/3", etc. - M/D format)
  - Y-axis: Number of hours
  - Columns: Each agent's hours for that day (grouped or stacked columns)
  - Legend: Show which color represents which agent
- Show hours worked per agent per day within the selected date range

**Implementation Notes:**
- Use Recharts library (already used in the app)
- Data structure needed:
  - For each day in the date range
  - For each agent in the client group
  - Total hours worked that day
- May need to create a new aggregation function `getHoursByAgentAndDay()` or similar
- Consider using grouped columns (one column per agent per day) or stacked columns
- Include legend to identify agents by color
- Handle cases where agents have no hours on certain days
- Format dates as "M/D" (e.g., "11/2") or "MM/DD" if preferred
- Dates should be formatted consistently with existing date displays

**Data Requirements:**
- Need to aggregate `activity_sessions` table by:
  - `client_group_id` (filter by selected client group)
  - `agent_id` (group by agent)
  - Date of `start_time_utc` (group by day)
  - Sum `duration_minutes` and convert to hours

**Data Structure:**
```typescript
interface HoursByAgentAndDay {
  date: string; // YYYY-MM-DD
  date_formatted: string; // "11/2"
  agent_id: string;
  agent_name: string;
  total_hours: number;
  total_minutes: number;
}
```

**Files to Modify:**
- `app/groups/page.tsx` - Add new section with column chart
- `app/lib/services/aggregations.ts` - Add `getHoursByAgentAndDay()` function
- `app/lib/api-client.ts` - Add API client function (if needed)

**Chart Implementation:**
- Use Recharts `BarChart` with grouped or stacked bars
- Each day on X-axis (formatted as "11/2")
- Each agent gets a bar/segment for each day
- Legend shows agent names with colors
- Handle empty data gracefully

**Priority:**
Medium - Adds valuable visualization for daily agent activity patterns

---
