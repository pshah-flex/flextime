'use client';

import { useEffect, useState } from 'react';
import StatCard from './components/StatCard';
import DateRangePicker from './components/DateRangePicker';
import { format } from 'date-fns';
import { getSummaryStats, getHoursByAgent, getHoursByClientGroup } from './lib/api-client';
import { formatHoursAsHrsMin } from './lib/utils/format-hours';

export default function Dashboard() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [summary, setSummary] = useState<any>(null);
  const [topAgents, setTopAgents] = useState<any[]>([]);
  const [topGroups, setTopGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, agentsData, groupsData] = await Promise.all([
        getSummaryStats(startDate, endDate),
        getHoursByAgent(startDate, endDate),
        getHoursByClientGroup(startDate, endDate),
      ]);

      setSummary(summaryData);
      setTopAgents(agentsData.slice(0, 5));
      setTopGroups(groupsData.slice(0, 5));
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleDateRangeChange = (newStartDate: string, newEndDate: string) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
          <button
            onClick={loadData}
            className="mt-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Overview of time tracking data
        </p>
      </div>

      <div className="mb-6">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={handleDateRangeChange}
        />
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Hours"
          value={summary?.total_hours ? formatHoursAsHrsMin(summary.total_hours) : '0 hrs, 0 min'}
          subtitle={`${summary?.total_minutes || 0} minutes`}
        />
        <StatCard
          title="Total Sessions"
          value={summary?.total_sessions || 0}
          subtitle={`${summary?.incomplete_sessions || 0} incomplete`}
        />
        <StatCard
          title="Active Agents"
          value={summary?.unique_agents || 0}
          subtitle={`${summary?.unique_groups || 0} groups`}
        />
        <StatCard
          title="Client Groups"
          value={summary?.unique_groups || 0}
          subtitle={`${summary?.unique_activities || 0} activities`}
        />
      </div>

      {/* Top Agents and Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Agents */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top Agents</h2>
          {topAgents.length > 0 ? (
            <div className="space-y-3">
              {topAgents.map((agent) => (
                <div key={agent.agent_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{agent.agent_name}</p>
                    <p className="text-sm text-gray-500">{agent.session_count} sessions</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{formatHoursAsHrsMin(agent.total_hours)}</p>
                    {agent.incomplete_sessions > 0 && (
                      <p className="text-xs text-orange-600">{agent.incomplete_sessions} incomplete</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No agent data available</p>
          )}
        </div>

        {/* Top Groups */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top Client Groups</h2>
          {topGroups.length > 0 ? (
            <div className="space-y-3">
              {topGroups.map((group) => (
                <div key={group.client_group_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{group.group_name}</p>
                    <p className="text-sm text-gray-500">{group.agent_count} agents, {group.session_count} sessions</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{formatHoursAsHrsMin(group.total_hours)}</p>
                    {group.incomplete_sessions > 0 && (
                      <p className="text-xs text-orange-600">{group.incomplete_sessions} incomplete</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No group data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
