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

### Search Functionality for Clients

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

---

### Search Functionality for Agents

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

---
