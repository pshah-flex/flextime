# FlexTime Internal UI User Guide

## Overview

The FlexTime Internal UI provides a comprehensive dashboard for viewing time tracking data, agent performance, client group analytics, and activity breakdowns. The interface is accessible to authorized team members.

## Access

**URL**: `https://your-app.vercel.app`

No authentication is currently required. The UI is accessible to anyone with the URL.

## Navigation

The main navigation bar includes:
- **Dashboard** - Overview of time tracking data
- **Clients** - View data by client group
- **Agents** - View individual agent data
- **Activities** - View all activity entries

---

## Dashboard

### Overview

The Dashboard provides a high-level summary of time tracking data across all clients and agents.

### Key Metrics Displayed

1. **Total Hours** - Total hours worked across all agents and clients
2. **Total Sessions** - Total number of work sessions recorded
3. **Active Agents** - Number of unique agents with activity
4. **Client Groups** - Number of client groups with activity

### Date Range Selection

- Use the date range picker to filter data for specific time periods
- Default view shows all available data
- Dates are in `YYYY-MM-DD` format

### Top Agents Section

- Displays agents with the most hours worked
- Shows agent name, total hours, and number of sessions
- Hours formatted as "HH hrs, MM min" (e.g., "48 hrs, 35 min")

### Top Client Groups Section

- Displays client groups with the most hours
- Shows group name, total hours, and number of sessions

### Recent Activities Section

- Lists recent time entries
- Shows agent name, time, activity type (In/Out), and client group

---

## Clients Page

### Overview

The Clients page allows you to view time tracking data organized by client group.

### Client Group List

- Lists all client groups from Jibble
- Each group shows:
  - Group name
  - Total hours worked
  - Number of agents
  - Number of sessions

### Client Group Details

Click on a client group to view detailed analytics:

#### Summary Statistics
- Total hours worked
- Total sessions
- Number of unique agents
- Number of incomplete sessions

#### Hours by Agent
- Pie chart showing hours distribution across agents
- Table listing each agent with:
  - Agent name
  - Total hours (formatted as "HH hrs, MM min")
  - Number of sessions
  - Percentage of total hours

#### Hours by Activity
- Breakdown of hours by activity type
- Shows which activities agents spent the most time on

#### Agents List
- Lists all agents in the selected client group
- Shows agent name and contact information (if available)
- Agents are sorted alphabetically by name

### Filtering and Date Ranges

- Use the date range picker to filter data for specific periods
- Data updates automatically based on selected date range

---

## Agents Page

### Overview

The Agents page provides detailed views of individual agent time tracking data.

### Agent List

- Lists all agents from Jibble
- Each agent shows:
  - Agent name
  - Email (if available)
  - Total hours worked
  - Number of sessions

### Agent Details

Click on an agent to view detailed analytics:

#### Agent Information
- Agent name
- Email address
- Timezone (if available)

#### Summary Statistics
- Total hours worked (across all client groups)
- Total sessions
- Average session duration
- Number of client groups worked with

#### Daily Activity Timeline
- Timeline view showing daily activity
- Clock-in and clock-out times
- Work session durations
- Client group assignments

#### Hours by Activity
- Breakdown of hours spent on different activities
- Shows which activities the agent focused on most

#### Clock-in/Clock-out Times
- Detailed list of clock-in and clock-out events
- Dates and times for each event
- Client group for each session

### Filtering

- Use the date range picker to filter agent data
- Filter by specific client groups (if agent worked with multiple)

---

## Activities Page

### Overview

The Activities page shows all time entry records (clock-in and clock-out events).

### Activity List

- Lists all activity entries
- Each entry shows:
  - Agent name
  - Time (formatted in local timezone)
  - Entry type (In/Out)
  - Client group name
  - Activity details

### Filtering Options

1. **Date Range** - Filter by date range
2. **Agent** - Filter by specific agent
3. **Client Group** - Filter by client group
4. **Entry Type** - Filter by In/Out entries
5. **Activity** - Filter by activity type

### Activity Statistics

The page displays:
- Total activities in the selected period
- Breakdown by entry type (In/Out)
- Breakdown by activity type
- Time distribution across days

### Pagination

- Activities are paginated (default: 50 per page)
- Navigate through pages using pagination controls
- Total count displayed at top

---

## Data Formatting

### Hours Display

All hours are displayed in "HH hrs, MM min" format:
- Example: `48 hrs, 35 min`
- Example: `160 hrs, 0 min` (for whole hours)

### Date Display

- Dates displayed in local timezone
- Format: `MMM DD, YYYY` (e.g., "Jan 15, 2024")
- Date ranges: `MMM DD - MMM DD, YYYY`

### Time Display

- Times displayed in local timezone
- 24-hour format (e.g., "14:30")
- UTC timestamps are converted to local time

---

## Common Tasks

### Viewing Weekly Data

1. Navigate to **Dashboard**
2. Select date range for the week (e.g., Nov 2 - Nov 8, 2025)
3. View summary statistics
4. Drill down into specific agents or client groups

### Analyzing Client Performance

1. Navigate to **Clients**
2. Select a client group
3. Review summary statistics
4. Analyze hours by agent breakdown
5. Check hours by activity distribution

### Monitoring Agent Activity

1. Navigate to **Agents**
2. Select an agent
3. Review daily activity timeline
4. Check clock-in/clock-out patterns
5. Analyze hours by activity

### Finding Specific Activities

1. Navigate to **Activities**
2. Apply filters (date, agent, client group)
3. Browse or search through activities
4. Review activity statistics

---

## Troubleshooting

### No Data Displayed

- Check if date range is correct
- Verify data exists for selected date range
- Check browser console for errors
- Verify API endpoints are responding

### Data Appears Incorrect

- Verify date range selection
- Check timezone settings
- Ensure data has been synced from Jibble
- Review activity logs in Vercel dashboard

### Slow Loading

- Reduce date range size
- Apply filters to limit data
- Check network connection
- Review Vercel function logs for performance issues

---

## Keyboard Shortcuts

Currently, no keyboard shortcuts are implemented. All navigation is done via mouse/touch.

---

## Browser Support

- Chrome/Edge (latest versions)
- Firefox (latest versions)
- Safari (latest versions)

---

## Tips and Best Practices

1. **Use Specific Date Ranges**: Narrow date ranges load faster and provide more focused insights
2. **Start with Dashboard**: Get an overview before diving into specific details
3. **Filter Before Drilling Down**: Use filters to reduce data volume before detailed analysis
4. **Compare Time Periods**: Use date range selection to compare different periods
5. **Monitor Incomplete Sessions**: Check for incomplete sessions that may indicate data issues

---

## Support

For issues or questions:
1. Check the troubleshooting guide: `TROUBLESHOOTING.md`
2. Review API documentation: `API_DOCUMENTATION.md`
3. Check Vercel logs for errors
4. Contact the development team

