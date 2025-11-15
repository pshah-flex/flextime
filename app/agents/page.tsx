'use client';

import { useEffect, useState } from 'react';
import DateRangePicker from '../components/DateRangePicker';
import { format } from 'date-fns';
import { getHoursByAgent, getClockInOut } from '../lib/api-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatHoursAsHrsMin } from '../lib/utils/format-hours';

export default function AgentsPage() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [clockInOut, setClockInOut] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadAgents();
  }, [startDate, endDate]);

  useEffect(() => {
    if (selectedAgent) {
      loadAgentDetails(selectedAgent);
    }
  }, [selectedAgent, startDate, endDate]);

  async function loadAgents() {
    setLoading(true);
    setError(null);
    try {
      const data = await getHoursByAgent(startDate, endDate);
      setAgents(data);
      if (data.length > 0 && !selectedAgent) {
        setSelectedAgent(data[0].agent_id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  }

  async function loadAgentDetails(agentId: string) {
    try {
      const data = await getClockInOut(startDate, endDate, agentId);
      setClockInOut(data);
    } catch (err: any) {
      console.error('Failed to load agent details:', err);
    }
  }

  const handleDateRangeChange = (newStartDate: string, newEndDate: string) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  // Filter agents based on search query (by name or email)
  const filteredAgents = agents.filter(agent => {
    const query = searchQuery.toLowerCase();
    const name = (agent.agent_name || '').toLowerCase();
    const email = (agent.agent_email || '').toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  const selectedAgentData = agents.find(a => a.agent_id === selectedAgent);

  // Prepare chart data for daily hours
  const chartData = clockInOut
    .filter(record => record.is_complete && record.total_hours)
    .map(record => ({
      date: format(new Date(record.date), 'MMM d'),
      hours: record.total_hours,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Agents</h1>
        <p className="text-gray-600">
          View individual agent time tracking data
        </p>
      </div>

      <div className="mb-6">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={handleDateRangeChange}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agents List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">All Agents</h2>
            
            {/* Search Input */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search agents by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredAgents.length > 0 ? (
                filteredAgents.map((agent) => (
                <button
                  key={agent.agent_id}
                  onClick={() => setSelectedAgent(agent.agent_id)}
                  className={`w-full text-left p-4 rounded-lg transition-colors ${
                    selectedAgent === agent.agent_id
                      ? 'bg-primary text-white'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <p className={`font-medium ${selectedAgent === agent.agent_id ? 'text-white' : 'text-gray-900'}`}>
                    {agent.agent_name}
                  </p>
                  <p className={`text-sm ${selectedAgent === agent.agent_id ? 'text-white/80' : 'text-gray-500'}`}>
                    {formatHoursAsHrsMin(agent.total_hours)} • {agent.session_count} sessions
                  </p>
                  {agent.incomplete_sessions > 0 && (
                    <p className={`text-xs mt-1 ${selectedAgent === agent.agent_id ? 'text-white/70' : 'text-orange-600'}`}>
                      ⚠️ {agent.incomplete_sessions} incomplete
                    </p>
                  )}
                </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? (
                    <>
                      <p>No agents found matching &quot;{searchQuery}&quot;</p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="mt-2 text-primary hover:underline text-sm"
                      >
                        Clear search
                      </button>
                    </>
                  ) : (
                    <p>No agents available</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Agent Details */}
        <div className="lg:col-span-2">
          {selectedAgentData ? (
            <div className="space-y-6">
              {/* Agent Summary */}
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedAgentData.agent_name}</h2>
                {selectedAgentData.agent_email && (
                  <p className="text-gray-600 mb-4">{selectedAgentData.agent_email}</p>
                )}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Hours</p>
                    <p className="text-2xl font-bold text-primary">{formatHoursAsHrsMin(selectedAgentData.total_hours)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Sessions</p>
                    <p className="text-2xl font-bold text-primary">{selectedAgentData.session_count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Incomplete</p>
                    <p className="text-2xl font-bold text-orange-600">{selectedAgentData.incomplete_sessions}</p>
                  </div>
                </div>
              </div>

              {/* Daily Hours Chart */}
              {chartData.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Daily Hours</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="hours" stroke="#163C3C" strokeWidth={2} name="Hours" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Clock-in/Clock-out Timeline */}
              {clockInOut.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Daily Timeline</h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {clockInOut.map((record) => (
                      <div
                        key={`${record.agent_id}-${record.date}`}
                        className={`p-4 rounded-lg border ${
                          record.is_complete
                            ? 'bg-green-50 border-green-200'
                            : 'bg-orange-50 border-orange-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-900">{format(new Date(record.date), 'MMM d, yyyy')}</p>
                          {record.is_complete && record.total_hours ? (
                            <p className="font-bold text-primary">{formatHoursAsHrsMin(record.total_hours)}</p>
                          ) : (
                            <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded">Incomplete</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Clock In</p>
                            <p className="font-medium text-gray-900">
                              {record.clock_in_time_utc
                                ? format(new Date(record.clock_in_time_utc), 'h:mm a')
                                : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Clock Out</p>
                            <p className="font-medium text-gray-900">
                              {record.clock_out_time_utc
                                ? format(new Date(record.clock_out_time_utc), 'h:mm a')
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 border border-gray-200 text-center">
              <p className="text-gray-500">Select an agent to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

